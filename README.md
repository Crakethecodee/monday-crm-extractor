# Monday.com CRM Data Extractor

A Chrome Extension that extracts data from Monday.com CRM boards (Contacts, Deals, Leads, Activities) and provides a beautiful dashboard to manage the extracted data locally.

## Features

- ✅ Extract data from 4 board types: Contacts, Deals, Leads, Activities
- ✅ Support for grouped Deals (Active Deals, Closed Won, etc.)
- ✅ Local data storage with deduplication
- ✅ Beautiful React dashboard with Tailwind CSS
- ✅ Search and filter functionality
- ✅ Export to CSV or JSON
- ✅ Real-time sync across browser tabs
- ✅ Visual feedback with Shadow DOM
- ✅ Persistent storage across sessions

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Clone or download this repository:
```bash
git clone https://github.com/yourusername/monday-crm-extractor.git
cd monday-crm-extractor
```

2. **No build step required!** The extension uses CDN React and works directly.

3. Open Chrome and navigate to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top right)

5. Click "Load unpacked"

6. Select the project folder (the folder containing `manifest.json`)

7. The extension icon should appear in your toolbar!

**Note:** Make sure you're on a Monday.com page when testing the extension.

### Method 2: Install from Chrome Web Store (Production)

Coming soon...

## Usage

### 1. Navigate to Monday.com

Go to your Monday.com CRM workspace and open any board:
- Contacts board
- Deals/Sales Pipeline board
- Leads board
- Activities board

### 2. Extract Data

Click the extension icon in your toolbar and click the "Extract Current Board" button. The extension will:
- Detect which board type you're viewing
- Extract all visible data from the board
- Save it locally with deduplication
- Show a success notification

### 3. View Dashboard

The popup dashboard shows all extracted data organized by tabs:
- **Contacts**: Name, email, phone, account, title, owner
- **Deals**: Name, value, stage, group, probability, close date, owner
- **Leads**: Name, company, status, email, phone, owner
- **Activities**: Type, subject, date, linked entities

### 4. Search & Filter

Use the search bar to filter records across all fields in real-time.

### 5. Export Data

Click the "JSON" or "CSV" buttons to export the current board's data.

### 6. Delete Records

Click the trash icon next to any record to remove it from local storage.

## Architecture

### Storage Schema

```javascript
{
  "monday_data": {
    "contacts": [
      {
        "id": "unique-id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "account": "Acme Corp",
        "title": "CEO",
        "owner": "Jane Smith",
        "extractedAt": 1234567890
      }
    ],
    "deals": [
      {
        "id": "unique-id",
        "name": "Big Enterprise Deal",
        "value": 50000,
        "stage": "Negotiation",
        "group": "Active Deals",
        "probability": "75%",
        "closeDate": "2024-12-31",
        "owner": "Sales Rep",
        "contact": "John Doe",
        "extractedAt": 1234567890
      }
    ],
    "leads": [...],
    "activities": [...],
    "lastSync": {
      "contacts": 1234567890,
      "deals": 1234567890,
      "leads": null,
      "activities": null
    }
  }
}
```

### DOM Selection Strategy

Monday.com uses a component-based architecture with specific data attributes and class names. Our extraction strategy:

#### 1. Board Type Detection
- Analyze URL patterns (`/boards/{id}`)
- Check page title and board header
- Look for specific board indicators

#### 2. Data Extraction Selectors

**Main Board Structure:**
```javascript
// Groups (for Deals)
document.querySelectorAll('.board-group')

// Group headers
group.querySelector('.group-header-title')

// Rows
document.querySelectorAll('.board-row[data-testid="board-row"]')

// Cells
row.querySelectorAll('.board-cell')
```

**Cell Value Extraction:**
```javascript
// Status columns
cell.querySelector('.status-label')

// People/Owner columns
cell.querySelector('.person-picker')

// Date columns
cell.querySelector('.date-text')

// Number columns
cell.querySelector('.number-cell')

// Fallback
cell.textContent.trim()
```

#### 3. Handling Different Views

**Table View:** Standard row-column structure
**Kanban View:** Card-based layout (bonus feature)

#### 4. Edge Cases Handled
- Empty cells return empty strings
- Missing groups default to "Ungrouped"
- Invalid numbers default to 0
- Duplicate IDs are deduplicated on save

### Component Architecture

```
┌─────────────────────────────────────┐
│         Service Worker              │
│  (Background coordination)          │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌──────────┐
│ Content │      │  Popup   │
│ Script  │      │Dashboard │
│         │      │ (React)  │
└────┬────┘      └────┬─────┘
     │                │
     ▼                ▼
┌─────────────────────────┐
│   chrome.storage.local  │
│    (Persistent Data)    │
└─────────────────────────┘
```

## Message Passing Flow

1. **User clicks "Extract"** → Popup sends message to Service Worker
2. **Service Worker** → Forwards to Content Script on active tab
3. **Content Script** → Extracts data and returns to Service Worker
4. **Service Worker** → Saves to chrome.storage.local
5. **Storage Change Event** → Updates all open popups in real-time

## Technical Stack

- **Manifest V3**: Latest Chrome Extension format
- **React 18**: UI framework
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Chrome APIs**: storage.local, tabs, runtime, scripting
- **Shadow DOM**: Style isolation for page indicators

## File Structure

```
monday-crm-extractor/
├── manifest.json                 # Extension configuration
├── README.md                     # This file
├── popup/
│   ├── popup.html               # Popup entry point
│   ├── popup.js                 # React dashboard app
│   └── popup.css                # Custom styles (if needed)
├── content/
│   ├── content.js               # Data extraction logic
│   └── indicator.js             # Visual feedback component
├── background/
│   └── service-worker.js        # Background coordination
├── utils/
│   ├── storage.js               # Storage management
│   └── helpers.js               # Utility functions
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

### Prerequisites
- Chrome/Chromium browser (latest version recommended)
- Monday.com account with CRM access
- No Node.js or build tools required - extension works directly!

### Project Structure
The extension uses:
- **CDN React** - No bundling needed, React loads from CDN
- **TailwindCSS CDN** - Styling via CDN
- **Vanilla JavaScript** - Content scripts and service worker
- **Chrome APIs** - Storage, messaging, tabs

### Testing
1. Create test boards in Monday.com with sample data
2. Load the extension in Chrome
3. Test extraction on each board type
4. Verify data persistence after page refresh
5. Test search, filter, and delete functionality

### Debugging
- Open Chrome DevTools for popup: Right-click extension icon → Inspect popup
- View service worker logs: chrome://extensions → Service worker
- Content script console: Regular page DevTools console

## Known Limitations

- Requires manual trigger (not automatic background sync)
- Extracts only visible data (no pagination handling in base version)
- DOM selectors may break if Monday.com updates their structure
- No API integration (DOM scraping only)

## Future Enhancements

- [ ] Automatic background sync on schedule
- [ ] Handle infinite scroll/pagination
- [ ] Export to Excel (.xlsx)
- [ ] Kanban view extraction
- [ ] Advanced filtering and sorting
- [ ] Data analytics dashboard
- [ ] Sync with external databases

## Troubleshooting

**Extension doesn't appear:**
- Check that Developer Mode is enabled in chrome://extensions
- Verify all files are in correct locations

**Extraction fails:**
- Ensure you're on a Monday.com CRM board page
- Check if Monday.com updated their DOM structure
- Open DevTools console to see error messages

**Data not persisting:**
- Check chrome://extensions for any errors
- Verify storage permissions in manifest.json

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use and modify

## Demo Video

[Link to demo video showing extraction, dashboard, and all features]

## Contact

For questions or issues, please open a GitHub issue or contact [your email].