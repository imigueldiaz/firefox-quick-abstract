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

  const topk = parseFloatOrDefault(document.querySelector("#topK").value, 0);
  const topp = parseFloatOrDefault(document.querySelector("#topP").value, 0);
  const frequencyPenalty = parseFloatOrDefault(document.querySelector("#frequencyPenalty").value,-2);
  const presencePenalty = parseFloatOrDefault(document.querySelector("#presencePenalty").value,0);

  if (topk !== 0 && topp !== 0) {
    console.error("Error: topk and topp are mutually exclusive. Please only set one of them.");
    showErrorBadge(browser.i18n.getMessage('errorTopkTopp'));
    return;
  }
  if (frequencyPenalty !== -2 && presencePenalty !== 0) {
    console.error("Error: frequencyPenalty and presencePenalty are mutually exclusive. Please only set one of them.");
    showErrorBadge(browser.i18n.getMessage('errorFrequencyPresence'))
    return;
  }

  browser.storage.local.set({
    apiKey: document.querySelector("#apiKey").value,
    model: document.querySelector("#model").value,
    temperature: parseFloatOrDefault(document.querySelector("#temperature").value, 1),
    topk: topk,
    topp: topp,
    frequencyPenalty: frequencyPenalty,
    presencePenalty: presencePenalty,
    maxTokens: parseFloatOrDefault(document.querySelector("#maxTokens").value, 0),
  }).then(() => {
    console.log("Settings saved");
    showInfoBadge();
  }, (error) => {
    console.error(`Error saving settings: ${error}`);
    showErrorBadge(`Error saving settings: ${error}`);
  });
}

function showErrorBadge(message) {
  const errorBadge = document.getElementById('saveError');
  if (errorBadge) {
    errorBadge.textContent = message || browser.i18n.getMessage('saveErrorMessage');
    errorBadge.style.opacity = '1';
    setTimeout(() => {
      errorBadge.style.opacity = '0';
      setTimeout(() => errorBadge.remove(), 500);
    }, 2000);
  }
}


function parseFloatOrDefault(value,defaultVal) {
  const parsedValue = parseFloat(value);
  return isNaN(parsedValue) ? defaultVal : parsedValue;
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
    document.querySelector("#topK").value = result.topk || 0;
    document.querySelector("#topP").value = result.topp || 0;
    document.querySelector("#frequencyPenalty").value = result.frequencyPenalty || -2;
    document.querySelector("#presencePenalty").value = result.presencePenalty || 0;
    document.querySelector("#maxTokens").value = result.maxTokens || 0;
  }

/**
 * Log an error if the options were not restored
 * @param {Error} error - The error that occurred
 * @returns {void}
 * */

  function onError(error) {
    console.log(browser.i18n.getMessage('errorLabel') + `: ${error}`);
  }

  let getting = browser.storage.local.get(["apiKey", "model", "temperature", "topk", "topp", "frequencyPenalty", "presencePenalty", "maxTokens"]);
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
