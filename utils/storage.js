// Storage utility functions for Monday.com data

const STORAGE_KEY = 'monday_data';

// Initialize storage structure
const initializeStorage = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    if (!result[STORAGE_KEY]) {
        const initialData = {
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

        await chrome.storage.local.set({ [STORAGE_KEY]: initialData });
        return initialData;
    }

    return result[STORAGE_KEY];
};

// Get all data
const getAllData = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || await initializeStorage();
};

// Get specific board data
const getBoardData = async (boardType) => {
    const data = await getAllData();
    return data[boardType] || [];
};

// Save board data with deduplication
const saveBoardData = async (boardType, newData) => {
    const allData = await getAllData();
    const existingData = allData[boardType] || [];

    // Deduplicate by ID
    const dataMap = new Map();

    // Add existing data
    existingData.forEach(item => {
        dataMap.set(item.id, item);
    });

    // Add/update new data
    newData.forEach(item => {
        dataMap.set(item.id, item);
    });

    // Convert back to array
    allData[boardType] = Array.from(dataMap.values());
    allData.lastSync[boardType] = Date.now();

    await chrome.storage.local.set({ [STORAGE_KEY]: allData });

    return allData[boardType];
};

// Delete a single record
const deleteRecord = async (boardType, recordId) => {
    const allData = await getAllData();

    if (allData[boardType]) {
        allData[boardType] = allData[boardType].filter(item => item.id !== recordId);
        await chrome.storage.local.set({ [STORAGE_KEY]: allData });
    }

    return allData[boardType];
};

// Clear all data for a board type
const clearBoardData = async (boardType) => {
    const allData = await getAllData();
    allData[boardType] = [];
    allData.lastSync[boardType] = null;
    await chrome.storage.local.set({ [STORAGE_KEY]: allData });
};

// Clear all data
const clearAllData = async () => {
    await chrome.storage.local.remove(STORAGE_KEY);
    return await initializeStorage();
};

// Export data as JSON
const exportAsJSON = async () => {
    const data = await getAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return URL.createObjectURL(blob);
};

// Export data as CSV
const exportAsCSV = async (boardType) => {
    const data = await getBoardData(boardType);

    if (data.length === 0) return null;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    return URL.createObjectURL(blob);
};

// Listen for storage changes (for real-time sync across tabs)
const onStorageChange = (callback) => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes[STORAGE_KEY]) {
            callback(changes[STORAGE_KEY].newValue);
        }
    });
};

export {
    initializeStorage,
    getAllData,
    getBoardData,
    saveBoardData,
    deleteRecord,
    clearBoardData,
    clearAllData,
    exportAsJSON,
    exportAsCSV,
    onStorageChange
};