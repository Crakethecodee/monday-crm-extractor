// Helper utility functions for Monday.com CRM Extractor

// Generate a unique ID for records
const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}${timestamp}-${random}`;
};

// Create a stable ID from record data (for deduplication)
const createStableId = (record, boardType) => {
    if (boardType === 'contacts') {
        const email = record.email?.toLowerCase().trim() || '';
        const name = record.name?.toLowerCase().trim() || '';
        return `${name}-${email}`;
    } else if (boardType === 'deals') {
        const name = record.name?.toLowerCase().trim() || '';
        const contact = record.contact?.toLowerCase().trim() || '';
        return `${name}-${contact}`;
    } else if (boardType === 'leads') {
        const email = record.email?.toLowerCase().trim() || '';
        const name = record.name?.toLowerCase().trim() || '';
        return `${name}-${email}`;
    } else if (boardType === 'activities') {
        const subject = record.subject?.toLowerCase().trim() || '';
        const date = record.date?.toLowerCase().trim() || '';
        return `${subject}-${date}`;
    }
    return generateUniqueId();
};

// Format date for display
const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
        return new Date(timestamp).toLocaleString();
    } catch (e) {
        return 'Invalid date';
    }
};

// Format currency
const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

// Sanitize text (remove extra whitespace, trim)
const sanitizeText = (text) => {
    if (!text) return '';
    return String(text).replace(/\s+/g, ' ').trim();
};

// Validate email format
const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone format (basic)
const isValidPhone = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Check if we're on a Monday.com page
const isMondayPage = () => {
    return window.location.hostname.includes('monday.com');
};

// Wait for element to appear in DOM
const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
};

// Export CSV helper
const convertToCSV = (data, headers = null) => {
    if (!data || data.length === 0) return '';

    const keys = headers || Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(keys.join(','));

    // Add data rows
    data.forEach(row => {
        const values = keys.map(key => {
            const value = row[key] || '';
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};

// Export JSON helper
const convertToJSON = (data, pretty = true) => {
    if (pretty) {
        return JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
};

// Download file helper
const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Error handler
const handleError = (error, context = '') => {
    console.error(`[Monday Extractor] Error${context ? ` in ${context}` : ''}:`, error);
    return {
        success: false,
        error: error.message || String(error),
        context
    };
};

// Log helper
const log = (message, data = null) => {
    if (data) {
        console.log(`[Monday Extractor] ${message}`, data);
    } else {
        console.log(`[Monday Extractor] ${message}`);
    }
};

// Export all helpers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateUniqueId,
        createStableId,
        formatDate,
        formatCurrency,
        sanitizeText,
        isValidEmail,
        isValidPhone,
        debounce,
        isMondayPage,
        waitForElement,
        convertToCSV,
        convertToJSON,
        downloadFile,
        handleError,
        log
    };
}

