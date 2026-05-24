# Smith - Content Extraction Extension

Extract recipes and Reddit threads into clean, structured formats. One click — no scrolling through blog stories or messy comment sections.

## Features

### Recipe Extraction
- **One-Click Extraction**: Click the Smith toolbar icon on any recipe page
- **Smart Detection**: Automatically detects JSON-LD structured recipe data for instant, free extraction
- **LLM Fallback**: Uses GPT-4o-mini to extract recipes from pages without structured data
- **Beautiful UI**: Warm, kitchen-friendly design with clean typography and intuitive layout
- **Print & Copy**: Print-optimized layout and one-click copy to clipboard

### Reddit Thread Extraction
- **Auto-Detection**: Automatically detects Reddit threads and switches to thread mode
- **Complete Capture**: Extracts OP post + all comments with proper hierarchy
- **LLM-Ready Format**: Copy button formats thread as clean plain text, perfect for pasting into ChatGPT, Claude, or any LLM
- **Nested Comments**: Preserves reply structure with indentation (up to 5 levels deep)
- **Works on All Reddit Versions**: Supports new Reddit, old Reddit, and all layout variations

### General
- **Privacy-First**: API key stored locally, no external data collection
- **Smart Routing**: Same button works for both recipes and Reddit — detects content type automatically

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `Smith_Button` folder

### Generate Icons (First Time Setup)

The extension needs PNG icons. To generate them:

1. Open `create-icons.html` in your browser
2. The browser will download three icon files: `icon16.png`, `icon48.png`, and `icon128.png`
3. Move these files to the `icons/` folder in the extension directory
4. Reload the extension in Chrome

## Setup

1. After installing, click the Smith Button icon in your toolbar
2. If you see "API Key Required", click "Set Up API Key"
3. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
4. Paste your key and click "Save API Key"

**Note**: Many recipe sites use structured data, so you may not need the API key for most recipes. It's only used as a fallback.

## Usage

### For Recipes

1. Navigate to any recipe webpage
2. Click the Smith icon in your browser toolbar
3. The side panel will open with your extracted recipe
4. Use the toolbar buttons to:
   - **Print**: Open print dialog with print-optimized layout
   - **Copy**: Copy recipe as plain text to clipboard
   - **Settings**: Update your API key

### For Reddit Threads

1. Navigate to any Reddit thread (must be a `/r/.../comments/...` URL)
2. Click the Smith icon in your browser toolbar
3. The side panel will open with the structured thread:
   - OP post at the top
   - Comments below with proper nesting
   - Upvote scores and usernames preserved
4. Click **Copy** to get LLM-ready plain text format
5. Paste into ChatGPT, Claude, or any LLM for analysis

**Why use this for Reddit?** LLMs that claim to "read Reddit links" often miss comments, fail to capture nested replies, or hit rate limits. Smith extracts everything locally and formats it perfectly for LLM input.

## How It Works

### Recipe Mode
1. **JSON-LD First**: The extension first checks for structured recipe data (JSON-LD with `@type: Recipe`)
2. **LLM Fallback**: If no structured data is found, it sends the page content to GPT-4o-mini for extraction
3. **Clean Display**: Recipe is normalized and displayed in a beautiful, standardized format

### Reddit Thread Mode
1. **Auto-Detection**: Checks if the URL matches `reddit.com/r/.../comments/...`
2. **DOM Extraction**: Parses the page DOM to extract OP post, comments, authors, scores, and reply hierarchy
3. **Multi-Layout Support**: Works with new Reddit web components, legacy React divs, and old Reddit HTML
4. **Structured Output**: Displays in clean hierarchy or copies as indented plain text for LLM input

## Privacy & Security

- Your API key is stored in Chrome's sync storage (encrypted and synced across your devices)
- The key is only sent to OpenAI's API when extracting recipes
- No recipe data or browsing history is collected or stored externally
- All processing happens locally in your browser

## File Structure

```
Smith_Button/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker - routes recipe vs thread mode, handles API calls
├── content.js             # Content script - detects content type, extracts recipes + Reddit threads
├── panel.html             # Side panel UI (recipe card + thread view)
├── panel.js               # Side panel logic - renders recipes or threads
├── panel.css              # Side panel styles
├── settings.html          # API key settings page
├── settings.js            # Settings logic
├── settings.css           # Settings styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/                 # Utility modules
    ├── extractor.js       # JSON-LD parser + LLM extraction (recipes only)
    ├── schema.js          # Recipe schema validation
    └── printer.js         # Print & copy formatting (recipes only)
```

## Data Schemas

### Recipe Schema

Extracted recipes follow this standardized schema:

```json
{
  "title": "string",
  "servings": "string",
  "prepTime": "string or null",
  "cookTime": "string or null",
  "totalTime": "string or null",
  "ingredients": [
    {
      "amount": "string",
      "unit": "string",
      "item": "string",
      "note": "string or null"
    }
  ],
  "steps": [
    {
      "number": 1,
      "instruction": "string",
      "time": "string or null"
    }
  ],
  "sourceUrl": "string",
  "sourceTitle": "string"
}
```

### Reddit Thread Schema

Extracted threads follow this structure:

```json
{
  "title": "Thread title",
  "subreddit": "subreddit_name",
  "url": "https://reddit.com/...",
  "op": {
    "author": "username",
    "body": "Post text content",
    "score": "1.2k"
  },
  "comments": [
    {
      "depth": 0,
      "author": "commenter",
      "body": "Comment text",
      "score": "142"
    },
    {
      "depth": 1,
      "author": "replier",
      "body": "Nested reply text",
      "score": "23"
    }
  ]
}
```

**Copy Format** (plain text for LLMs):
```
REDDIT THREAD
=============
r/subreddit — Thread Title
https://reddit.com/...

--- ORIGINAL POST (u/username) ---
[post body]

--- COMMENTS ---

[u/commenter [142 pts]]
Top-level comment...

  [u/replier [23 pts]]
  Nested reply...
```

## Troubleshooting

### "No Recipe Found"
- Make sure you're on a page that contains a recipe (not a Reddit thread)
- Try a different recipe site (some sites may have unusual formatting)
- If you're on a Reddit thread, the extension should auto-detect and show the thread view instead

### Reddit Thread Issues
- **Empty comments**: Some Reddit threads lazy-load comments — scroll down to load them before clicking Smith
- **Missing nested replies**: Click "Show more replies" links on Reddit before extracting
- **[deleted] comments**: These are preserved as `[deleted]` in the output
- **Wrong layout detected**: Works on new Reddit, old Reddit (`old.reddit.com`), and all variations — if extraction fails, try refreshing the page

### API Errors (Recipes Only)
- Verify your API key is correct in Settings
- Check that your OpenAI account has available credits
- Ensure you have an active internet connection

### Extension Not Loading
- Make sure all icon files are in the `icons/` folder
- Try reloading the extension in `chrome://extensions/`
- Check the browser console for errors

## Roadmap

**V1 (Current)**
- ✅ Recipe extraction (JSON-LD + LLM fallback)
- ✅ Reddit thread extraction
- ✅ Auto-detection and smart routing

**V2+ (Future)**
- Allergy/ingredient checking module
- Recipe saving and favorites
- Recipe scaling and modification
- Sharing features
- Support for other content types (legal documents, articles, etc.)
- HackerNews thread extraction
- Twitter/X thread extraction

## About

**Smith** is the first product from **A.I. Smith Studio**. Starting with recipe extraction and Reddit thread formatting, Smith is designed to be a modular content extraction platform that intelligently detects and structures any type of web content for easy consumption and LLM analysis.

## License

Copyright © 2026 A.I. Smith Studio. All rights reserved.
