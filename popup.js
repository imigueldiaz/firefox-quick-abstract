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
        func: () => {
          // Attempt to select the main content of the page
          const mainContentSelectors = ['article', 'main', '.post', '#content', ".entry", "#entry"];
          let mainContent;
          for (let selector of mainContentSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
          }
          // Fallback to using the whole body if no main content is found
          if (!mainContent) mainContent = document.body;

          // Remove known ad, header and footer selectors
          const adAndFooterSelectors = ['.ad', 'footer', '.footer', '#footer', '.ads', '.advertisement', '.ad-container', '.ad-wrapper', '.ad-banner', '.ad-wrapper', '.ad-slot', '.ad-block', '.sidebar', '#sidebar', 'header', '.header', '#header']
          adAndFooterSelectors.forEach(selector => {
            const elements = mainContent.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

          // Return the cleaned text
          return mainContent.innerText || mainContent.textContent;
        }
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




