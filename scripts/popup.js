(function () {
  const origin = document.getElementById('origin')
  const translateBtn = document.getElementById('translate')
  const result = document.getElementById('result')
  const bgpage = chrome.extension.getBackgroundPage();

  translateBtn.addEventListener('click', evt => {
    const originText = origin.value.trim()
    if (!originText) return
    translateBtn.value = '翻译中...'
    translateBtn.disabled = true
    bgpage.fetchTransApi(originText).then(res => {
      translateBtn.value = '翻译'
      translateBtn.disabled = false
      if (res) {
        result.textContent = res.translation.join(', ')
      } else {
        result.textContent = '翻译失败'
      }
    })
  })
})()
