// Content script for extracting Monday.com CRM data

// Detect current board type
const detectBoardType = () => {
    const url = window.location.href.toLowerCase();
    const pageTitle = document.title.toLowerCase();

    // Check URL patterns
    if (url.includes('/contacts') || url.includes('contact')) {
        return 'contacts';
    }
    if (url.includes('/deals') || url.includes('/sales') || url.includes('deal')) {
        return 'deals';
    }
    if (url.includes('/leads') || url.includes('lead')) {
        return 'leads';
    }
    if (url.includes('/activities') || url.includes('activit')) {
        return 'activities';
    }

    // Check page title
    if (pageTitle.includes('contact')) {
        return 'contacts';
    }
    if (pageTitle.includes('deal') || pageTitle.includes('sales')) {
        return 'deals';
    }
    if (pageTitle.includes('lead')) {
        return 'leads';
    }
    if (pageTitle.includes('activit')) {
        return 'activities';
    }

    // Check board header/name
    const boardSelectors = [
        '[data-testid="board-header-title"]',
        '.board-header-title',
        'h1',
        '[class*="board-name"]',
        '[class*="board-title"]'
    ];

    for (const selector of boardSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent?.toLowerCase() || '';
            if (text.includes('contact')) return 'contacts';
            if (text.includes('deal') || text.includes('sales')) return 'deals';
            if (text.includes('lead')) return 'leads';
            if (text.includes('activit')) return 'activities';
        }
    }

    // If on a board page but can't detect type, return null
    if (url.includes('/boards/') || url.includes('monday.com')) {
        // Could be any board type, but we'll return null to let user know
        return null;
    }

    return null;
};

// Extract text from a cell element with multiple fallback strategies
const extractCellValue = (cell) => {
    if (!cell) return '';

    // Try multiple selector strategies for different cell types
    const selectors = [
        // Status columns
        '.status-label',
        '[class*="status"]',
        '[data-testid*="status"]',

        // Person/People columns
        '.person-picker',
        '[class*="person"]',
        '[class*="people"]',
        '[data-testid*="person"]',

        // Date columns
        '.date-text',
        '[class*="date"]',
        '[data-testid*="date"]',
        'input[type="date"]',

        // Number columns
        '.number-cell',
        '[class*="number"]',
        '[data-testid*="number"]',

        // Text columns
        'input[type="text"]',
        'textarea',
        '[contenteditable="true"]',

        // Link columns
        'a',
        '[class*="link"]',

        // Email/Phone columns
        '[href^="mailto:"]',
        '[href^="tel:"]',

        // Generic value containers
        '[class*="value"]',
        '[class*="text"]',
        'span',
        'div[class*="cell-content"]'
    ];

    for (const selector of selectors) {
        const element = cell.querySelector(selector);
        if (element) {
            const text = element.textContent?.trim() || element.value?.trim() || element.getAttribute('href')?.replace(/^(mailto:|tel:)/, '') || '';
            if (text) return text;
        }
    }

    // Fallback: get all text content, clean it up
    const text = cell.textContent?.trim() || '';
    // Remove extra whitespace
    return text.replace(/\s+/g, ' ').trim();
};

// Generate unique ID from row
const generateRowId = (cells) => {
    const firstCell = cells[0]?.textContent?.trim() || '';
    return `${firstCell}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Extract Contacts with multiple row selector strategies
const extractContacts = () => {
    const contacts = [];

    // Try multiple row selectors
    const rowSelectors = [
        '[data-testid="board-row"]',
        '.board-row',
        '[class*="board-row"]',
        '[class*="table-row"]',
        'tr[data-id]',
        '[role="row"]'
    ];

    let rows = [];
    for (const selector of rowSelectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 0) break;
    }

    rows.forEach(row => {
        // Try multiple cell selectors
        const cellSelectors = [
            '.board-cell',
            '[class*="board-cell"]',
            '[class*="table-cell"]',
            'td',
            '[role="gridcell"]',
            '[data-testid*="cell"]'
        ];

        let cells = [];
        for (const selector of cellSelectors) {
            cells = Array.from(row.querySelectorAll(selector));
            if (cells.length > 0) break;
        }

        if (cells.length > 0) {
            const contact = {
                id: generateRowId(cells),
                name: extractCellValue(cells[0]) || '',
                email: extractCellValue(cells[1]) || '',
                phone: extractCellValue(cells[2]) || '',
                account: extractCellValue(cells[3]) || '',
                title: extractCellValue(cells[4]) || '',
                owner: extractCellValue(cells[5]) || '',
                extractedAt: Date.now()
            };

            // Only add if has valid name
            if (contact.name) {
                contacts.push(contact);
            }
        }
    });

    return contacts;
};

// Extract Deals with group context
const extractDeals = () => {
    const deals = [];

    // Try multiple group selectors
    const groupSelectors = [
        '.board-group',
        '[class*="board-group"]',
        '[class*="group"]',
        '[data-testid*="group"]',
        '[role="group"]'
    ];

    let groups = [];
    for (const selector of groupSelectors) {
        groups = Array.from(document.querySelectorAll(selector));
        if (groups.length > 0) break;
    }

    if (groups.length > 0) {
        groups.forEach(group => {
            // Get group name (Active Deals, Closed Won, etc.)
            const groupHeaderSelectors = [
                '.group-header-title',
                '[class*="group-header"]',
                '[class*="group-title"]',
                'h2',
                'h3'
            ];

            let groupName = 'Ungrouped';
            for (const selector of groupHeaderSelectors) {
                const header = group.querySelector(selector);
                if (header) {
                    groupName = header.textContent.trim();
                    break;
                }
            }

            // Get rows in this group
            const rowSelectors = [
                '[data-testid="board-row"]',
                '.board-row',
                '[class*="board-row"]',
                '[class*="table-row"]',
                'tr[data-id]'
            ];

            let rows = [];
            for (const selector of rowSelectors) {
                rows = Array.from(group.querySelectorAll(selector));
                if (rows.length > 0) break;
            }

            rows.forEach(row => {
                const cellSelectors = [
                    '.board-cell',
                    '[class*="board-cell"]',
                    '[class*="table-cell"]',
                    'td',
                    '[role="gridcell"]'
                ];

                let cells = [];
                for (const selector of cellSelectors) {
                    cells = Array.from(row.querySelectorAll(selector));
                    if (cells.length > 0) break;
                }

                if (cells.length > 0) {
                    const valueText = extractCellValue(cells[1]) || '0';
                    const deal = {
                        id: generateRowId(cells),
                        name: extractCellValue(cells[0]) || '',
                        value: parseFloat(valueText.replace(/[^0-9.-]+/g, '')) || 0,
                        stage: extractCellValue(cells[2]) || '',
                        group: groupName,
                        probability: extractCellValue(cells[3]) || '',
                        closeDate: extractCellValue(cells[4]) || '',
                        owner: extractCellValue(cells[5]) || '',
                        contact: extractCellValue(cells[6]) || '',
                        extractedAt: Date.now()
                    };

                    if (deal.name) {
                        deals.push(deal);
                    }
                }
            });
        });
    }

    // If no groups found, try extracting from flat table
    if (deals.length === 0) {
        const rowSelectors = [
            '[data-testid="board-row"]',
            '.board-row',
            '[class*="board-row"]',
            '[class*="table-row"]',
            'tr[data-id]'
        ];

        let rows = [];
        for (const selector of rowSelectors) {
            rows = Array.from(document.querySelectorAll(selector));
            if (rows.length > 0) break;
        }

        rows.forEach(row => {
            const cellSelectors = [
                '.board-cell',
                '[class*="board-cell"]',
                '[class*="table-cell"]',
                'td',
                '[role="gridcell"]'
            ];

            let cells = [];
            for (const selector of cellSelectors) {
                cells = Array.from(row.querySelectorAll(selector));
                if (cells.length > 0) break;
            }

            if (cells.length > 0) {
                const valueText = extractCellValue(cells[1]) || '0';
                const deal = {
                    id: generateRowId(cells),
                    name: extractCellValue(cells[0]) || '',
                    value: parseFloat(valueText.replace(/[^0-9.-]+/g, '')) || 0,
                    stage: extractCellValue(cells[2]) || '',
                    group: 'Ungrouped',
                    probability: extractCellValue(cells[3]) || '',
                    closeDate: extractCellValue(cells[4]) || '',
                    owner: extractCellValue(cells[5]) || '',
                    contact: extractCellValue(cells[6]) || '',
                    extractedAt: Date.now()
                };

                if (deal.name) {
                    deals.push(deal);
                }
            }
        });
    }

    return deals;
};

// Extract Leads
const extractLeads = () => {
    const leads = [];

    const rowSelectors = [
        '[data-testid="board-row"]',
        '.board-row',
        '[class*="board-row"]',
        '[class*="table-row"]',
        'tr[data-id]'
    ];

    let rows = [];
    for (const selector of rowSelectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 0) break;
    }

    rows.forEach(row => {
        const cellSelectors = [
            '.board-cell',
            '[class*="board-cell"]',
            '[class*="table-cell"]',
            'td',
            '[role="gridcell"]'
        ];

        let cells = [];
        for (const selector of cellSelectors) {
            cells = Array.from(row.querySelectorAll(selector));
            if (cells.length > 0) break;
        }

        if (cells.length > 0) {
            const lead = {
                id: generateRowId(cells),
                name: extractCellValue(cells[0]) || '',
                company: extractCellValue(cells[1]) || '',
                status: extractCellValue(cells[2]) || '',
                email: extractCellValue(cells[3]) || '',
                phone: extractCellValue(cells[4]) || '',
                owner: extractCellValue(cells[5]) || '',
                extractedAt: Date.now()
            };

            if (lead.name) {
                leads.push(lead);
            }
        }
    });

    return leads;
};

// Extract Activities
const extractActivities = () => {
    const activities = [];

    const rowSelectors = [
        '[data-testid="board-row"]',
        '.board-row',
        '[class*="board-row"]',
        '[class*="table-row"]',
        'tr[data-id]'
    ];

    let rows = [];
    for (const selector of rowSelectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 0) break;
    }

    rows.forEach(row => {
        const cellSelectors = [
            '.board-cell',
            '[class*="board-cell"]',
            '[class*="table-cell"]',
            'td',
            '[role="gridcell"]'
        ];

        let cells = [];
        for (const selector of cellSelectors) {
            cells = Array.from(row.querySelectorAll(selector));
            if (cells.length > 0) break;
        }

        if (cells.length > 0) {
            const activity = {
                id: generateRowId(cells),
                type: extractCellValue(cells[0]) || '',
                subject: extractCellValue(cells[1]) || '',
                date: extractCellValue(cells[2]) || '',
                linkedTo: extractCellValue(cells[3]) || '',
                extractedAt: Date.now()
            };

            if (activity.type || activity.subject) {
                activities.push(activity);
            }
        }
    });

    return activities;
};

// Extract all data types from Monday.com board - works with real DOM structure
const extractAllFromBoard = () => {
    const contacts = [];
    const deals = [];
    const leads = [];
    const activities = [];

    // Get all rows from the table - use multiple selectors for compatibility
    let rows = [];

    // Try various row selectors used by Monday.com
    const rowSelectors = [
        '[data-testid="board-row"]',
        '[class*="board-row"]',
        '[class*="table-row"]',
        'tr[data-id]',
        '[role="row"]',
        '.board-body [role="row"]',
        '[class*="row-wrapper"]'
    ];

    for (const selector of rowSelectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 0) break;
    }

    // If still no rows, try to get by looking at the table structure
    if (rows.length === 0) {
        const tableBody = document.querySelector('tbody') || document.querySelector('[role="rowgroup"]');
        if (tableBody) {
            rows = Array.from(tableBody.querySelectorAll('[role="row"]'));
        }
    }

    // Process each row
    rows.forEach(row => {
        try {
            // Get the task/name from the first cell (usually the name/title column)
            let taskName = '';
            let allCells = [];

            // Try to find cells with multiple selectors
            const cellSelectors = [
                '[role="gridcell"]',
                'td',
                '[class*="cell"]',
                '.cell',
                '[data-testid*="cell"]'
            ];

            for (const selector of cellSelectors) {
                allCells = Array.from(row.querySelectorAll(selector));
                if (allCells.length > 0) break;
            }

            if (allCells.length === 0) return; // Skip rows with no cells

            // Get text from the first cell (task name)
            const firstCell = allCells[0];
            if (firstCell) {
                // Try different ways to get text
                taskName = firstCell.textContent?.trim() || '';

                // If empty, try to find a link or span
                if (!taskName) {
                    const link = firstCell.querySelector('a');
                    if (link) taskName = link.textContent?.trim() || '';
                }

                if (!taskName) {
                    const span = firstCell.querySelector('span');
                    if (span) taskName = span.textContent?.trim() || '';
                }
            }

            if (!taskName) return; // Skip if no name found

            // Get all cell values
            const cellValues = allCells.map((cell, index) => {
                // For the first cell, get just the name
                if (index === 0) {
                    return taskName;
                }

                // Try to extract value from the cell
                let value = '';

                // Look for text nodes
                const text = cell.textContent?.trim() || '';
                if (text && text.length > 0) {
                    value = text;
                }

                // Look for specific elements
                const span = cell.querySelector('span');
                if (!value && span) {
                    value = span.textContent?.trim() || '';
                }

                const link = cell.querySelector('a');
                if (!value && link) {
                    value = link.textContent?.trim() || '';
                }

                // Look for input values
                const input = cell.querySelector('input');
                if (!value && input) {
                    value = input.value?.trim() || '';
                }

                return value;
            });

            // Determine record type from the task name
            const nameUpper = taskName.toUpperCase();
            let recordType = null;

            if (nameUpper.includes('CONTACT')) {
                recordType = 'contact';
            } else if (nameUpper.includes('DEAL')) {
                recordType = 'deal';
            } else if (nameUpper.includes('LEAD')) {
                recordType = 'lead';
            } else if (nameUpper.includes('ACTIVITY') || nameUpper.includes('CALL') || nameUpper.includes('DEMO')) {
                recordType = 'activity';
            }

            // If no pattern match, try to detect from content
            if (!recordType) {
                // Check if any cell contains email (contacts)
                if (cellValues.some(v => v.includes('@'))) {
                    recordType = 'contact';
                }
                // Check for currency signs (deals)
                else if (cellValues.some(v => /\$|€|£|¥/.test(v))) {
                    recordType = 'deal';
                }
                // Default to contact if has typical contact data
                else {
                    recordType = 'contact';
                }
            }

            // Clean the task name
            let cleanName = taskName
                .replace(/^contact:\s*/i, '')
                .replace(/^deal:\s*/i, '')
                .replace(/^lead:\s*/i, '')
                .replace(/^activity:\s*/i, '')
                .replace(/^call:\s*/i, '')
                .trim();

            // Create record based on type
            const record = {
                id: `${cleanName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                extractedAt: Date.now(),
                originalName: taskName
            };

            if (recordType === 'contact') {
                record.name = cleanName || cellValues[0] || '';
                record.email = cellValues.find(v => v.includes('@')) || cellValues[1] || '';
                record.phone = cellValues.find(v => /[\d\s\-\(\)]{10,}/.test(v)) || cellValues[2] || '';
                record.account = cellValues[3] || '';
                record.title = cellValues[4] || '';
                record.owner = cellValues[5] || '';
                record.status = cellValues.find(v => ['working', 'done', 'stuck', 'not started'].some(s => v.toLowerCase().includes(s))) || '';

                if (record.name) contacts.push(record);
            }
            else if (recordType === 'deal') {
                record.name = cleanName || cellValues[0] || '';

                // Find value from cells
                const valueStr = cellValues.find(v => /[\d,\.]+/.test(v));
                record.value = valueStr ? parseFloat(valueStr.replace(/[^0-9.-]/g, '')) : 0;

                record.stage = cellValues.find(v => ['working', 'done', 'stuck', 'not started', 'negotiation', 'proposal'].some(s => v.toLowerCase().includes(s))) || cellValues[2] || '';
                record.probability = cellValues.find(v => v.includes('%')) || '';
                record.closeDate = cellValues.find(v => /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|^\d{1,2}$/i.test(v)) || '';
                record.owner = cellValues[5] || '';
                record.contact = cellValues[6] || '';
                record.group = 'Ungrouped';

                if (record.name) deals.push(record);
            }
            else if (recordType === 'lead') {
                record.name = cleanName || cellValues[0] || '';
                record.company = cellValues.find(v => v && v.length > 2 && !v.includes('@') && v !== record.name) || cellValues[1] || '';
                record.status = cellValues.find(v => ['working', 'done', 'stuck', 'not started'].some(s => v.toLowerCase().includes(s))) || '';
                record.email = cellValues.find(v => v.includes('@')) || '';
                record.phone = cellValues.find(v => /[\d\s\-\(\)]{10,}/.test(v)) || '';
                record.owner = cellValues[5] || '';

                if (record.name) leads.push(record);
            }
            else if (recordType === 'activity') {
                record.type = cellValues.find(v => ['call', 'email', 'meeting', 'demo', 'presentation'].some(s => v.toLowerCase().includes(s))) || 'Activity';
                record.subject = cleanName || cellValues[0] || '';
                record.date = cellValues.find(v => /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|^\d{1,2}$/i.test(v)) || cellValues[2] || '';
                record.linkedTo = cellValues.find(v => v && v.length > 2 && v !== record.subject && v !== record.date) || '';
                record.status = cellValues.find(v => ['working', 'done', 'stuck', 'not started'].some(s => v.toLowerCase().includes(s))) || '';

                if (record.subject || record.type) activities.push(record);
            }

        } catch (error) {
            console.error('Error processing row:', error);
        }
    });

    return { contacts, deals, leads, activities };
};

// Main extraction function
const extractCurrentBoard = async () => {
    let allExtracted = { contacts: [], deals: [], leads: [], activities: [] };
    let totalCount = 0;

    try {
        // Always use generic extraction that works with any board layout
        allExtracted = extractAllFromBoard();

        totalCount = allExtracted.contacts.length + allExtracted.deals.length +
            allExtracted.leads.length + allExtracted.activities.length;

        if (totalCount === 0) {
            return {
                success: false,
                message: 'No data found. Make sure the board has visible rows with data.'
            };
        }

        // Return all extracted data
        return {
            success: true,
            boardType: 'mixed',
            data: allExtracted,
            count: totalCount,
            message: `Extracted ${totalCount} records (${allExtracted.contacts.length} contacts, ${allExtracted.deals.length} deals, ${allExtracted.leads.length} leads, ${allExtracted.activities.length} activities)`
        };

    } catch (error) {
        console.error('Extraction error:', error);
        return {
            success: false,
            message: `Error extracting data: ${error.message}`
        };
    }
};

// Initialize indicator
let indicator = null;

// Function to ensure indicator class is available
function initIndicator() {
    if (typeof window.ExtractionIndicator === 'undefined') {
        console.warn('ExtractionIndicator class not available yet, waiting...');
        setTimeout(initIndicator, 100);
        return;
    }

    if (!indicator) {
        try {
            indicator = new window.ExtractionIndicator();
        } catch (error) {
            console.error('Failed to create indicator:', error);
        }
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        // Create indicator if not already created
        if (!indicator) {
            initIndicator();
        }

        // Show loading state
        if (indicator) {
            indicator.show('loading', {
                title: 'Extracting data...',
                message: 'Analyzing the current board'
            });
        }

        extractCurrentBoard().then(result => {
            if (indicator) {
                if (result.success) {
                    indicator.show('success', {
                        title: 'Success!',
                        message: result.message
                    });
                } else {
                    indicator.show('error', {
                        title: 'Extraction failed',
                        message: result.message
                    });
                }
            }

            sendResponse(result);
        });
        return true; // Keep channel open for async response
    }
});

// Auto-detect and notify when on a Monday.com board
if (window.location.hostname.includes('monday.com')) {
    const boardType = detectBoardType();
    if (boardType) {
        chrome.runtime.sendMessage({
            action: 'boardDetected',
            boardType: boardType
        });
    }
}