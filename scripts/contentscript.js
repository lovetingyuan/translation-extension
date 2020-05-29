; (function () {
  function getSelectionText() {
    let text = "";
    if (window.getSelection) {
      text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
      text = document.selection.createRange().text;
    }
    return text;
  }

  const ID = 'translation-result-dialog-CCNVUGFN8HSDKHONI8W9E'

  const dialogTemplate = `
  <dialog id="${ID}">
    <span id="${ID}-close" title="关闭">×</span>
    <ul style="text-align: left;">
      <li>
        <p>
          <span id="${ID}-origin"></span><span title="播放" id="${ID}-origin-speaker">🔈</span>
        </p>
      </li>
      <li>
        <p>
          <span id="${ID}-result"></span><span title="播放" id="${ID}-result-speaker">🔈</span>
        </p>
      </li>
    </ul>
    <audio id="${ID}-player"></audio>
  </dialog>
  `

  const dialogStyle = `
  #${ID} {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    padding: 26px 40px;
    min-width: 160px;
    transform: perspective(500px) translate(-50%, -50%);
    background: linear-gradient(to bottom, #FFF, #F4F4F4) #FFF;
    border: none;
    border-radius: 3px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    transform-origin: 50% 50%;
    animation: dialog-${ID} 300ms cubic-bezier(.3,0,.1,1.4) forwards 1;
    will-change: transform, opacity;
    font-size: 16px;
  }
  #${ID}-close {
    cursor: pointer;
    display: inline-block;
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 30px;
    position: absolute;
    right: 20px;
    top: 20px;
  }
  #${ID}-origin, #${ID}-result {
    display: inline-block;
    margin-right: 16px;
  }
  #${ID}-origin-speaker, #${ID}-result-speaker {
    cursor: pointer;
    user-select: none;
  }
  #${ID}-origin:before {
    content: "原文: ";
    display: inline-block;
    margin-right: 12px;
    font-weight: 500;
  }
  #${ID}-result:before {
    content: "结果: ";
    display: inline-block;
    margin-right: 12px;
    font-weight: 500;
  }
  
  @keyframes dialog-${ID} {
    from {
      transform: perspective(500px) translate(-50%, -25%) rotateX(45deg) scale(0.1);
      opacity: 0;
    }
  }
  
  dialog::backdrop {
    opacity: 0;
    will-change: opacity;
    /* cursor: no-drop; */
  
    /** option 1: "grey" */
    /*
    background: rgba(0,0,0,0.3);
    */
  
    /** option 2: "checkerboard" */
    /*
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect x="0" y="0" width="1" height="1" fill="rgba(255,255,255,0.2)" /><rect x="1" y="1" width="1" height="1" fill="rgba(255,255,255,0.2)" /></svg>') rgba(0,0,0,0.3);
    background-size: 2px 2px;
    */
    
    /** option 3: "zoom" */
    background: radial-gradient(circle at center, rgba(50,50,50,0.5), rgba(0,0,0,0.5));
    animation: backdrop-${ID} 500ms ease forwards 1;
  }
  
  @keyframes backdrop-${ID} {
    from { opacity: 0; }
    to { opacity: 1; }
  }`

  const dialogDom = document.createElement('div')
  dialogDom.innerHTML = dialogTemplate.trim()

  function showDialog(originText, translation, speakerUrl, tspeakerUrl) {
    let translationResultDialog = document.getElementById(ID)
    if (!translationResultDialog) {
      translationResultDialog = dialogDom.firstElementChild
      translationResultDialog.addEventListener('click', (evt) => {
        if (evt.target.id === ID) {
          const rect = translationResultDialog.getBoundingClientRect();
          const isInDialog = (rect.top <= evt.clientY && evt.clientY <= rect.top + rect.height
            && rect.left <= evt.clientX && evt.clientX <= rect.left + rect.width);
          if (!isInDialog) {
            translationResultDialog.close();
          }
        } else if (evt.target.id === ID + '-origin-speaker' || evt.target.id === ID + '-result-speaker') {
          const player = document.getElementById(ID + '-player')
          player.src = evt.target.dataset.url
          player.play()
        } else if (evt.target.id === ID + '-close') {
          translationResultDialog.close()
        }
      })
      const style = document.createElement('style')
      style.textContent = dialogStyle
      document.body.appendChild(style)
      document.body.appendChild(translationResultDialog)
    }
    document.getElementById(ID + '-origin').textContent = originText
    document.getElementById(ID + '-origin-speaker').dataset.url = speakerUrl

    document.getElementById(ID + '-result').textContent = translation.join(', ')
    document.getElementById(ID + '-result-speaker').dataset.url = tspeakerUrl

    translationResultDialog.showModal()
  }

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      // console.log(sender.tab ?
      //             "from a content script:" + sender.tab.url :
      //             "from the extension");
      if (!sender.tab) { // from extension
        if (request.action === 'GET_SELECTED_TEXT') {
          sendResponse({
            data: getSelectionText()
          })
        } else if (request.action === 'FETCHED_TRANSLATION') {
          if (!request.payload) {
            alert('翻译失败...')
          } else {
            const {
              query, translation, speakUrl, tSpeakUrl
            } = request.payload
            showDialog(query, translation, speakUrl, tSpeakUrl)
          }
        }
      }
    }
  );

})();
