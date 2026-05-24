const providerSelect = document.getElementById('provider-select');
const apiKeyInput = document.getElementById('api-key-input');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const toggleVisibilityBtn = document.getElementById('toggle-visibility-btn');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const apiHelpText = document.getElementById('api-help-text');
const apiLink = document.getElementById('api-link');

const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI',
    link: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    keyPrefix: 'sk-'
  },
  claude: {
    name: 'Anthropic',
    link: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-'
  },
  gemini: {
    name: 'Google AI',
    link: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
    keyPrefix: 'AIza'
  },
  groq: {
    name: 'Groq',
    link: 'https://console.groq.com/keys',
    placeholder: 'gsk_...',
    keyPrefix: 'gsk_'
  }
};

async function loadSettings() {
  const data = await chrome.storage.sync.get(['aiProvider', 'openaiKey', 'claudeKey', 'geminiKey', 'groqKey']);
  
  // Set provider (default to openai)
  providerSelect.value = data.aiProvider || 'openai';
  
  // Load the key for the selected provider
  updateProviderUI();
  loadCurrentProviderKey();
}

function updateProviderUI() {
  const provider = providerSelect.value;
  const info = PROVIDER_INFO[provider];
  
  apiKeyInput.placeholder = info.placeholder;
  apiLink.href = info.link;
  apiLink.textContent = `Get one from ${info.name}`;
}

async function loadCurrentProviderKey() {
  const provider = providerSelect.value;
  const storageKey = `${provider}Key`;
  const data = await chrome.storage.sync.get(storageKey);
  
  apiKeyInput.value = data[storageKey] || '';
}

function hideMessages() {
  successMessage.style.display = 'none';
  errorMessage.style.display = 'none';
}

function showSuccess() {
  hideMessages();
  successMessage.style.display = 'block';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

function showError() {
  hideMessages();
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 3000);
}

providerSelect.addEventListener('change', () => {
  updateProviderUI();
  loadCurrentProviderKey();
  hideMessages();
});

saveBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const provider = providerSelect.value;
  const info = PROVIDER_INFO[provider];
  
  if (!apiKey) {
    showError();
    return;
  }
  
  // Validate key format
  if (!apiKey.startsWith(info.keyPrefix)) {
    showError();
    return;
  }
  
  // Save both the provider and the key
  const storageKey = `${provider}Key`;
  await chrome.storage.sync.set({ 
    aiProvider: provider,
    [storageKey]: apiKey
  });
  showSuccess();
});

clearBtn.addEventListener('click', async () => {
  const provider = providerSelect.value;
  const storageKey = `${provider}Key`;
  
  apiKeyInput.value = '';
  await chrome.storage.sync.remove(storageKey);
  showSuccess();
});

toggleVisibilityBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    eyeIcon.style.display = 'none';
    eyeOffIcon.style.display = 'block';
  } else {
    apiKeyInput.type = 'password';
    eyeIcon.style.display = 'block';
    eyeOffIcon.style.display = 'none';
  }
});

apiKeyInput.addEventListener('input', () => {
  hideMessages();
});

loadSettings();
