// background.js

function callPerplexityAPI(apiKey, model, temperature, content) {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {role: 'system', content: 'Make a professional abstract from the user text followed by a blank line and a list of keywords'},
        {role: 'user', content: content}
      ],
      temperature: temperature
    })
  };

  return fetch('https://api.perplexity.ai/chat/completions', options)
    .then(response => response.json())
    .catch(err => console.error(err));
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CALL_API') {
    callPerplexityAPI(message.apiKey, message.model, message.temperature, message.content).then(response => {
      sendResponse({data: response});
    });
    return true; // Return true to indicate async response
  }
});
