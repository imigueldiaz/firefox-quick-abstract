# Perplexity Abstract Creator

A Firefox extension that generates a professional abstract and keywords for the current tab's content using the Perplexity AI API.

> **Disclaimer**: _This is an alpha version extension created for self-learning purposes. It is not a professional, full-featured extension. Maintenance and updates will be provided as possible during the developer's limited free time._

## Features
- Fetches the text content of the active tab
- Sends the content to the Perplexity API for abstract and keyword generation 
- Displays the generated abstract and keywords in the extension popup
- Generates an APA citation for the webpage based on the title, author, and publication date
- Allows customization of API key, model, and temperature through the options page

## Installation
1. Clone this repository or download the source code
2. Open Firefox and go to `about:debugging`
3. Click on "This Firefox" in the left sidebar
4. Click on the "Load Temporary Add-on" button
5. Navigate to the directory where you cloned/downloaded the source code and select the `manifest.json` file
6. The extension should now be loaded and visible in your extensions list

## Usage
1. Navigate to a web page you want to generate an abstract for
2. Click on the extension icon in the Firefox toolbar
3. Click the "Resume" button in the popup to fetch the page content and send it to the Perplexity API
4. The generated abstract, keywords, and APA citation will be displayed in the popup textarea
5. To change settings like your API key, model, or temperature, click the "Settings" button to open the options page

## Configuration
The extension uses the following default configuration:
- API Key: 'pplx-xxxxxxxxxxx' (replace with your own or it won't work)
- Model: 'sonar-medium-chat'
- Temperature: 1

You can change these settings on the options page.

## Files

- `manifest.json`: The extension manifest file defining metadata, permissions, and scripts
- `popup.html`: The HTML structure for the extension popup
- `popup.js`: JavaScript handling popup interactions and API calls
- `background.js`: Background script for handling API requests and responses
- `options.html`: Options page for configuring API key, model, and temperature
- `options.js`: JavaScript for handling options page interactions and storage
- `style.css`: Stylesheet for the extension
- `icons/`: Directory containing the extension icons in various sizes

## Dependencies

This extension relies on the Perplexity AI API. You need to sign up for an API key at [https://www.perplexity.ai/](https://www.perplexity.ai/) to use this extension.

## Internationalization (i18n)

This extension now supports internationalization, allowing users to interact with it in their preferred language. The following languages are currently supported:

- English (default)
- Spanish
- French

### Language Files

The language-specific message files are located in the `_locales` directory, organized by locale code. Each locale directory contains a `messages.json` file that defines the localized strings for that language.

Example:
- `_locales/en/messages.json`: English messages
- `_locales/es/messages.json`: Spanish messages
- `_locales/fr/messages.json`: French messages

### Using Localized Strings

The extension uses the `browser.i18n` API to retrieve localized strings in the JavaScript code. The `getMessage()` function is used to get the localized string for a given message ID.

Example:
```javascript
const localizedString = browser.i18n.getMessage('messageId');
```
To use localized strings in HTML files, you can use the __MSG_messageId__ syntax in the HTML attributes or content. Example:
```html
<button title="__MSG_buttonTitle__">Click me</button>
```
### Adding New Languages
To add support for a new language, follow these steps:

1. Create a new directory in the \_locales directory with the locale code of the language (e.g., 'de' for German).
2. Create a messages.json file inside the new locale directory.
3. Add the localized strings for the new language in the messages.json file, following the same format as the existing language files.
4. Update the list of supported languages in the README.md file.

With the i18n support, the Perplexity Abstract Creator extension can now reach a wider audience and provide a localized user experience.

### License
This project is open-source and available under the MIT License. Feel free to use, modify, and distribute the code as you see fit.

