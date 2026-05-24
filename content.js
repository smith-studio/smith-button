function isRedditThread() {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return (host === 'www.reddit.com' || host === 'reddit.com' || host === 'old.reddit.com') &&
    path.includes('/comments/');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractRecipe') {
    const url = window.location.href;
    const title = document.title;

    if (isRedditThread()) {
      const thread = extractRedditThread(url, title);
      sendResponse({ mode: 'thread', thread, url, title });
      return true;
    }

    const jsonldRecipe = extractJSONLD();
    
    if (jsonldRecipe) {
      sendResponse({ 
        mode: 'recipe',
        success: true,
        recipe: jsonldRecipe,
        url: url,
        title: title 
      });
      return true;
    }

    const article = extractArticle(url, title);
    if (article && article.content && article.content.length > 200) {
      sendResponse({ mode: 'article', article, url, title });
      return true;
    }

    const pageText = extractPageText();
    sendResponse({ 
      mode: 'recipe',
      success: false,
      pageText: pageText,
      url: url,
      title: title 
    });
  }
  return true;
});

function extractRedditThread(url, pageTitle) {
  const thread = {
    title: '',
    subreddit: '',
    op: null,
    comments: [],
    url: url
  };

  try {
    const h1 = document.querySelector('h1[slot="title"], h1.title, shreddit-post h1, [data-testid="post-container"] h1');
    thread.title = h1 ? h1.textContent.trim() : pageTitle;

    const subMatch = url.match(/\/r\/([^/]+)\//);
    thread.subreddit = subMatch ? subMatch[1] : '';

    thread.op = extractOP();
    thread.comments = extractComments();
  } catch (e) {
    console.error('Smith: Reddit extraction error', e);
  }

  return thread;
}

function extractOP() {
  const selectors = [
    '[data-testid="post-container"]',
    'shreddit-post',
    '.Post',
    '#main-content .link'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;

    const bodyEl = el.querySelector('[data-testid="post-content"] [data-click-id="text"], .RichTextJSON-root, .md, shreddit-post [slot="text-body"]');
    const authorEl = el.querySelector('[data-testid="post_author_link"], a[href*="/user/"], shreddit-post [slot="authorName"], .author');
    const scoreEl = el.querySelector('[id*="vote-arrows"] faceplate-number, [data-testid="vote-score"] span, .score');

    return {
      author: authorEl ? authorEl.textContent.trim().replace(/^u\//, '') : 'OP',
      body: bodyEl ? bodyEl.textContent.trim() : '',
      score: scoreEl ? scoreEl.textContent.trim() : ''
    };
  }

  return { author: 'OP', body: '', score: '' };
}

function extractComments() {
  const comments = [];

  const newReddit = document.querySelectorAll('shreddit-comment');
  if (newReddit.length > 0) {
    newReddit.forEach(el => {
      const depth = parseInt(el.getAttribute('depth') || '0');
      const authorEl = el.querySelector('[slot="authorName"], a[href*="/user/"]');
      const bodyEl = el.querySelector('[slot="comment"] p, .md p, [data-testid="comment"] p');
      const scoreEl = el.querySelector('faceplate-number[slot="upvoteCount"], [id*="vote-count"]');
      const commentId = el.getAttribute('thingid')?.replace('t1_', '') || el.id?.replace('comment-', '') || '';
      const permalinkEl = el.querySelector('a[slot="commentMeta"], a[href*="/comments/"]');
      let permalink = '';
      if (permalinkEl && permalinkEl.href) {
        permalink = permalinkEl.href;
      } else if (commentId) {
        permalink = `${window.location.origin}${window.location.pathname}${commentId}/`;
      }

      const bodyParts = [];
      const pEls = el.querySelectorAll('[slot="comment"] p, .md p');
      pEls.forEach(p => { if (p.textContent.trim()) bodyParts.push(p.textContent.trim()); });

      comments.push({
        depth,
        author: authorEl ? authorEl.textContent.trim().replace(/^u\//, '') : '[deleted]',
        body: bodyParts.join('\n') || (bodyEl ? bodyEl.textContent.trim() : '[deleted]'),
        score: scoreEl ? scoreEl.textContent.trim() : '',
        permalink: permalink
      });
    });
    return comments;
  }

  const oldReddit = document.querySelectorAll('.comment');
  if (oldReddit.length > 0) {
    oldReddit.forEach(el => {
      const depth = (el.closest('.comment')?.parentElement?.closest('.comment') ? 1 : 0);
      const authorEl = el.querySelector('.author');
      const bodyEl = el.querySelector('.usertext-body .md');
      const scoreEl = el.querySelector('.score.unvoted, .score.likes, .score.dislikes');
      const permalinkEl = el.querySelector('a.bylink');
      const permalink = permalinkEl ? `${window.location.origin}${permalinkEl.getAttribute('href')}` : '';
      comments.push({
        depth: parseInt(el.getAttribute('data-depth') || '0'),
        author: authorEl ? authorEl.textContent.trim() : '[deleted]',
        body: bodyEl ? bodyEl.textContent.trim() : '[deleted]',
        score: scoreEl ? scoreEl.getAttribute('title') || scoreEl.textContent.trim() : '',
        permalink: permalink
      });
    });
    return comments;
  }

  const divComments = document.querySelectorAll('[data-testid="comment"]');
  divComments.forEach(el => {
    const authorEl = el.querySelector('[data-testid="comment_author_link"], a[href*="/user/"]');
    const bodyEl = el.querySelector('[data-testid="comment"] .RichTextJSON-root, p');
    const scoreEl = el.querySelector('[id*="vote-score"] span');
    const permalinkEl = el.querySelector('a[href*="/comments/"][aria-label*="permalink"], a[href*="/comments/"]');
    let permalink = '';
    if (permalinkEl && permalinkEl.href && permalinkEl.href.includes('/comments/')) {
      permalink = permalinkEl.href;
    }

    let depthEl = el.parentElement;
    let depth = 0;
    while (depthEl) {
      if (depthEl.getAttribute('data-testid') === 'comment') depth++;
      depthEl = depthEl.parentElement;
      if (depth > 10) break;
    }

    const bodyParts = [];
    el.querySelectorAll('p').forEach(p => { if (p.textContent.trim()) bodyParts.push(p.textContent.trim()); });

    comments.push({
      depth,
      author: authorEl ? authorEl.textContent.trim().replace(/^u\//, '') : '[deleted]',
      body: bodyParts.join('\n') || (bodyEl ? bodyEl.textContent.trim() : '[deleted]'),
      score: scoreEl ? scoreEl.textContent.trim() : '',
      permalink: permalink
    });
  });

  return comments;
}

function extractJSONLD() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  
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

function extractArticle(url, pageTitle) {
  const article = {
    title: pageTitle,
    author: null,
    date: null,
    siteName: null,
    content: '',
    url: url
  };

  const metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"]');
  if (metaAuthor) article.author = metaAuthor.content;

  const metaDate = document.querySelector('meta[property="article:published_time"], meta[name="date"], meta[name="publish-date"]');
  if (metaDate) article.date = metaDate.content;

  const metaSite = document.querySelector('meta[property="og:site_name"], meta[name="application-name"]');
  if (metaSite) article.siteName = metaSite.content;

  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent.trim()) article.title = h1.textContent.trim();

  const contentSelectors = [
    'article',
    '[role="article"]',
    'main article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content-body',
    'main',
    '#content',
    '.story-body'
  ];

  let contentEl = null;
  for (const selector of contentSelectors) {
    contentEl = document.querySelector(selector);
    if (contentEl) break;
  }

  if (!contentEl) {
    contentEl = document.body;
  }

  const clone = contentEl.cloneNode(true);

  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    '.comments', '#comments', '.comment-section',
    '.advertisement', '.ad', '[class*="ad-"]', '[id*="ad-"]',
    '.social-share', '.share-buttons',
    '.related-articles', '.recommended',
    'iframe', 'video', 'audio',
    '.newsletter-signup', '.subscription',
    'button', '.button',
    'form',
    '[aria-hidden="true"]'
  ];

  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  const paragraphs = clone.querySelectorAll('p, h2, h3, h4, blockquote, li');
  const contentParts = [];
  paragraphs.forEach(p => {
    const text = p.textContent.trim();
    if (text && text.length > 20) {
      contentParts.push(text);
    }
  });

  article.content = contentParts.join('\n\n');

  return article;
}

function extractPageText() {
  const clone = document.body.cloneNode(true);
  
  const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', '.comments', '#comments', '.advertisement', '.ad'];
  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  const text = clone.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}
