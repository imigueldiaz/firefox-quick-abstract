// Description: This script is used to call the Perplexity API and return the response to the content script.
function callPerplexityAPI(apiKey, model, temperature, content) {
  const systemPrompt = `You are an AI assistant that generates concise, high-quality abstracts and keywords for webpage content.

Instructions:
1. Analyze the provided webpage text and identify the main topics, key points and overall meaning. 
2. Generate an abstract in the SAME LANGUAGE as the webpage content. This is crucial. If the webpage is in Spanish, the abstract MUST be in Spanish. If the webpage is in French, the abstract MUST be in French, and so on.
3. The abstract should:
   - Accurately and concisely summarize the key information 
   - Be well-written, precise and easy to understand
   - Contain the most important points without extraneous details
   - Be formated as a single paragraphs of plain text with no HTML, or markdown or special characters.
4. Extract the most relevant keywords from the text that capture the main topics and themes.
5. Format the output as follows, including the abstract and keywords:
<div class="abstract">{abstract}</div>
<div class="keywords">{foreach keyword in keywords: <span class="keyword">{keyword}</span> }</div>

Additional Suggestions:
- If the webpage text is long, focus the abstract on the most important sections or ideas. Don't try to cover everything.
- Aim for an abstract length of 100-200 words in most cases. Use your judgment based on the webpage length and density of information.
- Choose 3-5 keywords that are specific, descriptive and capture the main topics. Avoid vague or overly broad keywords.
- Ensure proper grammar, spelling and punctuation in the abstract.
- Do not include any information in the abstract that is not covered in the webpage text.
- Remember, the abstract MUST be in the same language as the webpage content.

Begin!`;



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
        {role: 'system', content: systemPrompt},
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
