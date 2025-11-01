import 'webextension-polyfill';

console.log('Background script loaded.');

const VEE_API_URL_PATTERN = 'https://vbee.vn/api/*';

const handleVbeeToken = (details: chrome.webRequest.WebRequestHeadersDetails) => {
  // Tìm header 'Authorization'
  const authHeader = details.requestHeaders?.find(header => header.name.toLowerCase() === 'authorization');

  if (authHeader?.value && authHeader.value.startsWith('Bearer ')) {
    const newToken = authHeader.value.substring(7); // Cắt bỏ "Bearer "

    // Gọi hàm async để xử lý lưu token
    storeVbeeTokenIfChanged(newToken);
  }
};

const storeVbeeTokenIfChanged = async (newToken: string) => {
  // Lấy token hiện tại từ storage để so sánh
  const result = await chrome.storage.local.get('vbee_token');
  const oldToken = result.vbee_token;

  // Chỉ cập nhật storage nếu token thay đổi
  if (newToken !== oldToken) {
    await chrome.storage.local.set({ vbee_token: newToken });
    console.log('New Vbee token captured and stored.', newToken);
    // Gửi tin nhắn đến các phần khác của extension (ví dụ: New Tab page)
    chrome.runtime.sendMessage({
      type: 'VBEE_TOKEN_CAPTURED',
      token: newToken,
    });
  }
};

chrome.webRequest.onBeforeSendHeaders.addListener(
  handleVbeeToken,
  {
    urls: [VEE_API_URL_PATTERN],
    types: ['xmlhttprequest'], // Bắt cả XHR và Fetch requests
  },
  ['requestHeaders'],
);
