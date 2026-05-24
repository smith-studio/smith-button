chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
  
  const restrictedPages = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:'];
  const isRestricted = restrictedPages.some(prefix => tab.url?.startsWith(prefix));
  
  if (isRestricted) {
    await chrome.storage.local.set({ 
      recipeStatus: 'error',
      recipeError: 'Cannot extract content from browser internal pages. Try a regular webpage.' 
    });
    return;
  }
  
  await chrome.storage.local.set({ recipeStatus: 'loading' });

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (e) {
    // Already injected or restricted page — proceed anyway
  }

  chrome.tabs.sendMessage(tab.id, { action: 'extractRecipe' }, async (response) => {
    if (chrome.runtime.lastError) {
      await chrome.storage.local.set({
        recipeStatus: 'error',
        recipeError: 'Could not connect to page. Try refreshing the page or check if the page allows extensions.' 
      });
      return;
    }
    
    if (response) {
      if (response.mode === 'thread') {
        await chrome.storage.local.set({ currentThread: response.thread, recipeStatus: 'thread' });
      } else if (response.mode === 'article') {
        await chrome.storage.local.set({ currentArticle: response.article, recipeStatus: 'article' });
      } else {
        await processRecipe(response);
      }
    }
  });
});

async function processRecipe(response) {
  try {
    if (response.success && response.recipe) {
      response.recipe.sourceUrl = response.url;
      response.recipe.sourceTitle = response.title;
      
      await chrome.storage.local.set({ 
        currentRecipe: response.recipe, 
        recipeStatus: 'success' 
      });
      return;
    }
    
    // Get AI provider and corresponding API key
    const { aiProvider } = await chrome.storage.sync.get('aiProvider');
    const provider = aiProvider || 'openai';
    const storageKey = `${provider}Key`;
    const data = await chrome.storage.sync.get(storageKey);
    const apiKey = data[storageKey];
    
    if (!apiKey) {
      await chrome.storage.local.set({ recipeStatus: 'no_api_key' });
      return;
    }
    
    const recipe = await extractRecipeWithLLM(response.pageText, provider, apiKey);
    
    if (recipe.error === 'no_recipe_found') {
      await chrome.storage.local.set({ recipeStatus: 'no_recipe' });
      return;
    }
    
    recipe.sourceUrl = response.url;
    recipe.sourceTitle = response.title;
    
    await chrome.storage.local.set({ currentRecipe: recipe, recipeStatus: 'success' });
    
  } catch (error) {
    console.error('Error processing recipe:', error);
    await chrome.storage.local.set({ 
      recipeStatus: 'error',
      recipeError: error.message 
    });
  }
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function callGemini(prompt, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function callGroq(prompt, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callAI(prompt, provider, apiKey) {
  switch (provider) {
    case 'openai':
      return await callOpenAI(prompt, apiKey);
    case 'claude':
      return await callClaude(prompt, apiKey);
    case 'gemini':
      return await callGemini(prompt, apiKey);
    case 'groq':
      return await callGroq(prompt, apiKey);
    default:
      throw new Error('Unknown AI provider');
  }
}

async function extractRecipeWithLLM(pageText, provider, apiKey) {
  const prompt = `You are a recipe extraction engine. Extract the recipe from the following webpage text into a JSON object.

Rules:
- Return ONLY valid JSON. No preamble, no markdown, no explanation.
- If no recipe is found, return: {"error": "no_recipe_found"}
- Separate each ingredient into amount, unit, and item fields.
- If an ingredient has a preparation note (e.g., "diced", "room temperature"), put it in the note field.
- Number each step sequentially.
- If a step has an associated time (e.g., "bake for 20 minutes"), include it in the time field.
- Use null for any field that cannot be determined from the text.
- Do not invent or assume information that is not in the text.

Return this exact JSON schema:
{
  "title": "string",
  "servings": "string",
  "prepTime": "string or null",
  "cookTime": "string or null",
  "totalTime": "string or null",
  "ingredients": [{"amount": "string", "unit": "string", "item": "string", "note": "string or null"}],
  "steps": [{"number": 1, "instruction": "string", "time": "string or null"}]
}

Webpage text:
${pageText.substring(0, 8000)}`;

  const content = await callAI(prompt, provider, apiKey);
  
  let jsonContent = content;
  if (content.startsWith('```json')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (content.startsWith('```')) {
    jsonContent = content.replace(/```\n?/g, '');
  }
  
  const recipe = JSON.parse(jsonContent);
  return recipe;
}

