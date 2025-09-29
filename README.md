# ClickbaitBuster

A Chrome browser extension that transforms clickbait headlines and summaries on news.com.au into informative, straightforward content using Google's Gemini AI.

## Installation & Setup

### Prerequisites

- Google Chrome browser
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation Steps

1. **Download or Clone**: Get the extension files to your local machine

2. **Enable Developer Mode**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" on (top-right corner)

3. **Load the Extension**:
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The ClickbaitBuster extension should now appear in your extensions list

4. **Configure API Key**:
   - Click the ClickbaitBuster extension icon in your browser toolbar
   - Enter your Gemini API key in the popup
   - Click "Save Key"
   - Toggle "Enable ClickbaitBuster" to activate

5. **Test the Extension**:
   - Visit [news.com.au](https://www.news.com.au)
   - Watch as headlines are automatically rewritten as you scroll

## Configuration

### API Settings

The extension requires a Gemini API key to function. Configure this through the extension popup:

- **API Key**: Your personal Gemini API key (stored locally)
- **Enable Toggle**: Turn the extension on/off without losing your API key

### Caching Behavior

- **Storage**: Uses Chrome's local storage for caching rewritten content
- **Cache Keys**: Based on base64-encoded article URLs
- **Cleanup**: Automatic cache clearing every 7 days via Chrome alarms API
- **Performance**: Prevents redundant API calls for previously processed articles