# Smith - Installation Guide

## Quick Start

### 1. Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked**
5. Select the `Smith_Button` folder
6. The Smith icon should appear in your browser toolbar (you may need to pin it)

### 2. Set Up Your API Key (Optional)

**For Reddit threads:** No API key needed — works immediately!

**For recipes:** API key only needed as a fallback (many recipe sites work without it)

1. Click the Smith icon in your toolbar
2. If prompted, click **Set Up API Key**
3. Visit [OpenAI Platform](https://platform.openai.com/api-keys) to get an API key
4. Copy your API key (starts with `sk-`)
5. Paste it into the settings page and click **Save API Key**

**Note**: Many recipe sites include structured data (JSON-LD), so the extension will work without an API key for those sites. The API key is only needed as a fallback for sites without structured data.

## Testing the Extension

### Test Reddit Thread Extraction (No API Key Needed)

1. Go to any Reddit thread (e.g., `reddit.com/r/cooking/comments/...`)
2. Click the Smith icon
3. The side panel will show the structured thread with OP post + all comments
4. Click **Copy** to get LLM-ready plain text format

### Test Recipe Extraction (No API Key Needed)

Try these popular recipe sites that use JSON-LD:

- AllRecipes.com
- Food Network
- Bon Appétit
- Serious Eats
- NYT Cooking

### Test with LLM Extraction (API Key Required)

Try smaller recipe blogs that may not have structured data.

## Troubleshooting

### Extension Won't Load

**Issue**: Error when loading unpacked extension

**Solutions**:
- Verify all files are present in the folder
- Check that icon files exist in `icons/` folder
- Look for errors in the Chrome extensions page
- Try reloading the extension

### Icons Missing

**Issue**: Extension loads but icons don't appear

**Solutions**:
- Verify `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` exist
- If missing, run `python generate_icons.py` from the extension folder
- Reload the extension after adding icons

### Side Panel Won't Open

**Issue**: Clicking the toolbar button does nothing

**Solutions**:
- Check if side panel is supported in your Chrome version (requires Chrome 114+)
- Look for errors in the browser console (F12)
- Try reloading the extension
- Restart Chrome

### "No Recipe Found" on Recipe Pages

**Issue**: Extension says no recipe found on valid recipe pages

**Solutions**:
- Check if the page actually contains a recipe (not just a list of recipes)
- Try a different recipe site
- If you have an API key set, verify it's correct in Settings
- Check browser console for errors

### API Key Errors

**Issue**: "API request failed" or similar errors

**Solutions**:
- Verify your API key is correct (should start with `sk-`)
- Check that your OpenAI account has available credits
- Ensure you have an active internet connection
- Try regenerating your API key on OpenAI platform

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Smith Button"
3. Click **Remove**
4. Your API key will be removed from Chrome storage automatically

## Privacy Notes

- Your API key is stored in Chrome's sync storage (encrypted)
- The key is only sent to OpenAI when extracting recipes
- No browsing data or recipes are stored externally
- All processing happens locally in your browser

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review the troubleshooting section above
- Check browser console (F12) for error messages
