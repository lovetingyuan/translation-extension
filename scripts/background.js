console.log('background script')
chrome.contextMenus.create({
  title: '翻译选择的词汇',
  contexts: ["selection"],  // ContextType
  onclick() {
    handleRightClickMenu()
  } // A callback function
});

function handleRightClickMenu () {
  sendToContentScript({action: "GET_SELECTED_TEXT"}, response => {
    fetchTransApi(response.data).then(res => {
      sendToContentScript({
        action: 'FETCHED_TRANSLATION',
        payload: res
      })
    })
  })
}

function sendToContentScript (payload, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, payload, function(response) {
      callback && callback(response)
    });
  });
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
  }).then(res => res.json()).catch(err => {
    console.log(err)
  })
}

