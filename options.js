/**
 * Save options to browser.storage
 * @param {Event} e - The submit event
 * Prevent the form from submitting normally
 * and save the options to browser.storage
 * Log an error if the options were not saved
 * Restore the options to their saved state
 * Set the current choice for the apiKey, model, and temperature
 * Log an error if the options were not restored
 * @returns {void}
 */

function saveOptions(e) {
  e.preventDefault(); // Prevent the form from submitting normally
  browser.storage.local.set({
    apiKey: document.querySelector("#apiKey").value,
    model: document.querySelector("#model").value,
    temperature: parseFloat(document.querySelector("#temperature").value)
  }).then(() => {
    console.log("Settings saved");
  }, (error) => {
    console.error(`Error saving settings: ${error}`);
  });
}

/**
 * Restore the options to their saved state
 * Set the current choice for the apiKey, model, and temperature
 * Log an error if the options were not restored
 * @returns {void}
 */
function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#apiKey").value = result.apiKey || 'pplx-xxxxxxxxxxx';
    document.querySelector("#model").value = result.model || 'sonar-medium-chat';
    document.querySelector("#temperature").value = result.temperature || 1;
  }

  function onError(error) {
    console.log(browser.i18n.getMessage('errorLabel') + `: ${error}`);
  }

  let getting = browser.storage.local.get(["apiKey", "model", "temperature"]);
  getting.then(setCurrentChoice, onError);
}

// Add event listeners to the popup's elements
document.addEventListener("DOMContentLoaded", restoreOptions);
document.addEventListener("DOMContentLoaded", function() {
  document.querySelector("#apiKey").focus();
  document.getElementById('api-settings').textContent = browser.i18n.getMessage('apiSettingsLabel');
  document.getElementById('apiKeyLabel').textContent = browser.i18n.getMessage('apiKeyLabel');
  document.getElementById('modelLabel').textContent = browser.i18n.getMessage('modelLabel');
  document.getElementById('tempLabel').textContent = browser.i18n.getMessage('temperatureLabel');
  document.getElementById('save').innerText = browser.i18n.getMessage('saveLabel');
  window.title = browser.i18n.getMessage('extensionName');
});


document.querySelector("#options-form").addEventListener("submit", saveOptions);
