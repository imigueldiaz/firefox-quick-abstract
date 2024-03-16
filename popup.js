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
    browser.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
            // Attempt to select the main content of the page
          const mainContentSelectors = ['article', 'main', '.main', '#main', '.post', '#content', '.entry', '#entry'];
          let mainContent;
          for (let selector of mainContentSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
          }

            // Fallback to using the whole body if no main content is found
          if (!mainContent) mainContent = document.body;

            // Remove known ad, header, lists, toc, footer, and navigation selectors
          const unwantedSelectors = ['.ad', 'footer', '.footer', '#footer', '.ads', '.advertisement', '.ad-container', '.ad-wrapper', '.ad-banner', '.ad-wrapper', '.ad-slot', '.ad-block', '.sidebar', '#sidebar', 'header', '.header', '#header', 'ul', 'ol', '.toc', '#toc', 'nav'];
          unwantedSelectors.forEach(selector => {
            const elements = mainContent.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

            // Remove right and left menus or divs with non-pertinent content
          const rightMenuSelectors = ['.right-menu', '.right-sidebar', '.right-column', 'aside'];
          const leftMenuSelectors = ['.left-menu', '.left-sidebar', '.left-column'];
          rightMenuSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });
          leftMenuSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

            // Remove script and style tags
          const scriptAndStyleTags = mainContent.querySelectorAll('script, style');
          scriptAndStyleTags.forEach(el => el.remove());

            // Remove empty paragraphs and line breaks
          const emptyElements = mainContent.querySelectorAll('p:empty, br');
          emptyElements.forEach(el => el.remove());

            // Normalize whitespace and trim the content
          const cleanedText = mainContent.innerText.replace(/\s+/g, ' ').trim();

            // Return the cleaned text
          return cleanedText;
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
        // Check if the response contains a data object with an error
        if (response.data && response.data.error) {
          console.error('API Error:', response.data.error.message);
          // Display the error message to the user
          document.getElementById('apiResponse').textContent = 'API Error: ' + response.data.error.message;
        } else {
          // Handle the successful response from the API call
          console.log(response.data);
          // Extract the 'content' from the response and update the textarea
          const assistantMessageContent = response.data.choices[0].message.content;
          document.getElementById('apiResponse').innerHTML = assistantMessageContent;
          requestAnimationFrame(() => {
          adjustPopupHeight(); // Adjust the height of the popup based on the content
        });
        }
      }).catch(error => {
        // Handle errors in sending the message to the background script
        console.error(`Error in sending message to background script: ${error}`);
        document.getElementById('apiResponse').textContent = 'Error: ' + error.message;
      });
    });
  });
}

function adjustPopupHeight() {
  // Calculate the total height of all elements that should be included in the popup's height
  const elementsToInclude = [document.getElementById('apiResponse'), ...document.querySelectorAll('.button-container')];
  let totalHeight = 0;

  // Add up the height of each element, including margins
  elementsToInclude.forEach(element => {
    const style = window.getComputedStyle(element);
    const marginTop = parseInt(style.marginTop, 10);
    const marginBottom = parseInt(style.marginBottom, 10);
    // Use scrollHeight instead of offsetHeight to get the full height of the content
    const elementHeight = element.scrollHeight + marginTop + marginBottom;
    totalHeight += elementHeight + 10;
  });

  // Set the body height to the total height calculated, with some extra space if needed
  document.body.style.height = `${totalHeight}px`;
}


document.getElementById('resume').addEventListener('click', triggerAPI);
