console.log('background script')

const current = {
  word: '',
  translation: null
}

const menuId = chrome.contextMenus.create({
  title: '翻译选择的词汇',
  contexts: ["selection"],  // ContextType
  // onclick: handleMenuClick
});

const createMenu = (title, onclick, parentId) => {
  return chrome.contextMenus.create({
    title,
    contexts: ["selection"],  // ContextType
    onclick,
    parentId
  });
}

const playMusic = url => {
  const context = new AudioContext();
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start();
    });
}

createMenu('播放语音', () => {
  current.translation && playMusic(current.translation.speakUrl)
}, menuId)

createMenu('查看详情', () => {
  current.word && open('https://youdao.com/w/' + encodeURIComponent(current.word))
}, menuId)

createMenu('查看简讯', () => {
  current.translation && sendToContentScript({
    action: 'FETCHED_TRANSLATION',
    payload: current.translation
  })
}, menuId)

const updateMenu = () => {
  fetchTransApi(current.word).then(res => {
    if (!res) {
      current.translation = null
      chrome.contextMenus.update(menuId, {
        title: `翻译失败：${current.word}`,
        contexts: ["selection"],
        // onclick: handleMenuClick
      });
      return
    }
    current.translation = res
    chrome.contextMenus.update(menuId, {
      title: `翻译结果：“${res.translation.join(', ')}”`,
      contexts: ["selection"],
      // onclick: handleMenuClick
    });
  })
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // console.log(sender.tab ?
  //   "from a content script:" + sender.tab.url :
  //   "from the extension");
  if (request.action === "USER_SELECTED") {
    current.word = request.selection
    current.translation = null
    updateMenu()
    sendResponse({});
  }
});

function sendToContentScript(payload, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, payload, function (response) {
      callback && callback(response)
    });
  });
}

function escapeHTML(unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

function fetchTransApi(q) {
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
      // speakUrl, tSpeakUrl
      if (res.speakUrl && res.speakUrl.startsWith('http:')) {
        res.speakUrl = res.speakUrl.replace('http:', 'https:')
      }
      if (res.tSpeakUrl && res.tSpeakUrl.startsWith('http:')) {
        res.tSpeakUrl = res.tSpeakUrl.replace('http:', 'https:')
      }
      return res
    }
  }).catch(err => {
    console.log(err)
  })
}

