// Loader script - checks if React/Babel loaded and loads popup.js
// This file is separate to avoid CSP inline script violations

// Check if React loaded
if (typeof React === 'undefined') {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: React failed to load. Please download React files to popup/lib/ folder.</div>';
    }
}

// Check if ReactDOM loaded
if (typeof ReactDOM === 'undefined') {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: ReactDOM failed to load. Please download React files to popup/lib/ folder.</div>';
    }
}

// Wait for Babel to load, then load our script
function loadApp() {
    if (typeof Babel === 'undefined') {
        console.error('Babel not loaded');
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: Babel transpiler failed to load. Please download Babel to popup/lib/ folder.</div>';
        }
        return;
    }

    // Load the popup script
    const script = document.createElement('script');
    script.type = 'text/babel';
    script.src = 'popup.js';
    script.onerror = function() {
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '<div style="padding:20px;color:#e2445c;">Error: Failed to load popup.js. Please check the file exists.</div>';
        }
    };
    document.body.appendChild(script);
}

// Wait for all scripts to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadApp, 100);
    });
} else {
    setTimeout(loadApp, 100);
}

