function saveOptions(e) {
  e.preventDefault(); // Prevent the form from submitting normally
  browser.storage.sync.set({
    apiKey: document.querySelector("#apiKey").value,
    model: document.querySelector("#model").value,
    temperature: parseFloat(document.querySelector("#temperature").value)
  }).then(() => {
    console.log("Settings saved");
  }, (error) => {
    console.error(`Error saving settings: ${error}`);
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#apiKey").value = result.apiKey || 'pplx-xxxxxxxxxxx';
    document.querySelector("#model").value = result.model || 'sonar-medium-chat';
    document.querySelector("#temperature").value = result.temperature || 1;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get(["apiKey", "model", "temperature"]);
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#options-form").addEventListener("submit", saveOptions);
