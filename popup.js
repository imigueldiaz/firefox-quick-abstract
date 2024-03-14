document.getElementById('openOptions').addEventListener('click', function() {
  if (browser.runtime.openOptionsPage) {
    // New way to open options pages, if supported (Firefox 42+).
    browser.runtime.openOptionsPage();
  } else {
    // Reasonable fallback.
    window.open(browser.runtime.getURL('options.html'));
  }
});

function getConfiguration() {
  return browser.storage.sync.get({
    apiKey: 'pplx-xxxxxxxxxxx', // Default API key
    model: 'sonar-medium-chat', // Default model
    temperature: 1 // Default temperature
  });
}


function fetchTabContent() {
  return new Promise((resolve, reject) => {
    browser.tabs.query({active: true, currentWindow: true})
    .then((tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        func: () => document.body.innerText
      }, (injectionResults) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(injectionResults[0].result);
        }
      });
    }).catch(reject);
  });
}


function triggerAPI() {
  getConfiguration().then(config => {
    fetchTabContent().then(content => {
      browser.runtime.sendMessage({
        type: 'CALL_API',
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        content: content
      }).then(response => {
        // Handle the response from the API call
        console.log(response.data);
        // Extract the 'content' from the response and update the textarea
        const assistantMessageContent = response.data.choices[0].message.content;
        document.getElementById('apiResponse').textContent = assistantMessageContent;
      }).catch(error => {
        console.error(`Error in sending message to background script: ${error}`);
      });
    });
  });
}

// Example: Call triggerAPI when a button is clicked
document.getElementById('resume').addEventListener('click', triggerAPI);




// Example: Call triggerAPI when a button is clicked
    document.getElementById('resume').addEventListener('click', triggerAPI);




