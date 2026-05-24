function getPrintStyles() {
  return `
    @media print {
      body {
        margin: 0;
        padding: 20px;
        background: white;
      }
      
      .recipe-header {
        margin-bottom: 20px;
      }
      
      .recipe-title {
        font-size: 24pt;
        margin-bottom: 10px;
      }
      
      .recipe-meta {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      
      .meta-item {
        font-size: 10pt;
      }
      
      .recipe-section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 10px;
        border-bottom: 1px solid #000;
      }
      
      .ingredient-item,
      .step-item {
        margin-bottom: 8px;
        font-size: 11pt;
      }
      
      .step-number {
        font-weight: bold;
      }
      
      .recipe-footer {
        margin-top: 30px;
        padding-top: 10px;
        border-top: 1px solid #000;
        font-size: 9pt;
      }
      
      .toolbar,
      .settings-button,
      button {
        display: none !important;
      }
    }
  `;
}

function formatRecipeForCopy(recipe) {
  let text = '';
  
  text += `${recipe.title}\n`;
  text += '='.repeat(recipe.title.length) + '\n\n';
  
  const meta = [];
  if (recipe.servings) meta.push(`Servings: ${recipe.servings}`);
  if (recipe.prepTime) meta.push(`Prep Time: ${recipe.prepTime}`);
  if (recipe.cookTime) meta.push(`Cook Time: ${recipe.cookTime}`);
  if (recipe.totalTime) meta.push(`Total Time: ${recipe.totalTime}`);
  
  if (meta.length > 0) {
    text += meta.join(' | ') + '\n\n';
  }
  
  text += 'INGREDIENTS\n';
  text += '-----------\n';
  recipe.ingredients.forEach(ing => {
    const parts = [];
    if (ing.amount) parts.push(ing.amount);
    if (ing.unit) parts.push(ing.unit);
    parts.push(ing.item);
    if (ing.note) parts.push(`(${ing.note})`);
    text += `• ${parts.join(' ')}\n`;
  });
  text += '\n';
  
  text += 'INSTRUCTIONS\n';
  text += '------------\n';
  recipe.steps.forEach(step => {
    text += `${step.number}. ${step.instruction}`;
    if (step.time) text += ` (${step.time})`;
    text += '\n';
  });
  text += '\n';
  
  if (recipe.sourceUrl) {
    text += `Source: ${recipe.sourceTitle || 'Recipe'}\n`;
    text += `${recipe.sourceUrl}\n`;
  }
  
  return text;
}
