const { useState, useEffect } = React;

// Icon components as inline SVGs
const SearchIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const TrashIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const DownloadIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const RefreshIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
);

const DatabaseIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

function MondayExtractor() {
    const [activeTab, setActiveTab] = useState('contacts');
    const [data, setData] = useState({
        contacts: [],
        deals: [],
        leads: [],
        activities: []
    });
    const [lastSync, setLastSync] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [message, setMessage] = useState('');

    // Load data on mount
    useEffect(() => {
        loadData();

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.monday_data) {
                const newData = changes.monday_data.newValue;
                setData({
                    contacts: newData.contacts || [],
                    deals: newData.deals || [],
                    leads: newData.leads || [],
                    activities: newData.activities || []
                });
                setLastSync(newData.lastSync || {});
            }
        });
    }, []);

    const loadData = async () => {
        const result = await chrome.storage.local.get('monday_data');
        const mondayData = result.monday_data || {
            contacts: [],
            deals: [],
            leads: [],
            activities: [],
            lastSync: {}
        };

        setData({
            contacts: mondayData.contacts || [],
            deals: mondayData.deals || [],
            leads: mondayData.leads || [],
            activities: mondayData.activities || []
        });
        setLastSync(mondayData.lastSync || {});
    };

    const extractCurrentBoard = async () => {
        setIsExtracting(true);
        setMessage('Extracting data...');

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.url) {
                throw new Error('No active tab found');
            }

            // Check if we're on Monday.com
            if (!tab.url.includes('monday.com')) {
                setMessage('✗ Please navigate to a Monday.com board page first');
                setIsExtracting(false);
                setTimeout(() => setMessage(''), 5000);
                return;
            }

            // Send message to content script
            let response;
            try {
                response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'extractData'
                });
            } catch (err) {
                // Content script might not be loaded
                if (err.message.includes('Could not establish connection')) {
                    setMessage('✗ Please refresh the Monday.com page and try again');
                    setIsExtracting(false);
                    setTimeout(() => setMessage(''), 5000);
                    return;
                }
                throw err;
            }

            if (response && response.success) {
                // Save data via service worker
                try {
                    const saveResponse = await chrome.runtime.sendMessage({
                        action: 'saveData',
                        boardType: response.boardType,
                        data: response.data
                    });

                    if (saveResponse && saveResponse.success) {
                        setMessage(`✓ ${response.message} (${response.count} records)`);
                        await loadData();
                    } else {
                        setMessage(`✗ Failed to save data: ${saveResponse?.error || 'Unknown error'}`);
                    }
                } catch (saveError) {
                    setMessage(`✗ Failed to save data: ${saveError.message}`);
                }
            } else {
                setMessage(`✗ ${response?.message || 'Extraction failed'}`);
            }
        } catch (error) {
            console.error('Extraction error:', error);
            setMessage(`✗ Error: ${error.message || 'Make sure you\'re on a Monday.com board page'}`);
        }

        setIsExtracting(false);
        setTimeout(() => setMessage(''), 5000);
    };

    const deleteRecord = async (recordId) => {
        const result = await chrome.storage.local.get('monday_data');
        const mondayData = result.monday_data;

        mondayData[activeTab] = mondayData[activeTab].filter(item => item.id !== recordId);

        await chrome.storage.local.set({ monday_data: mondayData });
        await loadData();
    };

    const exportData = (format) => {
        const currentData = data[activeTab];

        if (format === 'json') {
            const jsonStr = JSON.stringify(currentData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monday_${activeTab}_${Date.now()}.json`;
            a.click();
        } else if (format === 'csv') {
            if (currentData.length === 0) return;

            const headers = Object.keys(currentData[0]);
            let csv = headers.join(',') + '\n';

            currentData.forEach(row => {
                const values = headers.map(h => {
                    const val = row[h];
                    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                });
                csv += values.join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `monday_${activeTab}_${Date.now()}.csv`;
            a.click();
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString();
    };

    const filteredData = data[activeTab].filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchLower)
        );
    });

    const tabs = [
        { id: 'contacts', label: 'Contacts', icon: '👤' },
        { id: 'deals', label: 'Deals', icon: '💼' },
        { id: 'leads', label: 'Leads', icon: '🎯' },
        { id: 'activities', label: 'Activities', icon: '📅' }
    ];

    return (
        <div className="w-[600px] h-[500px] bg-white flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <DatabaseIcon size={24} />
                        <h1 className="text-lg font-bold">Monday.com Extractor</h1>
                    </div>
                    <button
                        onClick={extractCurrentBoard}
                        disabled={isExtracting}
                        className="flex items-center gap-2 bg-white text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 text-sm"
                    >
                        {isExtracting ? (
                            <>
                                <RefreshIcon size={16} className="animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <DownloadIcon size={16} />
                                Extract Current Board
                            </>
                        )}
                    </button>
                </div>

                {message && (
                    <div className="text-sm bg-white/20 px-3 py-1.5 rounded">
                        {message}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-gray-50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                            {data[tab.id].length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search and Actions */}
            <div className="p-3 border-b bg-gray-50 flex gap-2">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-2.5 text-gray-400">
                        <SearchIcon size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => exportData('json')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    title="Export as JSON"
                >
                    JSON
                </button>
                <button
                    onClick={() => exportData('csv')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    title="Export as CSV"
                >
                    CSV
                </button>
            </div>

            {/* Data Display */}
            <div className="flex-1 overflow-auto p-3">
                {filteredData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <DatabaseIcon size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No {activeTab} data yet</p>
                        <p className="text-sm mt-1">Click "Extract Current Board" while on a Monday.com {activeTab} board</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredData.map((item) => (
                            <div key={item.id} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        {activeTab === 'contacts' && (
                                            <>
                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-600">{item.email}</p>
                                                <p className="text-sm text-gray-500">{item.account} • {item.title}</p>
                                            </>
                                        )}
                                        {activeTab === 'deals' && (
                                            <>
                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-600">${item.value.toLocaleString()} • {item.stage}</p>
                                                <p className="text-sm text-gray-500">{item.group}</p>
                                            </>
                                        )}
                                        {activeTab === 'leads' && (
                                            <>
                                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-600">{item.company}</p>
                                                <p className="text-sm text-gray-500">{item.status} • {item.email}</p>
                                            </>
                                        )}
                                        {activeTab === 'activities' && (
                                            <>
                                                <h3 className="font-semibold text-gray-900">{item.type}</h3>
                                                <p className="text-sm text-gray-600">{item.subject}</p>
                                                <p className="text-sm text-gray-500">{item.date}</p>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteRecord(item.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete record"
                                    >
                                        <TrashIcon size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t p-2 bg-gray-50 text-xs text-gray-600 text-center">
                Last sync: {formatDate(lastSync[activeTab])}
            </div>
        </div>
    );
}

// Render the app when DOM is ready
function renderApp() {
    try {
        const root = document.getElementById('root');
        if (!root) {
            console.error('Root element not found');
            return;
        }

        if (typeof React === 'undefined') {
            root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: React is not loaded. Please check your internet connection.</div>';
            return;
        }

        if (typeof ReactDOM === 'undefined') {
            root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: ReactDOM is not loaded. Please check your internet connection.</div>';
            return;
        }

        // Clear loading message
        root.innerHTML = '';

        // Render the app using JSX (Babel will transpile this)
        ReactDOM.render(<MondayExtractor />, root);
    } catch (error) {
        console.error('Error rendering app:', error);
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: ' + error.message + '<br><br>Check the browser console (Right-click extension icon → Inspect popup) for more details.</div>';
        }
    }
}

// Wait for everything to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(renderApp, 200);
    });
} else {
    // DOM already loaded, wait a bit for scripts to load
    setTimeout(renderApp, 200);
}