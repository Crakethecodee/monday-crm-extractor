// Visual feedback indicator using Shadow DOM

class ExtractionIndicator {
    constructor() {
        this.container = null;
        this.shadow = null;
    }

    create() {
        // Create container element
        this.container = document.createElement('div');
        this.container.id = 'monday-extractor-indicator';

        // Attach shadow DOM for style isolation
        this.shadow = this.container.attachShadow({ mode: 'open' });

        // Create indicator HTML
        const indicatorHTML = `
      <style>
        .indicator-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .indicator {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 280px;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        .indicator.hiding {
          animation: slideOut 0.3s ease-out;
        }
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e0e0e0;
          border-top-color: #0073ea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .icon.success {
          color: #00c875;
        }
        
        .icon.error {
          color: #e2445c;
        }
        
        .content {
          flex: 1;
        }
        
        .title {
          font-weight: 600;
          font-size: 14px;
          color: #323338;
          margin: 0 0 4px 0;
        }
        
        .message {
          font-size: 13px;
          color: #676879;
          margin: 0;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #676879;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          font-size: 20px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        
        .close-btn:hover {
          opacity: 1;
        }
        
        .progress-bar {
          height: 3px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: #0073ea;
          width: 0%;
          transition: width 0.3s ease;
        }
      </style>
      
      <div class="indicator-wrapper">
        <div class="indicator" id="indicator-card">
          <div id="indicator-icon"></div>
          <div class="content">
            <div class="title" id="indicator-title">Extracting data...</div>
            <div class="message" id="indicator-message">Please wait</div>
            <div class="progress-bar" id="progress-bar" style="display: none;">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
          </div>
          <button class="close-btn" id="close-btn">×</button>
        </div>
      </div>
    `;

        this.shadow.innerHTML = indicatorHTML;

        // Add close button functionality
        const closeBtn = this.shadow.getElementById('close-btn');
        closeBtn.addEventListener('click', () => this.hide());

        // Append to document
        document.body.appendChild(this.container);
    }

    show(state = 'loading', options = {}) {
        if (!this.shadow) {
            this.create();
        }

        const iconEl = this.shadow.getElementById('indicator-icon');
        const titleEl = this.shadow.getElementById('indicator-title');
        const messageEl = this.shadow.getElementById('indicator-message');
        const progressBar = this.shadow.getElementById('progress-bar');
        const progressFill = this.shadow.getElementById('progress-fill');

        switch (state) {
            case 'loading':
                iconEl.innerHTML = '<div class="spinner"></div>';
                titleEl.textContent = options.title || 'Extracting data...';
                messageEl.textContent = options.message || 'Please wait while we extract the data';
                progressBar.style.display = 'block';
                progressFill.style.width = options.progress ? `${options.progress}%` : '30%';
                break;

            case 'success':
                iconEl.innerHTML = `
          <svg class="icon success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        `;
                titleEl.textContent = options.title || 'Extraction complete!';
                messageEl.textContent = options.message || 'Data has been saved successfully';
                progressBar.style.display = 'none';

                // Auto-hide after 3 seconds
                setTimeout(() => this.hide(), 3000);
                break;

            case 'error':
                iconEl.innerHTML = `
          <svg class="icon error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        `;
                titleEl.textContent = options.title || 'Extraction failed';
                messageEl.textContent = options.message || 'An error occurred during extraction';
                progressBar.style.display = 'none';

                // Auto-hide after 5 seconds
                setTimeout(() => this.hide(), 5000);
                break;
        }

        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    updateProgress(progress, message) {
        if (!this.shadow) return;

        const progressFill = this.shadow.getElementById('progress-fill');
        const messageEl = this.shadow.getElementById('indicator-message');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (message && messageEl) {
            messageEl.textContent = message;
        }
    }

    hide() {
        if (!this.shadow) return;

        const card = this.shadow.getElementById('indicator-card');
        card.classList.add('hiding');

        setTimeout(() => {
            if (this.container) {
                this.container.style.display = 'none';
            }
        }, 300);
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.shadow = null;
    }
}

// Export for use in content script
window.ExtractionIndicator = ExtractionIndicator;