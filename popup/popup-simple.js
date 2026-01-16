// Simple vanilla JavaScript popup - no React, no dependencies

let currentTab = 'contacts';
let allData = {
    contacts: [],
    deals: [],
    leads: [],
    activities: []
};
let lastSync = {};

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
            renderData();
        });
    });

    // Extract button
    document.getElementById('extractBtn').addEventListener('click', extractCurrentBoard);

    // Search
    document.getElementById('searchInput').addEventListener('input', function () {
        renderData();
    });

    // Export buttons
    document.getElementById('exportJsonBtn').addEventListener('click', function () {
        exportData('json');
    });

    document.getElementById('exportCsvBtn').addEventListener('click', function () {
        exportData('csv');
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function (changes) {
        if (changes.monday_data) {
            loadData();
        }
    });
}

async function loadData() {
    try {
        const result = await chrome.storage.local.get('monday_data');
        const mondayData = result.monday_data || {
            contacts: [],
            deals: [],
            leads: [],
            activities: [],
            lastSync: {}
        };

        allData = {
            contacts: mondayData.contacts || [],
            deals: mondayData.deals || [],
            leads: mondayData.leads || [],
            activities: mondayData.activities || []
        };
        lastSync = mondayData.lastSync || {};

        updateCounts();
        renderData();
        updateLastSync();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updateCounts() {
    document.getElementById('count-contacts').textContent = allData.contacts.length;
    document.getElementById('count-deals').textContent = allData.deals.length;
    document.getElementById('count-leads').textContent = allData.leads.length;
    document.getElementById('count-activities').textContent = allData.activities.length;
}

function updateLastSync() {
    const syncTime = lastSync[currentTab];
    if (syncTime) {
        const date = new Date(syncTime);
        document.getElementById('lastSync').textContent = date.toLocaleString();
    } else {
        document.getElementById('lastSync').textContent = 'Never';
    }
}

async function extractCurrentBoard() {
    const btn = document.getElementById('extractBtn');
    const extractText = document.getElementById('extractText');
    const message = document.getElementById('message');

    btn.disabled = true;
    extractText.innerHTML = '<span class="spinner"></span> Extracting...';
    message.style.display = 'none';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.includes('monday.com')) {
            showMessage('Please navigate to a Monday.com board page first', 'error');
            btn.disabled = false;
            extractText.textContent = 'Extract Current Board';
            return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

        if (response && response.success) {
            // Save data - handle both mixed and single type
            const saveResponse = await chrome.runtime.sendMessage({
                action: 'saveData',
                boardType: response.boardType || 'mixed',
                data: response.data
            });

            if (saveResponse && saveResponse.success) {
                showMessage(`✓ ${response.message}`, 'success');
                await loadData();
            } else {
                showMessage('✗ Failed to save data', 'error');
            }
        } else {
            showMessage('✗ ' + (response?.message || 'Extraction failed'), 'error');
        }
    } catch (error) {
        console.error('Extraction error:', error);
        if (error.message && error.message.includes('Could not establish connection')) {
            showMessage('✗ Content script not loaded. Please refresh the Monday.com page and try again', 'error');
        } else {
            showMessage('✗ Error: ' + error.message, 'error');
        }
    }

    btn.disabled = false;
    extractText.textContent = 'Extract Current Board';
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.style.display = 'block';
    message.style.background = type === 'success' ? 'rgba(0,200,117,0.3)' : 'rgba(226,68,92,0.3)';

    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

function renderData() {
    const content = document.getElementById('content');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const data = allData[currentTab] || [];

    // Filter data
    const filtered = data.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm)
        );
    });

    if (filtered.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div style="font-weight: 500; margin-bottom: 8px;">No ${currentTab} data yet</div>
                <div style="font-size: 13px;">Click "Extract Current Board" while on a Monday.com ${currentTab} board</div>
            </div>
        `;
        return;
    }

    content.innerHTML = filtered.map(item => {
        return createRecordCard(item);
    }).join('');

    // Add delete handlers
    content.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            deleteRecord(id);
        });
    });
}

function createRecordCard(item) {
    let html = '<div class="record-card"><div class="record-info">';

    if (currentTab === 'contacts') {
        html += `<h3>${escapeHtml(item.name || '')}</h3>`;
        html += `<p>${escapeHtml(item.email || '')}</p>`;
        html += `<p>${escapeHtml(item.account || '')} • ${escapeHtml(item.title || '')}</p>`;
    } else if (currentTab === 'deals') {
        html += `<h3>${escapeHtml(item.name || '')}</h3>`;
        html += `<p>$${formatNumber(item.value || 0)} • ${escapeHtml(item.stage || '')}</p>`;
        html += `<p>${escapeHtml(item.group || '')}</p>`;
    } else if (currentTab === 'leads') {
        html += `<h3>${escapeHtml(item.name || '')}</h3>`;
        html += `<p>${escapeHtml(item.company || '')}</p>`;
        html += `<p>${escapeHtml(item.status || '')} • ${escapeHtml(item.email || '')}</p>`;
    } else if (currentTab === 'activities') {
        html += `<h3>${escapeHtml(item.type || '')}</h3>`;
        html += `<p>${escapeHtml(item.subject || '')}</p>`;
        html += `<p>${escapeHtml(item.date || '')}</p>`;
    }

    html += '</div>';
    html += `<button class="delete-btn" data-id="${item.id}" title="Delete">🗑️</button>`;
    html += '</div>';

    return html;
}

async function deleteRecord(id) {
    try {
        const result = await chrome.storage.local.get('monday_data');
        const mondayData = result.monday_data;

        if (mondayData && mondayData[currentTab]) {
            mondayData[currentTab] = mondayData[currentTab].filter(item => item.id !== id);
            await chrome.storage.local.set({ monday_data: mondayData });
            await loadData();
        }
    } catch (error) {
        console.error('Error deleting record:', error);
    }
}

function exportData(format) {
    const data = allData[currentTab] || [];
    if (data.length === 0) {
        showMessage('No data to export', 'error');
        return;
    }

    if (format === 'json') {
        const jsonStr = JSON.stringify(data, null, 2);
        downloadFile(jsonStr, `monday_${currentTab}_${Date.now()}.json`, 'application/json');
    } else if (format === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `monday_${currentTab}_${Date.now()}.csv`, 'text/csv');
    }
}

function convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
        const values = headers.map(h => {
            const val = row[h] || '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csv += values.join(',') + '\n';
    });

    return csv;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return Number(num).toLocaleString();
}

