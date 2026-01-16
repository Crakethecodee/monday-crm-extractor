# Monday.com CRM Data Extractor

A Chrome Extension that extracts data from Monday.com CRM boards (Contacts, Deals, Leads, Activities) and provides a clean dashboard interface to manage the extracted data locally.

## Features

This extension allows you to extract data from four main board types: Contacts, Deals, Leads, and Activities. It supports grouped Deals with different stages like Active Deals and Closed Won. All extracted data is stored locally with automatic deduplication to prevent duplicate entries.

The dashboard is built with React and Tailwind CSS, offering an intuitive interface for viewing your extracted data. You can search across all fields, filter records in real-time, and export your data to either CSV or JSON format. The extension provides real-time synchronization across multiple browser tabs and includes visual feedback when extracting data. All data persists across browser sessions.

## Installation

### Load Unpacked Extension (Development Mode)

Start by cloning or downloading this repository:

```bash
git clone https://github.com/yourusername/monday-crm-extractor.git
cd monday-crm-extractor
```

The extension works directly without any build process since it uses CDN-based React. Open Chrome and navigate to `chrome://extensions/`, then enable Developer mode using the toggle in the top right corner. Click "Load unpacked" and select the project folder containing the `manifest.json` file. The extension icon should now appear in your toolbar.

Make sure you're on a Monday.com page when testing the extension for the first time.

## Usage

### Navigating to Monday.com

Open your Monday.com CRM workspace and navigate to any of the supported board types: Contacts, Deals or Sales Pipeline, Leads, or Activities.

### Extracting Data

Click the extension icon in your browser toolbar and then click the "Extract Current Board" button. The extension automatically detects which type of board you're currently viewing, extracts all visible data from that board, saves it locally while removing any duplicates, and displays a success notification when complete.

### Viewing the Dashboard

The popup dashboard organizes all your extracted data into separate tabs. The Contacts tab shows name, email, phone, account, title, and owner information. The Deals tab displays name, value, stage, group, probability, close date, and owner details. Leads include name, company, status, email, phone, and owner. Activities show the type, subject, date, and any linked entities.

### Searching and Filtering

Use the search bar at the top of any tab to filter records. The search works across all fields and updates results in real-time as you type.

### Exporting Data

Each tab has JSON and CSV export buttons. Click either button to download the current board's data in your preferred format.

### Managing Records

Every record has a trash icon next to it. Click this icon to permanently remove that record from your local storage.

## Architecture

### Storage Schema

The extension stores data in a structured format using Chrome's local storage API. Each board type maintains its own array of records with specific fields relevant to that type.

For contacts, each record includes a unique ID, name, email, phone number, associated account, job title, owner, and a timestamp indicating when it was extracted.

Deals store the deal name, monetary value, current stage, group classification, probability percentage, expected close date, assigned owner, associated contact, and extraction timestamp.

Leads and activities follow similar patterns with their relevant fields. The storage also maintains a lastSync object tracking the most recent extraction time for each board type.

### DOM Selection Strategy

Monday.com uses a component-based architecture with specific HTML attributes and CSS classes. The extension leverages these to reliably extract data.

#### Board Type Detection

The extension analyzes the current page URL pattern looking for board IDs, checks the page title and board header text, and searches for specific visual indicators that identify the board type.

#### Data Extraction Process

The main board structure is accessed through specific selectors. For grouped boards like Deals, the extension first identifies all groups using the board-group class. Within each group, it locates the header to determine the group name, then finds all rows marked with the board-row data attribute.

Each row contains multiple cells, and the extension extracts values using different strategies depending on the column type. Status columns are identified by the status-label class, people or owner columns use the person-picker selector, dates are found with the date-text class, and numbers use the number-cell class. If none of these specific types match, the extension falls back to extracting the cell's text content.

#### Handling Different Views

The extension primarily supports table view with its standard row-column structure. Kanban view support is planned as a future enhancement.

#### Edge Cases

The extraction logic handles several edge cases gracefully. Empty cells return empty strings rather than causing errors. If a board doesn't have groups, records are assigned to an "Ungrouped" category. Invalid or missing numbers default to zero. When duplicate IDs are detected during save operations, the newer record replaces the older one.

### Component Architecture

The extension consists of three main components working together. The service worker handles background coordination and message routing between components. The content script runs on Monday.com pages and performs the actual data extraction. The popup dashboard provides the React-based user interface for viewing and managing data.

All components communicate through Chrome's messaging API and share data through chrome.storage.local, which provides persistent storage across browser sessions.

## Message Passing Flow

When you click the Extract button in the popup, it sends a message to the service worker. The service worker identifies the active Monday.com tab and forwards the extraction request to that tab's content script. The content script performs the extraction and returns the data back to the service worker. The service worker then saves the data to chrome.storage.local. Finally, any open popup windows detect the storage change and automatically update their display with the new data.

## Technical Stack

The extension is built on Manifest V3, which is the latest Chrome Extension format. The user interface uses React 18 as the framework, styled with Tailwind CSS using a utility-first approach. Icons come from the Lucide React library. Chrome APIs provide storage through storage.local, tab management, runtime messaging, and script injection capabilities. Visual indicators on the page use Shadow DOM for style isolation.

## File Structure

The project is organized into several directories. The root contains manifest.json which configures the extension, and this README file. The popup directory holds popup.html as the entry point, popup.js containing the React dashboard application, and an optional popup.css for custom styles.

Content scripts live in the content directory, with content.js handling data extraction logic and indicator.js managing visual feedback components. The background directory contains service-worker.js for background coordination. Utility functions are organized in the utils directory with storage.js managing storage operations and helpers.js providing general utility functions. Extension icons of various sizes are stored in the assets directory.

## Development

### Prerequisites

You'll need a recent version of Chrome or Chromium browser and a Monday.com account with access to CRM features. Unlike many modern extensions, this one doesn't require Node.js or any build tools since it works directly with CDN-hosted libraries.

### Project Structure Details

The extension loads React from a CDN, eliminating the need for bundling or compilation. TailwindCSS also comes from a CDN for styling. Content scripts and the service worker use vanilla JavaScript for maximum compatibility. All browser integration relies on standard Chrome APIs for storage, messaging, and tab management.

### Testing Approach

Create several test boards in your Monday.com workspace with sample data representing different scenarios. Load the extension into Chrome in developer mode. Test the extraction functionality on each supported board type, verifying that the data appears correctly in the dashboard. Refresh the browser and confirm that all data persists properly. Finally, test the search functionality, filtering options, and record deletion to ensure everything works as expected.


## Known Limitations

The extension requires you to manually trigger data extraction rather than running automatic background syncs. It only extracts data that's currently visible on the page and doesn't handle pagination in the base version. The DOM selectors used for extraction may break if Monday.com significantly updates their HTML structure. The extension works through DOM scraping rather than API integration, which limits its reliability compared to official API access.

## Future Enhancements

Planned improvements include automatic background synchronization on a configurable schedule, intelligent handling of infinite scroll and paginated content, Excel export functionality, support for extracting data from Kanban view layouts, more sophisticated filtering and sorting options, a comprehensive analytics dashboard, and the ability to sync data with external databases or services.

## Troubleshooting

If the extension doesn't appear in your toolbar, verify that Developer Mode is enabled in chrome://extensions and check that all project files are in their correct locations according to the file structure outlined above.

When extraction fails, first ensure you're on an actual Monday.com CRM board page rather than a settings or home page. Consider whether Monday.com might have recently updated their interface structure, which could break the DOM selectors. Open the browser's DevTools console to look for any error messages that might indicate what went wrong.

If data isn't persisting between sessions, check chrome://extensions for any error messages related to the extension. Also verify that the storage permissions are correctly specified in the manifest.json file.

## Contributing

Contributions to this project are welcome. Please fork the repository, create a new feature branch for your changes, implement your improvements or fixes, and submit a pull request with a clear description of what you've changed and why.

## License

This project is released under the MIT License, which means you're free to use and modify it for your own purposes.

## Contact

For questions, bug reports, or feature requests, please open an issue on the GitHub repository.
