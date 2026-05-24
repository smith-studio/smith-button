# Smith Button - Testing Checklist

## Pre-Installation Tests

- [x] All required files present
- [x] Icons generated (16px, 48px, 128px)
- [x] Manifest.json valid
- [x] No syntax errors in JavaScript files

## Installation Tests

### Load Extension
- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] Smith Button icon appears in browser toolbar
- [ ] No console errors on extension load

### Initial State
- [ ] Clicking toolbar button opens side panel
- [ ] Welcome screen displays correctly
- [ ] UI matches warm, kitchen-friendly design (orange #E86C00, cream background)

## Functional Tests

### Settings Page
- [ ] Settings button opens settings page in new tab
- [ ] API key input field works
- [ ] Show/hide password toggle works
- [ ] Save button stores API key
- [ ] Clear button removes API key
- [ ] Success/error messages display correctly

### JSON-LD Extraction (No API Key Required)

Test on sites with structured data:
- [ ] AllRecipes.com recipe extracts correctly
- [ ] Recipe title displays
- [ ] Servings, prep time, cook time display
- [ ] Ingredients list formatted correctly (amount, unit, item)
- [ ] Steps numbered and formatted
- [ ] Source attribution shows with link
- [ ] No API call made (check Network tab)

### LLM Extraction (API Key Required)

Test on sites without structured data:
- [ ] Without API key: "API Key Required" message displays
- [ ] After setting API key: extraction works
- [ ] Recipe extracts from blog-style recipe pages
- [ ] Loading spinner shows during extraction
- [ ] Recipe displays after successful extraction

### Error Handling
- [ ] "No Recipe Found" displays on non-recipe pages
- [ ] Invalid API key shows error message
- [ ] Network errors handled gracefully
- [ ] Retry button works after errors

### Recipe Card UI
- [ ] Title prominent and readable
- [ ] Meta badges (servings, times) display as pills
- [ ] Ingredients list clean and scannable
- [ ] Amounts bolded/highlighted in orange
- [ ] Steps have orange numbered circles
- [ ] Step times display as badges
- [ ] Footer shows source link

### Toolbar Functions
- [ ] Print button opens print dialog
- [ ] Print layout is clean (no toolbar, optimized for paper)
- [ ] Copy button copies recipe to clipboard
- [ ] Copy button shows checkmark feedback
- [ ] Settings button opens settings page

## UI/UX Tests

### Design Consistency
- [ ] Color scheme: Orange (#E86C00), cream (#FFF8F0), dark text (#2D2A26)
- [ ] Typography clean and readable
- [ ] Spacing and hierarchy clear
- [ ] Rounded corners on cards and buttons
- [ ] Warm, inviting aesthetic (not sterile)

### Responsive Behavior
- [ ] Side panel width appropriate
- [ ] Long recipe titles wrap correctly
- [ ] Many ingredients display without overflow
- [ ] Long instructions wrap properly
- [ ] Print layout fits on one page (or breaks cleanly)

## Edge Cases

### Content Edge Cases
- [ ] Recipe with no prep/cook times
- [ ] Recipe with no servings
- [ ] Very long ingredient list (20+ items)
- [ ] Very long instructions (10+ steps)
- [ ] Ingredients with fractions (½, ¼, etc.)
- [ ] Ingredients with notes ("diced", "room temperature")
- [ ] Steps with embedded times ("bake for 20 minutes")

### Technical Edge Cases
- [ ] Page with multiple JSON-LD scripts
- [ ] Page with non-recipe JSON-LD
- [ ] Very large page content
- [ ] Page with special characters in recipe
- [ ] Clicking button multiple times quickly
- [ ] Switching tabs while extracting

## Performance Tests

- [ ] JSON-LD extraction is instant (<100ms)
- [ ] LLM extraction completes within 5 seconds
- [ ] Side panel opens smoothly
- [ ] No memory leaks after multiple extractions
- [ ] Extension size under 1MB

## Security Tests

- [ ] API key stored in chrome.storage.sync
- [ ] API key not visible in console logs
- [ ] API key only sent to OpenAI API
- [ ] No external data collection
- [ ] Content script permissions appropriate

## Browser Compatibility

- [ ] Works on Chrome 114+ (side panel requirement)
- [ ] Works on Chromium-based browsers (Edge, Brave)
- [ ] Manifest V3 compliant

## Test Recipe Sites

### With JSON-LD (Should work without API key):
- AllRecipes.com
- FoodNetwork.com
- BonAppetit.com
- SeriousEats.com
- NYT Cooking (cooking.nytimes.com)
- Tasty.co
- Delish.com

### Without JSON-LD (Requires API key):
- Small food blogs
- Personal recipe sites
- Recipe pages without structured data

## Known Limitations (V1)

- No recipe saving/favorites (planned for V2)
- No ingredient scaling (planned for V2)
- No allergy checking (planned for V2)
- No recipe modification (planned for V2)
- Requires Chrome 114+ for side panel

## Success Criteria

✅ Extension loads without errors
✅ JSON-LD extraction works instantly on major recipe sites
✅ LLM extraction works with valid API key
✅ UI is warm, clean, and kitchen-friendly
✅ Print and copy functions work correctly
✅ Error states handled gracefully
✅ Settings page works for API key management
✅ No privacy or security issues
