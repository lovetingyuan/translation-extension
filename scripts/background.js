console.log('background script')
chrome.contextMenus.create({
  title: '翻译选择的词汇',
  contexts: ["selection"],  // ContextType
  onclick() {
    sendToContentScript({action: "GET_SELECTED_TEXT"}, response => {
      fetchTransApi(response.data).then(res => {
        sendToContentScript({
          action: 'FETCHED_TRANSLATION',
          payload: res
        })
      })
    })
  } // A callback function
});

function sendToContentScript (payload, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, payload, function(response) {
      callback && callback(response)
    });
  });
}

function escapeHTML (unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

function fetchTransApi (q) {
  const url = 'https://aidemo.youdao.com/trans'
  // const headers = new Headers()
  // headers.append('Content-Type', 'application/json')
  const body = new FormData()
  body.append('q', q)
  body.append('from', 'auto')
  body.append('to', 'auto')

  return fetch(url, {
    method: 'POST',
    // headers,
    body
  }).then(res => res.json()).then(res => {
    if (res && res.translation) {
      res.translation = res.translation.map(escapeHTML)
    }
    if (res && res.errorCode == '0') {
      return res
    }
  }).catch(err => {
    console.log(err)
  })
}

