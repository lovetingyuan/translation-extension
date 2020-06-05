(function () {
  function getSelectionText() {
    let text = "";
    if (document.getSelection) {
      text = document.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
      text = document.selection.createRange().text;
    }
    return text;
  }

  function debounce (time, callback) {
    let timer
    return () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        clearTimeout(timer)
        callback()
      }, time);
    }
  }
  document.addEventListener('selectionchange', debounce(50, () => {
    const selection = getSelectionText().trim()
    selection && chrome.runtime.sendMessage({action: "USER_SELECTED", selection}, function(response) {
      // console.log(response.farewell);
    });
  }))
  const dialogTemplate = `
  <dialog>
    <span data-close title="关闭">×</span>
    <ul>
      <li>
        <p>
          <span data-origin></span><span title="播放" data-speaker>🔉</span><a data-link target="_blank" rel="noreferer noopener">🌐</a>
        </p>
      </li>
      <li>
        <p>
          <span data-result></span><span title="播放" data-speaker>🔉</span><a data-link target="_blank" rel="noreferer noopener">🌐</a>
        </p>
      </li>
    </ul>
    <audio data-audio preload="auto"></audio>
  </dialog>
  `

  const dialogStyle = `
  dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    padding: 26px 40px;
    min-width: 240px;
    transform: perspective(500px) translate(-50%, -50%);
    background: linear-gradient(to bottom, #FFF, #F4F4F4) #FFF;
    border: none;
    border-radius: 3px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    transform-origin: 50% 50%;
    animation: dialog 300ms cubic-bezier(.3,0,.1,1.4) forwards 1;
    will-change: transform, opacity;
    font-size: 16px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul li {
    margin: 12px 0;
    text-align: left;
  }
  ul li p {
    margin: 0;
  }
  [data-close] {
    cursor: pointer;
    display: inline-block;
    width: 24px;
    height: 24px;
    line-height: 24px;
    font-size: 30px;
    position: absolute;
    right: 20px;
    top: 14px;
    user-select: none;
  }
  [data-origin], [data-result] {
    display: inline-block;
    margin-right: 16px;
  }
  [data-speaker] {
    cursor: pointer;
    user-select: none;
  }
  [data-link] {
    text-decoration: none;
    display: inline-block;
    margin-left: 10px;
    user-select: none;
  }
  [data-origin]:before {
    content: "原文: ";
    display: inline-block;
    margin-right: 12px;
    font-weight: 500;
  }
  [data-result]:before {
    content: "结果: ";
    display: inline-block;
    margin-right: 12px;
    font-weight: 500;
  }
  
  @keyframes dialog {
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
    animation: backdrop 500ms ease forwards 1;
  }
  
  @keyframes backdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }`

  class CustomDialog extends HTMLElement {
    constructor() {
      super();
      const container = document.createElement('div')
      container.innerHTML = dialogTemplate

      const shadowRoot = this.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = dialogStyle;

      shadowRoot.appendChild(style);
      const dialog = container.firstElementChild
      shadowRoot.appendChild(dialog);
      this.onDialogClick = this.onDialogClick.bind(this)
      this.dialog = dialog
    }
    connectedCallback() {
      this.dialog.addEventListener('click', this.onDialogClick)
    }

    disconnectedCallback() {
      this.dialog.removeEventListener('click', this.onDialogClick)
    }
    onDialogClick(evt) {
      const { dataset } = evt.target
      if ('close' in dataset) {
        this.dialog.close();
      } else if ('speaker' in dataset) {
        this.play(dataset.url)
      } else {
        const rect = this.dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= evt.clientY && evt.clientY <= rect.top + rect.height
          && rect.left <= evt.clientX && evt.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          this.dialog.close();
        }
      }
    }
    play(audiourl) {
      const player = this.shadowRoot.querySelector('audio')
      if (!player.onerror) {
        player.onerror = (evt) => {
          window.open(evt.target.src)
        }
      }
      if (player.src !== audiourl) {
        player.src = audiourl
      }
      player.play()
    }
    open(originText, translation, originSpeak, resultSpeak) {
      this.shadowRoot.querySelector('[data-origin]').textContent = originText
      this.shadowRoot.querySelector('[data-result]').textContent = translation.join(', ')
      const [speaker1, speaker2] = [
        ...this.shadowRoot.querySelectorAll('[data-speaker]')
      ]
      speaker1.dataset.url = originSpeak
      speaker2.dataset.url = resultSpeak
      const [link1, link2] = [
        ...this.shadowRoot.querySelectorAll('[data-link]')
      ]
      link1.href = 'https://youdao.com/w/' + encodeURIComponent(originText)
      link2.href = 'https://youdao.com/w/' + encodeURIComponent(translation[0])
      try {
        this.dialog.showModal()
      } catch (err) {}
      setTimeout(() => {
        this.shadowRoot.querySelectorAll('[data-link]').forEach(d => d.blur())
      });
    }
  }

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      // console.log(sender.tab ?
      //             "from a content script:" + sender.tab.url :
      //             "from the extension");
      if (!sender.tab) { // from extension
        if (request.action === 'GET_SELECTED_TEXT') {
          sendResponse({
            selection: getSelectionText()
          })
        } else if (request.action === 'FETCHED_TRANSLATION') {
          customElements.define('custom-dialog', CustomDialog);
          if (!request.payload) {
            alert('翻译失败...')
          } else {
            if (!document.querySelector('custom-dialog')) {
              document.body.appendChild(document.createElement('custom-dialog'))
            }
            const {
              query, translation, speakUrl, tSpeakUrl
            } = request.payload
            document.querySelector('custom-dialog').open(query, translation, speakUrl, tSpeakUrl)
          }
        }
      }
    }
  );

})();
