const MAX_WORDS = 14000;

/**
 * Add event listeners to the popup's elements
 * to trigger the API call and open the options page
 * when the corresponding buttons are clicked.
 */
document.getElementById('openOptions').addEventListener('click', function() {
  if (browser.runtime.openOptionsPage) {
    // New way to open options pages, if supported (Firefox 42+).
    browser.runtime.openOptionsPage();
  } else {
    // Reasonable fallback.
    window.open(browser.runtime.getURL('options.html'));
  }
});


/**
 * Get the configuration from the storage
 * to use the API key, model, and temperature
 * for the API call.
 * @returns {Promise} A promise that resolves with the configuration object.
 * The configuration object contains the API key, model, and temperature.
 * The default values are used if the configuration is not set.
 * The default API key is 'pplx-xxxxxxxxxxx'.
 * The default model is 'sonar-medium-chat'. 
 * The default temperature is 1.
 */
function getConfiguration() {
  return browser.storage.local.get({
    apiKey: 'pplx-xxxxxxxxxxx', // Default API key
    model: 'sonar-medium-chat', // Default model
    temperature: 1 // Default temperature
  }).catch(error => {
    console.error(`Error getting configuration: ${error}`);
    return {
      apiKey: 'pplx-xxxxxxxxxxx', // Default API key
      model: 'sonar-medium-chat', // Default model
      temperature: 1 // Default temperature
    };
  });
}


/**
 * Fetch the main content of the active tab
 * and clean it to remove unwanted elements
 * such as ads, headers, and navigation.
 * @returns {Promise} A promise that resolves with the cleaned text content of the main element of the page.
 */

function fetchTabContent() {
  return new Promise((resolve, reject) => {
    browser.tabs.query({ active: true, currentWindow: true })
      .then((tabs) => {
        browser.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            // First, check if the user has selected any text
            const selection = window.getSelection().toString().trim();
            if (selection) {
              // If there's a selection, return it directly
              console.log('User selection:', selection);
              return selection;
            }

            // Attempt to select the main content of the page
            const mainContentSelectors = ['article', 'main', '.main', '#main', '.post', '#content', '.entry', '#entry', 'section'];
            let mainContent;
            for (let selector of mainContentSelectors) {
              mainContent = document.querySelector(selector);
              if (mainContent) break;
            }

            // Fallback to using the whole body if no main content is found
            if (!mainContent) mainContent = document.body;

            console.log('Main content:', mainContent);

            // Remove known ad, header, lists, toc, footer, and navigation selectors
            const unwantedSelectors = ['.ad', 'footer', '.footer', '#footer', '.ads', '.advertisement', '.ad-container', '.ad-wrapper', '.ad-banner', '.ad-wrapper', 'figure', 'figurecaption', '.ad-slot', '.ad-block', '.sidebar', '#sidebar', 'header', '.header', '#header', 'ul', 'ol', '.toc', '#toc', 'nav', '.right-menu', '.right-sidebar', '.right-column', 'aside', '.left-menu', '.left-sidebar', '.left-column', '.navigation', '.menu', '#menu'];
            unwantedSelectors.forEach(selector => {
              const elements = mainContent.querySelectorAll(selector);
              elements.forEach(el => el.remove());
            });

            // Remove script and style tags, empty paragraphs and line breaks
            const scriptAndStyleTags = mainContent.querySelectorAll('script, style, p:empty, br');
            scriptAndStyleTags.forEach(el => el.remove());

            // Clean the text content of the main element
            const cleanedText = DOMPurify.sanitize(mainContent.innerText).replace(/\s+/g, ' ').trim();

            return cleanedText;
          }
        }, (injectionResults) => {
          if (browser.runtime.lastError) {
            reject(new Error(browser.runtime.lastError.message));
          } else {
            const result = injectionResults[0].result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              console.error('Unexpected result type from content script:', result);
              reject(new Error('Unexpected result type from content script'));
            }
          }
        });
      }).catch(error => {
        console.error(`Error getting active tab: ${error}`);
        reject(new Error(error.message));
      });
  });
}


/**
 * Trigger the API call with the configuration
 * and the cleaned content of the active tab.
 * Display the response in the popup.
 * If the content is too long, display an error message.
 * If the API key is the default value, display a message to the user.
 * If the API response contains an error, display the error message.
 * @returns {Promise} A promise that resolves when the API call is complete.
 */
function triggerAPI() {

  // Get the response and spinner elements
  const responseDiv = document.getElementById('apiResponse');
  const spinner = document.getElementById('spinner');
  const lang = document.documentElement.lang;

  getConfiguration().then(config => {

    // Check if the API key is the default value
    if (!config.apiKey || config.apiKey === 'pplx-xxxxxxxxxxx') {
      responseDiv.textContent = browser.i18n.getMessage('apiKeyErrorMessage');
      return;
    }

    responseDiv.style.display = 'none';
    spinner.style.display = 'block';

    fetchTabContent().then(content => {

      // Check if the content is too long to send to the API
      if (content.length > MAX_WORDS) {
        responseDiv.textContent = browser.i18n.getMessage('contentTooLongErrorMessage', [content.length]);
        responseDiv.style.display = 'block';
        spinner.style.display = 'none';
        return;
      }

      browser.runtime.sendMessage({
        type: 'CALL_API',
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        content: content,
        language: lang || 'en'
      }).then(response => {
        // Check if the response contains a data object with an error
        if (response.data && response.data.error) {
          console.error('API Error:', response.data.error.message);
          // Display the error message to the user
          responseDiv.textContent = 'API Error: ' + response.data.error.message;
        } else {
          // Handle the successful response from the API call
          // Extract the 'content' from the response and update the textarea
          responseDiv.style.display = 'block';
          spinner.style.display = 'none';

          let content = response.data.choices[0]?.message?.content || "API response is empty. Please check the content of the page.";

          if (content.includes('```')) {
            content = cleanMarkdown(content);
          }

          // Sanitize the content before inserting it into the DOM
          const sanitizedContent = DOMPurify.sanitize(content);
          apiResponse.innerHTML = sanitizedContent;
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

// Ocassionally, the API response includes markdown code blocks that we want to clean
function cleanMarkdown(content) {
  // Remove markdown code blocks
  // the text is surrounded by ``` and the language is specified after the first ```
  // we only want to remove the initial ``` and the language, and the final ```
  const codeBlockRegex = /```(?:\w+)?/g;
  return content.replace(codeBlockRegex, '');
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

document.addEventListener("DOMContentLoaded", function() { 

  // Set the focus on the resume button
  document.getElementById('resume').focus();

  // Set the text of the buttons and the title of the popup
  document.getElementById('openOptions').textContent = browser.i18n.getMessage('settingsLabel');
  document.getElementById('resume').textContent = browser.i18n.getMessage('summarizeLabel');
  document.getElementById('initialText').textContent = browser.i18n.getMessage('initialText');
  document.title = browser.i18n.getMessage('extensionName');

});