function validateRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') {
    return { valid: false, error: 'Invalid recipe object' };
  }

  if (recipe.error === 'no_recipe_found') {
    return { valid: false, error: 'no_recipe_found' };
  }

  const required = ['title', 'ingredients', 'steps'];
  for (const field of required) {
    if (!recipe[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return { valid: false, error: 'Ingredients must be a non-empty array' };
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    return { valid: false, error: 'Steps must be a non-empty array' };
  }

  return { valid: true };
}

function normalizeRecipe(recipe) {
  return {
    title: recipe.title || 'Untitled Recipe',
    servings: recipe.servings || recipe.recipeYield || null,
    prepTime: recipe.prepTime || null,
    cookTime: recipe.cookTime || null,
    totalTime: recipe.totalTime || null,
    ingredients: normalizeIngredients(recipe.ingredients || []),
    steps: normalizeSteps(recipe.steps || recipe.recipeInstructions || []),
    sourceUrl: recipe.sourceUrl || '',
    sourceTitle: recipe.sourceTitle || ''
  };
}

function normalizeIngredients(ingredients) {
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

function parseIngredientString(str) {
  const parts = str.trim().split(/\s+/);
  let amount = '';
  let unit = '';
  let item = '';
  let note = null;

  const numberPattern = /^[\d\/\.]+$/;
  const unitPattern = /^(cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|tablespoon|tablespoons|teaspoon|teaspoons|ounce|ounces|pound|pounds|gram|grams|kilogram|kilograms|milliliter|milliliters|liter|liters)s?$/i;

  let idx = 0;
  if (parts[idx] && numberPattern.test(parts[idx])) {
    amount = parts[idx];
    idx++;
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

function normalizeSteps(steps) {
  if (typeof steps === 'string') {
    return [{ number: 1, instruction: steps, time: null }];
  }

  return steps.map((step, idx) => {
    if (typeof step === 'string') {
      return {
        number: idx + 1,
        instruction: step,
        time: extractTimeFromInstruction(step)
      };
    }
    return {
      number: step.number || idx + 1,
      instruction: step.instruction || step.text || '',
      time: step.time || extractTimeFromInstruction(step.instruction || step.text || '')
    };
  });
}

function extractTimeFromInstruction(instruction) {
  const timePattern = /(\d+)\s*(minute|minutes|min|hour|hours|hr|hrs|second|seconds|sec|secs)/i;
  const match = instruction.match(timePattern);
  return match ? match[0] : null;
}
