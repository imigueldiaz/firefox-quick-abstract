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
    showInfoBadge();
  }, (error) => {
    console.error(`Error saving settings: ${error}`);
    showErrorBadge();
  });
}

function showInfoBadge() {
  const infoBadge = document.getElementById('saveSuccess');
  if (infoBadge) {
    infoBadge.textContent = browser.i18n.getMessage('saveSuccessMessage');
    infoBadge.style.opacity = '1';
    setTimeout(() => {
      infoBadge.style.opacity = '0';
      setTimeout(() => infoBadge.remove(), 500);
    }, 2000);
  }
}

function showErrorBadge() {
  const errorBadge = document.getElementById('saveError');
  if (errorBadge) {
    errorBadge.textContent = browser.i18n.getMessage('saveErrorMessage');
    errorBadge.style.opacity = '1';
    setTimeout(() => {
      errorBadge.style.opacity = '0';
      setTimeout(() => errorBadge.remove(), 500);
    }, 2000);
  }
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

/**
 * Log an error if the options were not restored
 * @param {Error} error - The error that occurred
 * @returns {void}
 * */

  function onError(error) {
    console.log(browser.i18n.getMessage('errorLabel') + `: ${error}`);
  }

  let getting = browser.storage.local.get(["apiKey", "model", "temperature"]);
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", function() {
  // Restore options
  restoreOptions();

  // Set focus on the API key input
  document.querySelector("#apiKey").focus();

  // Localize the popup's elements
  document.getElementById('api-settings').textContent = browser.i18n.getMessage('apiSettingsLabel');
  document.getElementById('apiKeyLabel').textContent = browser.i18n.getMessage('apiKeyLabel');
  document.getElementById('modelLabel').textContent = browser.i18n.getMessage('modelLabel');
  document.getElementById('tempLabel').textContent = browser.i18n.getMessage('temperatureLabel');
  document.querySelector('#save .button-text').textContent = browser.i18n.getMessage('saveLabel');

  // Set the window title
  window.title = browser.i18n.getMessage('extensionName');
});

// Listen for the form to be submitted and save the options
document.querySelector("#options-form").addEventListener("submit", saveOptions);
