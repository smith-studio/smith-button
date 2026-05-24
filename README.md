# Smith - Reddit Thread Extractor for LLM Analysis

Extract full Reddit threads (OP + all comments) and format them for ChatGPT/Claude analysis. No more broken "read this link" requests.

Also extracts recipes and articles.

## Features

### Recipe Extraction
- **One-Click Extraction**: Click the Smith toolbar icon on any recipe page
- **Smart Detection**: Automatically detects JSON-LD structured recipe data for instant, free extraction (no API needed!)
- **Multi-Provider AI Fallback**: Choose from OpenAI, Claude, Gemini, or Groq for pages without structured data
- **Beautiful UI**: Warm, kitchen-friendly design with clean typography and intuitive layout
- **Print & Copy**: Print-optimized layout and one-click copy to clipboard

### Reddit Thread Extraction
- **Auto-Detection**: Automatically detects Reddit threads and switches to thread mode
- **Complete Capture**: Extracts OP post + all comments with proper hierarchy (no API needed!)
- **Clean Text**: Filters out all Reddit tracking code (`SML.load()`), UI buttons, and junk
- **Expand All Comments**: Built-in button to expand collapsed comments before extraction
- **LLM-Ready Format**: Copy button formats thread as clean plain text, perfect for pasting into ChatGPT, Claude, or any LLM
- **Nested Comments**: Preserves reply structure with indentation (up to 5 levels deep)
- **Comment Permalinks**: Each comment includes a direct link for easy reference
- **Works on All Reddit Versions**: Supports new Reddit, old Reddit, and all layout variations

### Generic Article Extraction (Clean Reader)
- **Universal Content Extraction**: Works on news sites, blogs, documentation, and more
- **Ad & Popup Removal**: Strips away ads, newsletter popups, and other distractions
- **Clean Formatting**: Extracts title, author, date, and main content
- **Fallback Mode**: If not a recipe or Reddit thread, automatically tries generic extraction

### General
- **Privacy-First**: API keys stored locally in your browser, no external data collection
- **Multi-Provider AI**: Choose from OpenAI, Claude (Anthropic), Gemini (Google), or Groq
- **Smart Routing**: Same button works for recipes, Reddit, and articles — detects content type automatically
- **No API Required for Most Use Cases**: Reddit and most recipes work without any API key!

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

### Optional: Configure AI Provider (for recipe fallback only)

**Note**: Reddit extraction and most recipe sites work without any API key! You only need this for recipe sites without structured data.

1. After installing, click the Smith Button icon in your toolbar
2. If you want AI fallback support, click "Set Up API Key" in settings
3. Choose your preferred AI provider:
   - **OpenAI**: [Get API key](https://platform.openai.com/api-keys) (GPT-4o-mini)
   - **Claude**: [Get API key](https://console.anthropic.com/settings/keys) (Claude 3.5 Sonnet)
   - **Gemini**: [Get API key](https://aistudio.google.com/app/apikey) (Gemini 1.5 Flash)
   - **Groq**: [Get API key](https://console.groq.com/keys) (Llama 3.3 70B - fastest)
4. Paste your key and click "Save API Key"

**You can skip this entirely if you only want Reddit extraction or recipe sites with structured data!**

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
1. **JSON-LD First**: The extension first checks for structured recipe data (JSON-LD with `@type: Recipe`) - no API needed!
2. **AI Fallback (Optional)**: If no structured data is found and you have an API key configured, it uses your chosen AI provider (OpenAI, Claude, Gemini, or Groq) for extraction
3. **Clean Display**: Recipe is normalized and displayed in a beautiful, standardized format

### Reddit Thread Mode
1. **Auto-Detection**: Checks if the URL matches `reddit.com/r/.../comments/...`
2. **DOM Extraction**: Parses the page DOM to extract OP post, comments, authors, scores, and reply hierarchy - no API needed!
3. **Clean Filtering**: Removes Reddit tracking code (`SML.load()`), UI buttons, timestamps, and other junk
4. **Multi-Layout Support**: Works with new Reddit web components, legacy React divs, and old Reddit HTML
5. **Structured Output**: Displays in clean hierarchy or copies as indented plain text for LLM input

### Generic Article Mode (Clean Reader)
1. **Fallback Detection**: If not a recipe or Reddit thread, tries generic article extraction
2. **Content Targeting**: Looks for `<article>` tags, main content areas, and common article structures
3. **Noise Removal**: Strips ads, popups, sidebars, navigation, and other distractions
4. **Metadata Extraction**: Pulls title, author, date, and site name when available

## Privacy & Security

- Your API keys are stored in Chrome's sync storage (encrypted and synced across your devices)
- Keys are only sent to your chosen AI provider (OpenAI, Claude, Gemini, or Groq) when needed for recipe extraction fallback
- **Reddit extraction requires no API calls** - all processing is local DOM parsing
- No data or browsing history is collected or stored externally
- All extraction happens locally in your browser
- Open source - audit the code yourself!

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
- ✅ Recipe extraction (JSON-LD + multi-provider AI fallback)
- ✅ Reddit thread extraction with comment expansion
- ✅ Generic article extraction (Clean Reader mode)
- ✅ Multi-provider AI support (OpenAI, Claude, Gemini, Groq)
- ✅ Auto-detection and smart routing

**V2+ (Future)**
- Recipe saving and favorites
- Recipe scaling and modification
- HackerNews thread extraction
- Twitter/X thread extraction
- YouTube transcript extraction
- PDF content extraction
- Legal document parsing

## About

**Smith** is the first product from **A.I. Smith Studio**. Starting with recipe extraction and Reddit thread formatting, Smith is designed to be a modular content extraction platform that intelligently detects and structures any type of web content for easy consumption and LLM analysis.

## License

MIT License

Copyright © 2026 A.I. Smith Studio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
