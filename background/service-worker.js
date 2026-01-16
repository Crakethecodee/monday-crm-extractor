
// Service worker for Monday.com CRM Extractor

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Monday.com CRM Extractor installed');

    // Initialize storage structure
    const result = await chrome.storage.local.get('monday_data');

    if (!result.monday_data) {
        await chrome.storage.local.set({
            monday_data: {
                contacts: [],
                deals: [],
                leads: [],
                activities: [],
                lastSync: {
                    contacts: null,
                    deals: null,
                    leads: null,
                    activities: null
                }
            }
        });
    }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Board detected notification
    if (request.action === 'boardDetected') {
        try {
            console.log(`Detected board type: ${request.boardType}`);
            if (sender.tab && sender.tab.id) {
                chrome.action.setBadgeText({
                    text: request.boardType ? request.boardType.charAt(0).toUpperCase() : '',
                    tabId: sender.tab.id
                });
                chrome.action.setBadgeBackgroundColor({ color: '#0073ea' });
            }
        } catch (error) {
            console.error('Error setting badge:', error);
        }
        return false; // Synchronous response
    }

    // Save extracted data
    if (request.action === 'saveData') {
        saveExtractedData(request.boardType, request.data)
            .then(result => {
                sendResponse({ success: true, result });
            })
            .catch(error => {
                console.error('Error in saveData:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Unknown error occurred'
                });
            });
        return true; // Keep channel open for async response
    }

    // Trigger extraction from popup
    if (request.action === 'triggerExtraction') {
        triggerExtraction(request.tabId)
            .then(result => sendResponse(result))
            .catch(error => {
                console.error('Error in triggerExtraction:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Unknown error occurred'
                });
            });
        return true; // Keep channel open for async response
    }

    // Unknown action
    return false;
});

// Save extracted data to storage
async function saveExtractedData(boardType, data) {
    try {
        const result = await chrome.storage.local.get('monday_data');

        // Initialize if doesn't exist
        let mondayData = result.monday_data;
        if (!mondayData) {
            mondayData = {
                contacts: [],
                deals: [],
                leads: [],
                activities: [],
                lastSync: {
                    contacts: null,
                    deals: null,
                    leads: null,
                    activities: null
                }
            };
        }

        if (!mondayData.lastSync) {
            mondayData.lastSync = {
                contacts: null,
                deals: null,
                leads: null,
                activities: null
            };
        }

        const results = {};
        const now = Date.now();

        // Handle mixed data (all types at once)
        if (boardType === 'mixed' && data.contacts !== undefined) {
            // Data is an object with contacts, deals, leads, activities
            ['contacts', 'deals', 'leads', 'activities'].forEach(type => {
                const newData = data[type] || [];
                if (!Array.isArray(newData)) return;

                if (!mondayData[type]) {
                    mondayData[type] = [];
                }

                const existingData = mondayData[type] || [];
                const dataMap = new Map();

                // Add existing records
                existingData.forEach(item => {
                    if (item && item.id) {
                        dataMap.set(item.id, item);
                    }
                });

                // Add/update new records
                newData.forEach(item => {
                    if (item && item.id) {
                        dataMap.set(item.id, item);
                    }
                });

                mondayData[type] = Array.from(dataMap.values());
                mondayData.lastSync[type] = now;
                results[type] = {
                    total: mondayData[type].length,
                    newRecords: newData.length
                };
            });
        } else {
            // Single board type (legacy format)
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format');
            }

            if (!mondayData[boardType]) {
                mondayData[boardType] = [];
            }

            const existingData = mondayData[boardType] || [];
            const dataMap = new Map();

            // Add existing records
            existingData.forEach(item => {
                if (item && item.id) {
                    dataMap.set(item.id, item);
                }
            });

            // Add/update new records
            data.forEach(item => {
                if (item && item.id) {
                    dataMap.set(item.id, item);
                }
            });

            mondayData[boardType] = Array.from(dataMap.values());
            mondayData.lastSync[boardType] = now;
            results[boardType] = {
                total: mondayData[boardType].length,
                newRecords: data.length
            };
        }

        await chrome.storage.local.set({ monday_data: mondayData });

        return results;
    } catch (error) {
        console.error('Error saving extracted data:', error);
        throw error;
    }
}

// Trigger extraction on active tab
async function triggerExtraction(tabId) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const targetTabId = tabId || tab.id;

        // Send message to content script
        const response = await chrome.tabs.sendMessage(targetTabId, {
            action: 'extractData'
        });

        if (response.success) {
            // Save the data
            await saveExtractedData(response.boardType, response.data);
        }

        return response;

    } catch (error) {
        return {
            success: false,
            message: `Error: ${error.message}. Make sure you're on a Monday.com board page.`
        };
    }
}

// Handle tab updates to detect Monday.com pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('monday.com')) {
        // Reset badge when navigating to Monday.com
        chrome.action.setBadgeText({ text: '', tabId });
    }
});