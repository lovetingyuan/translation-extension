(function () {
  const origin = document.getElementById('origin')
  const translateBtn = document.getElementById('translate')
  const result = document.getElementById('result')
  const bgpage = chrome.extension.getBackgroundPage();
  function copyTextToClipboard (text) {
    const copyFrom = document.createElement("textarea");
    copyFrom.textContent = text;
    document.body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    copyFrom.blur();
    document.body.removeChild(copyFrom);
  }
  const translate = (text) => {
    if (!text) return
    translateBtn.value = '翻译中...'
    translateBtn.disabled = true
    document.querySelectorAll('button').forEach(btn => {
      btn.disabled = true
    })
    bgpage.fetchTransApi(text).then(res => {
      translateBtn.value = '翻译'
      translateBtn.disabled = false
      document.querySelectorAll('button').forEach(btn => {
        btn.disabled = false
      })
      if (res) {
        result.innerHTML = ''
        result.textContent = res.translation.join(', ')
      } else {
        result.innerHTML = '<span class="error-text">翻译失败</span>'
        document.querySelectorAll('button').forEach(btn => {
          btn.disabled = true
        })
      }
    })
  }
  origin.addEventListener('keydown', evt => {
    if (evt.keyCode === 13) {
      translate(origin.value)
    }
  })
  translateBtn.addEventListener('click', evt => {
    translate(origin.value)
  })
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', evt => {
      if (evt.target.id === 'copy') {
        if (result.textContent) {
          copyTextToClipboard(result.textContent)
        }
      } else if (evt.target.id === 'view') {
        window.open('https://youdao.com/w/' + encodeURIComponent(origin.value))
      }
    })
  })
})()
