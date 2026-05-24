function extractJSONLD(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const recipe = findRecipeInJSONLD(data);
      if (recipe) {
        return recipe;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

function findRecipeInJSONLD(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJSONLD(item);
      if (recipe) return recipe;
    }
    return null;
  }
  
  if (data && typeof data === 'object') {
    if (data['@type'] === 'Recipe') {
      return normalizeJSONLDRecipe(data);
    }
    
    if (data['@graph']) {
      return findRecipeInJSONLD(data['@graph']);
    }
  }
  
  return null;
}

function normalizeJSONLDRecipe(data) {
  return {
    title: data.name || '',
    servings: data.recipeYield || data.servings || null,
    prepTime: formatDuration(data.prepTime),
    cookTime: formatDuration(data.cookTime),
    totalTime: formatDuration(data.totalTime),
    ingredients: normalizeJSONLDIngredients(data.recipeIngredient || []),
    steps: normalizeJSONLDSteps(data.recipeInstructions || []),
    sourceUrl: data.url || '',
    sourceTitle: ''
  };
}

function normalizeJSONLDIngredients(ingredients) {
  return ingredients.map(ing => {
    if (typeof ing === 'string') {
      return parseIngredientString(ing);
    }
    return {
      amount: ing.amount || '',
      unit: ing.unit || '',
      item: ing.item || ing.name || '',
      note: ing.note || null
    };
  });
}

function normalizeJSONLDSteps(instructions) {
  if (typeof instructions === 'string') {
    return [{ number: 1, instruction: instructions, time: null }];
  }
  
  if (!Array.isArray(instructions)) {
    return [];
  }
  
  return instructions.map((step, idx) => {
    if (typeof step === 'string') {
      return {
        number: idx + 1,
        instruction: step,
        time: extractTimeFromInstruction(step)
      };
    }
    
    if (step['@type'] === 'HowToStep') {
      return {
        number: idx + 1,
        instruction: step.text || '',
        time: extractTimeFromInstruction(step.text || '')
      };
    }
    
    if (step['@type'] === 'HowToSection') {
      const sectionSteps = normalizeJSONLDSteps(step.itemListElement || []);
      return sectionSteps;
    }
    
    return {
      number: idx + 1,
      instruction: step.text || step.instruction || '',
      time: extractTimeFromInstruction(step.text || step.instruction || '')
    };
  }).flat();
}

function formatDuration(duration) {
  if (!duration) return null;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  
  return parts.join(' ') || null;
}

function parseIngredientString(str) {
  const parts = str.trim().split(/\s+/);
  let amount = '';
  let unit = '';
  let item = '';
  let note = null;

  const numberPattern = /^[\d\/\.]+$/;
  const fractionPattern = /^[\u00BC-\u00BE\u2150-\u215E]$/;
  const unitPattern = /^(cup|cups|c|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|pound|pounds|gram|grams|kilogram|kilograms|milliliter|milliliters|liter|liters|clove|cloves|pinch|dash|to taste)s?$/i;

  let idx = 0;
  if (parts[idx] && (numberPattern.test(parts[idx]) || fractionPattern.test(parts[idx]))) {
    amount = parts[idx];
    idx++;
    
    if (parts[idx] && fractionPattern.test(parts[idx])) {
      amount += ' ' + parts[idx];
      idx++;
    }
  }

  if (parts[idx] && unitPattern.test(parts[idx])) {
    unit = parts[idx];
    idx++;
  }

  const remaining = parts.slice(idx).join(' ');
  const noteMatch = remaining.match(/^(.+?),\s*(.+)$/);
  if (noteMatch) {
    item = noteMatch[1];
    note = noteMatch[2];
  } else {
    item = remaining;
  }

  return { amount, unit, item, note };
}

function extractTimeFromInstruction(instruction) {
  const timePattern = /(\d+)\s*(minute|minutes|min|hour|hours|hr|hrs|second|seconds|sec|secs)/i;
  const match = instruction.match(timePattern);
  return match ? match[0] : null;
}

function extractPageText(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', '.comments', '#comments', '.advertisement', '.ad'];
  unwantedSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  const text = doc.body.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

const LLM_EXTRACTION_PROMPT = `You are a recipe extraction engine. Extract the recipe from the following webpage text into a JSON object.

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
`;
