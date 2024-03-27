const MAX_WORDS = 14000;

/**
* Add event listeners to the popup's elements
* to trigger the API call and open the options page
* when the corresponding buttons are clicked.
*/


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
          function getAuthor(document) {
              // Check for <meta name="author"> tag
            const metaAuthor = document.querySelector('meta[name="author"]')?.content;
            if (metaAuthor) {
              return metaAuthor.trim();
            }

              // Check for schema.org markup
            const schemaAuthor = document.querySelector('*[itemprop="author"]')?.textContent;
            if (schemaAuthor) {
              return schemaAuthor.trim();
            }

              // Look for bylines in the article body
            const articleBody = document.querySelector('article')?.textContent;
            if (articleBody) {
              const bylineRegex = /by\s+([\w\s.]+)/i;
              const bylineMatch = articleBody.match(bylineRegex);
              if (bylineMatch) {
                return bylineMatch[1].trim();
              }
            }

              // Check Open Graph and Twitter card metadata
            const ogAuthor = document.querySelector('meta[property="article:author"]')?.content;
            if (ogAuthor) {
              return ogAuthor.trim();
            }

            const twitterAuthor = document.querySelector('meta[name="twitter:creator"]')?.content;
            if (twitterAuthor) {
              return twitterAuthor.trim();
            }

              // Analyze the page title
            const titleAuthorRegex = / by ([\w\s.]+)/i;
            const titleMatch = document.title.match(titleAuthorRegex);
            if (titleMatch) {
              return titleMatch[1].trim();
            }

              // If no author found, return an empty string
            return '';
          }

            // Get the page title
          const pageTitle = document.title;

            // Get the author (if available)
          const author = getAuthor(document);

            // Get the publication date (if available)
          let publicationDate = document.querySelector('meta[property="article:published_time"]')?.content;

            // If publication date is not available, use the last modified date as a fallback
          if (!publicationDate) {
            const lastModified = document.lastModified;
            if (lastModified) {
              publicationDate = new Date(lastModified).toISOString();
    }
  }

            // First, check if the user has selected any text
  const selection = window.getSelection().toString().trim();
  if (selection) {
              // If there's a selection, return it directly
    console.log('User selection:', selection);
    return {
      content: selection,
      pageTitle,
      author,
      publicationDate
    };
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
const unwantedSelectors = ['.ad', 'footer', '.footer', '#footer', '.ads', '.advertisement',
  '.ad-container', '.ad-wrapper', '.ad-banner', '.ad-wrapper', 'figure', 'figurecaption',
  '.ad-slot', '.ad-block', '.sidebar', '#sidebar', 'header', '.header', '#header',
  'ul', 'ol', '.toc', '#toc', 'nav', '.right-menu', '.right-sidebar', '.right-column', 'aside',
  '.left-menu', '.left-sidebar', '.left-column', '.navigation', '.menu', '#menu'];

unwantedSelectors.forEach(selector => {
  const elements = mainContent.querySelectorAll(selector);
  elements.forEach(el => el.remove());
});

            // Remove script and style tags, empty paragraphs and line breaks
const scriptAndStyleTags = mainContent.querySelectorAll('script, style, p:empty, br');
scriptAndStyleTags.forEach(el => el.remove());

            // Clean the text content of the main element
const cleanedText = DOMPurify.sanitize(mainContent.innerText).replace(/\s+/g, ' ').trim();

return {
  content: cleanedText,
  pageTitle,
  author,
  publicationDate
};
}
}, (injectionResults) => {
  if (browser.runtime.lastError) {
    reject(new Error(browser.runtime.lastError.message));
} else {
  const result = injectionResults[0].result;
  if (typeof result === 'object' && result.content) {
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
    const container = document.getElementById('responseContainer');

    getConfiguration().then(config => {
    // Check if the API key is the default value
      if (!config.apiKey || config.apiKey === 'pplx-xxxxxxxxxxx') {
      responseDiv.textContent = browser.i18n.getMessage('apiKeyErrorMessage');
        return;
      }

      responseDiv.style.display = 'none';
      spinner.style.display = 'block';

      fetchTabContent().then(({content, pageTitle, author, publicationDate}) => {
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
          // Inside the API response handling code
  apiResponse.innerHTML = sanitizedContent;
  generateAPACitation(pageTitle, author, publicationDate).then((citation) => {
    const citationElement = document.createElement('div');
    citationElement.classList.add('citation');
    citationElement.innerHTML = citation;
    apiResponse.appendChild(citationElement);

  // Call adjustPopupHeight after updating the content
    //adjustPopupHeight();
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

/**
 * Generate an APA citation based on the title, author, and date.
 * @param {string} title - The title of the content.
 * @param {string} author - The author of the content.
 * @param {string} date - The publication date of the content.
 * @returns {Promise} A promise that resolves with the APA citation.
 * The APA citation includes the title, author, date, and URL of the content.
 * If the author is not available, the citation uses 'n.d.' for 'no date'.
 * If the date is not available, the citation uses the current date.
 * If the URL is not available, the citation does not include it.
 * The citation is formatted as a string with HTML tags.
 */

        function generateAPACitation(title, author, date) {
          const locale = navigator.language;
          const formattedDate = date ? new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : 'n.d.';
      const formattedAuthor = author ? author : browser.i18n.getMessage('noAuthorLabel');

      return new Promise((resolve) => {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          const currentTabUrl = tabs[0].url;

          const citation = `
          <section class="citation">
          <p>
          ${formattedAuthor}. (${formattedDate}). <em>${title}</em>. ${browser.i18n.getMessage('retrievedLabel')} ${new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })} ${browser.i18n.getMessage('fromLabel')} <a href="${currentTabUrl}" target="_blank">${currentTabUrl}</a>
          </p>
          </section>
          `;

          resolve(citation);
        });
      });
        }

/**
 * Clean the markdown content by removing code blocks.
 * @param {string} content - The markdown content to clean.
 * @returns {string} The cleaned markdown content.
 */
        function cleanMarkdown(content) {
  // Remove markdown code blocks
  // the text is surrounded by ``` and the language is specified after the first ```
  // we only want to remove the initial ``` and the language, and the final ```
          const codeBlockRegex = /```(?:\w+)?/g;
        return content.replace(codeBlockRegex, '');
      }

/**
 * Adjust the height of the popup based on the content.
 * This function calculates the total height of all elements that should be included in the popup's height
 * and sets the body height to the total height calculated, with some extra space if needed.
 * The extra space is added to prevent the popup from resizing when the content changes.
 * @returns {void}
 */
      function adjustPopupHeight() {
        const elementsToInclude = [
        document.getElementById('apiResponse'),
        ...document.querySelectorAll('.button-container'),
        //...document.querySelectorAll('.citation')
        ];

let totalHeight = 0;
elementsToInclude.forEach(element => {
  const style = window.getComputedStyle(element);
  const marginTop = parseInt(style.marginTop, 10);
  const marginBottom = parseInt(style.marginBottom, 10);
  const paddingTop = parseInt(style.paddingTop, 10);
  const paddingBottom = parseInt(style.paddingBottom, 10);
  const elementHeight = element.scrollHeight + marginTop + marginBottom + paddingTop + paddingBottom;
  totalHeight += elementHeight;
});

  // Set the body height to the exact total height needed
document.body.style.height = `${totalHeight}px`;
}



// Add an event listener to the resume button to trigger the API call
document.getElementById('resume').addEventListener('click', triggerAPI);

// Add an event listener to the popup's elements
document.addEventListener("DOMContentLoaded", function() { 
  // Set the focus on the resume button
  document.getElementById('resume').focus();
  
  // Set the text of the buttons and the title of the popup
  document.querySelector('#popupTab .button-text').textContent = browser.i18n.getMessage('startHereLabel');
  document.querySelector('#optionsTab .button-text').textContent = browser.i18n.getMessage('settingsLabel');

  document.querySelector('#copyMarkdown .button-text').textContent = browser.i18n.getMessage('copyMarkdownLabel');
  document.querySelector('#copyHtml .button-text').textContent = browser.i18n.getMessage('copyHtmlLabel');
  document.querySelector('#copyText .button-text').textContent = browser.i18n.getMessage('copyTextLabel');
  document.querySelector('#resume .button-text').textContent = browser.i18n.getMessage('summarizeLabel');

  document.getElementById('initialText').innerText = browser.i18n.getMessage('initialText');
  document.title = browser.i18n.getMessage('extensionName');
  
});

// Add event listeners for copy buttons
document.getElementById('copyHtml').addEventListener('click', copyHtml);
document.getElementById('copyMarkdown').addEventListener('click', copyMarkdown);
document.getElementById('copyText').addEventListener('click', copyText);

// Function to copy the content as HTML
function copyHtml() {
  // const abstractHtml = document.querySelector('.abstract').outerHTML;
  // const keywordsHtml = document.querySelector('.keywords').outerHTML;
  // const citationHtml = document.querySelector('.citation').outerHTML;
  // const fullHtml = `${abstractHtml}\n${keywordsHtml}\n${citationHtml}`;
  const fullHtml = document.getElementById('apiResponse').innerHTML;
  copyToClipboard(fullHtml);
}

// Function to copy the content as Markdown
function copyMarkdown() {
  const abstractText = document.querySelector('.abstract').innerText;
  const keywordsText = Array.from(document.querySelectorAll('.keyword')).map(keyword => `- ${keyword.innerText}`).join('\n');
  const citationText = document.querySelector('.citation').innerText;
  const markdownText = `## Abstract\n\n${abstractText}\n\n## Keywords\n\n${keywordsText}\n\n## Citation\n\n${citationText}`;
  copyToClipboard(markdownText);
}

// Function to copy the content as plain text
function copyText() {
  const abstractText = document.querySelector('.abstract').innerText;
  const keywordsText = Array.from(document.querySelectorAll('.keyword')).map(keyword => keyword.innerText).join(', ');
  const citationText = document.querySelector('.citation').innerText;
  const plainText = `Abstract:\n${abstractText}\n\nKeywords: ${keywordsText}\n\nCitation:\n${citationText}`;
  copyToClipboard(plainText);
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  const tempTextarea = document.createElement('textarea');
  tempTextarea.value = text;
  document.body.appendChild(tempTextarea);
  tempTextarea.select();
  document.execCommand('copy');
  document.body.removeChild(tempTextarea);
}
