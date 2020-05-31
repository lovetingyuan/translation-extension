(function () {
  const origin = document.getElementById('origin')
  const translateBtn = document.getElementById('translate')
  const result = document.getElementById('result')
  const bgpage = chrome.extension.getBackgroundPage();

  const translate = (text) => {
    if (!text) return
    translateBtn.value = '翻译中...'
    translateBtn.disabled = true
    bgpage.fetchTransApi(text).then(res => {
      translateBtn.value = '翻译'
      translateBtn.disabled = false
      if (res) {
        result.textContent = res.translation.join(', ')
      } else {
        result.textContent = '翻译失败'
      }
    })
  }
  origin.addEventListener('keydown', evt => {
    if (evt.keyCode === 13) {
      translate(origin.value)
    }
    // return true
  })
  translateBtn.addEventListener('click', evt => {
    translate(origin.value)
  })
})()
