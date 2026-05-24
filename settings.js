const apiKeyInput = document.getElementById('api-key-input');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const toggleVisibilityBtn = document.getElementById('toggle-visibility-btn');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');

async function loadApiKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
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

saveBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError();
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    showError();
    return;
  }
  
  await chrome.storage.sync.set({ apiKey });
  showSuccess();
});

clearBtn.addEventListener('click', async () => {
  apiKeyInput.value = '';
  await chrome.storage.sync.remove('apiKey');
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

loadApiKey();
