const states = {
  welcome: document.getElementById('welcome-state'),
  loading: document.getElementById('loading-state'),
  noApiKey: document.getElementById('no-api-key-state'),
  noRecipe: document.getElementById('no-recipe-state'),
  error: document.getElementById('error-state'),
  recipe: document.getElementById('recipe-card'),
  thread: document.getElementById('thread-card')
};

function showState(stateName) {
  Object.values(states).forEach(el => el.style.display = 'none');
  if (states[stateName]) {
    states[stateName].style.display = 'block';
  }
}

function renderRecipe(recipe) {
  document.getElementById('recipe-title').textContent = recipe.title;
  
  const metaContainer = document.getElementById('recipe-meta');
  metaContainer.innerHTML = '';
  
  if (recipe.servings) {
    metaContainer.innerHTML += `
      <div class="meta-item">
        <span class="meta-label">Servings:</span>
        <span>${recipe.servings}</span>
      </div>
    `;
  }
  
  if (recipe.prepTime) {
    metaContainer.innerHTML += `
      <div class="meta-item">
        <span class="meta-label">Prep:</span>
        <span>${recipe.prepTime}</span>
      </div>
    `;
  }
  
  if (recipe.cookTime) {
    metaContainer.innerHTML += `
      <div class="meta-item">
        <span class="meta-label">Cook:</span>
        <span>${recipe.cookTime}</span>
      </div>
    `;
  }
  
  if (recipe.totalTime) {
    metaContainer.innerHTML += `
      <div class="meta-item">
        <span class="meta-label">Total:</span>
        <span>${recipe.totalTime}</span>
      </div>
    `;
  }
  
  const ingredientsList = document.getElementById('ingredients-list');
  ingredientsList.innerHTML = '';
  recipe.ingredients.forEach(ing => {
    const li = document.createElement('li');
    li.className = 'ingredient-item';
    
    let html = '';
    if (ing.amount) {
      html += `<span class="ingredient-amount">${ing.amount}</span>`;
    }
    if (ing.unit) {
      html += `<span class="ingredient-unit">${ing.unit}</span>`;
    }
    html += `<span class="ingredient-item-name">${ing.item}</span>`;
    if (ing.note) {
      html += `<span class="ingredient-note">(${ing.note})</span>`;
    }
    
    li.innerHTML = html;
    ingredientsList.appendChild(li);
  });
  
  const stepsList = document.getElementById('steps-list');
  stepsList.innerHTML = '';
  recipe.steps.forEach(step => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-item';
    
    let html = `
      <div class="step-number">${step.number}</div>
      <div class="step-content">
        <div class="step-instruction">${step.instruction}`;
    
    if (step.time) {
      html += `<span class="step-time">${step.time}</span>`;
    }
    
    html += `</div></div>`;
    stepDiv.innerHTML = html;
    stepsList.appendChild(stepDiv);
  });
  
  const footer = document.getElementById('recipe-footer');
  if (recipe.sourceUrl) {
    footer.innerHTML = `
      <p>Source: <a href="${recipe.sourceUrl}" target="_blank">${recipe.sourceTitle || 'Original Recipe'}</a></p>
    `;
  } else {
    footer.innerHTML = '';
  }
  
  showState('recipe');
}

function renderThread(thread) {
  document.getElementById('thread-title').textContent = thread.title;

  const meta = document.getElementById('thread-meta');
  meta.innerHTML = '';
  if (thread.subreddit) {
    meta.innerHTML += `<div class="meta-item"><span class="meta-label">r/</span><span>${thread.subreddit}</span></div>`;
  }
  if (thread.op?.author) {
    meta.innerHTML += `<div class="meta-item"><span class="meta-label">OP:</span><span>u/${thread.op.author}</span></div>`;
  }
  const visibleComments = thread.comments.filter(c => c.body && c.body !== '[deleted]');
  meta.innerHTML += `<div class="meta-item"><span class="meta-label">Comments:</span><span>${visibleComments.length}</span></div>`;

  const opEl = document.getElementById('thread-op');
  opEl.innerHTML = '';
  if (thread.op) {
    const div = document.createElement('div');
    div.className = 'thread-op-block';
    div.innerHTML = `
      <div class="comment-author op-author">u/${thread.op.author}</div>
      <div class="comment-body">${thread.op.body || '<em>No text body (link post or image)</em>'}</div>
    `;
    opEl.appendChild(div);
  }

  const commentsEl = document.getElementById('thread-comments');
  commentsEl.innerHTML = '';
  document.getElementById('thread-comment-count').textContent = `(${visibleComments.length})`;

  thread.comments.forEach((comment, idx) => {
    if (!comment.body || comment.body === '[deleted]') return;
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.style.marginLeft = `${Math.min(comment.depth, 5) * 16}px`;
    if (comment.depth === 0) div.classList.add('comment-top-level');

    const scoreText = comment.score ? `<span class="comment-score">${comment.score} pts</span>` : '';
    div.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">u/${comment.author}</span>
        ${scoreText}
      </div>
      <div class="comment-body">${comment.body}</div>
    `;
    commentsEl.appendChild(div);
  });

  showState('thread');
}

function formatThreadForCopy(thread) {
  let text = `REDDIT THREAD\n`;
  text += `=============\n`;
  text += `r/${thread.subreddit} — ${thread.title}\n`;
  text += `${thread.url}\n\n`;

  text += `--- ORIGINAL POST (u/${thread.op?.author || 'OP'}) ---\n`;
  text += `${thread.op?.body || '[No text body]'}\n\n`;

  text += `--- COMMENTS ---\n\n`;
  thread.comments.forEach((c, idx) => {
    if (!c.body || c.body === '[deleted]') return;
    const indent = '  '.repeat(Math.min(c.depth, 5));
    const score = c.score ? ` [${c.score} pts]` : '';
    const permalink = c.permalink ? ` ${c.permalink}` : '';
    text += `${indent}[u/${c.author}${score}]${permalink}\n`;
    c.body.split('\n').forEach(line => { text += `${indent}${line}\n`; });
    text += '\n';
  });

  text += `\n--- End of thread ---\n`;
  return text;
}

document.getElementById('print-btn')?.addEventListener('click', () => {
  window.print();
});

document.getElementById('copy-btn')?.addEventListener('click', async () => {
  const { currentRecipe } = await chrome.storage.local.get('currentRecipe');
  if (currentRecipe) {
    const text = formatRecipeForCopy(currentRecipe);
    await navigator.clipboard.writeText(text);
    
    const btn = document.getElementById('copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 2000);
  }
});

document.getElementById('settings-btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

document.getElementById('thread-copy-btn')?.addEventListener('click', async () => {
  const { currentThread } = await chrome.storage.local.get('currentThread');
  if (currentThread) {
    const text = formatThreadForCopy(currentThread);
    await navigator.clipboard.writeText(text);

    const btn = document.getElementById('thread-copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
  }
});

document.getElementById('thread-settings-btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

document.getElementById('open-settings-btn')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

document.getElementById('retry-btn')?.addEventListener('click', async () => {
  showState('loading');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'extractRecipe' });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.recipeStatus) {
      handleStatusChange(changes.recipeStatus.newValue);
    }
    if (changes.currentRecipe) {
      renderRecipe(changes.currentRecipe.newValue);
    }
  }
});

async function handleStatusChange(status) {
  switch (status) {
    case 'loading':
      showState('loading');
      break;
    case 'success': {
      const { currentRecipe } = await chrome.storage.local.get('currentRecipe');
      if (currentRecipe) renderRecipe(currentRecipe);
      break;
    }
    case 'thread': {
      const { currentThread } = await chrome.storage.local.get('currentThread');
      if (currentThread) renderThread(currentThread);
      break;
    }
    case 'no_api_key':
      showState('noApiKey');
      break;
    case 'no_recipe':
      showState('noRecipe');
      break;
    case 'error': {
      const { recipeError } = await chrome.storage.local.get('recipeError');
      document.getElementById('error-message').textContent = 
        recipeError || 'An error occurred while extracting the recipe.';
      showState('error');
      break;
    }
    default:
      showState('welcome');
  }
}

async function init() {
  const { recipeStatus, currentRecipe, currentThread } = await chrome.storage.local.get(['recipeStatus', 'currentRecipe', 'currentThread']);
  
  if (recipeStatus === 'thread' && currentThread) {
    renderThread(currentThread);
  } else if (recipeStatus) {
    await handleStatusChange(recipeStatus);
  } else if (currentRecipe) {
    renderRecipe(currentRecipe);
  } else {
    showState('welcome');
  }
}

init();
