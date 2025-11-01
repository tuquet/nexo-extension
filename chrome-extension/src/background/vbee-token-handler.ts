/**
 * This module is responsible for capturing the Vbee authentication token
 * by listening to web requests.
 */

const VEE_API_URL_PATTERN = 'https://vbee.vn/api/*';

const handleVbeeToken = (details: chrome.webRequest.WebRequestHeadersDetails) => {
  const authHeader = details.requestHeaders?.find(header => header.name.toLowerCase() === 'authorization');

  if (authHeader?.value && authHeader.value.startsWith('Bearer ')) {
    const newToken = authHeader.value.substring(7);
    storeVbeeTokenIfChanged(newToken);
  }
};

const storeVbeeTokenIfChanged = async (newToken: string) => {
  const result = await chrome.storage.local.get('vbee_token');
  const oldToken = result.vbee_token;

  if (newToken !== oldToken) {
    await chrome.storage.local.set({ vbee_token: newToken });
    console.log('New Vbee token captured and stored.');
    chrome.runtime.sendMessage({
      type: 'VBEE_TOKEN_CAPTURED',
      token: newToken,
    });
  }
};

export const initializeVbeeTokenListener = () => {
  chrome.webRequest.onBeforeSendHeaders.addListener(
    handleVbeeToken,
    {
      urls: [VEE_API_URL_PATTERN],
      types: ['xmlhttprequest'],
    },
    ['requestHeaders'],
  );
  console.log('Vbee token listener initialized.');
};
