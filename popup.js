document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const statusMessage = document.getElementById('statusMessage');
  const enableToggle = document.getElementById('enableToggle');

  // Load the saved settings when the popup is opened
  chrome.storage.local.get(['geminiApiKey', 'clickbaitBusterEnabled'], (data) => {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
      statusMessage.textContent = 'API key loaded.';
      statusMessage.classList.add('text-green');
    }
    // Set toggle state (default to false if not set)
    enableToggle.checked = data.clickbaitBusterEnabled || false;
  });

  // Handle toggle change
  enableToggle.addEventListener('change', () => {
    chrome.storage.local.set({ clickbaitBusterEnabled: enableToggle.checked }, () => {
      statusMessage.textContent = enableToggle.checked ?
        'ClickbaitBuster enabled!' : 'ClickbaitBuster disabled!';
      statusMessage.classList.remove('text-red', 'text-green');
      statusMessage.classList.add('text-green');
      // Clear the message after 3 seconds
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  });

  // Handle saving the API key
  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        statusMessage.textContent = 'API Key saved successfully!';
        statusMessage.classList.remove('text-red');
        statusMessage.classList.add('text-green');
        // Clear the message after 3 seconds
        setTimeout(() => {
          statusMessage.textContent = '';
        }, 3000);
      });
    } else {
      statusMessage.textContent = 'Please enter a valid API key.';
      statusMessage.classList.remove('text-green');
      statusMessage.classList.add('text-red');
    }
  });
});
