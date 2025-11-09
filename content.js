// content.js

// メッセージリスナーを設定
// popup.js から { action: "sendText", text: "..." } というメッセージを受け取る
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendText") {
    const textToInput = request.text;
    
    // --- 以前の処理（テキスト入力と送信）を関数化 ---
    const result = executeSend(textToInput);
    
    if (result.success) {
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "error", message: result.message });
    }
  }
  // true を返すことで、sendResponse を非同期で待機させる
  return true;
});


// テキスト入力と送信を実行するメインの関数
function executeSend(textToInput) {
  
  // --- 入力欄セレクタ (以前のまま) ---
  const textareaSelectors = [
    'textarea[aria-label="クエリボックス"]',
    'textarea[aria-label="Prompt input"]',
    'textarea[aria-label="プロンプト入力"]',
    'textarea[aria-label="Chat input"]',
    'textarea[aria-label="チャット入力"]',
    'textarea[placeholder="メッセージを送信..."]',
    'textarea[placeholder="Send a message..."]',
    'textarea[placeholder*="メッセージ"]',
    'textarea[role="textbox"]'
  ];

  let textarea = null;
  for (const selector of textareaSelectors) {
    textarea = document.querySelector(selector);
    if (textarea) break;
  }

  if (!textarea) {
    console.error("NotebookLMの入力欄が見つかりません。");
    return { success: false, message: "NotebookLMの入力欄（textarea）が見つかりませんでした。" };
  }
  
  // --- 送信ボタンセレクタ (以前のまま) ---
  const buttonSelectors = [
    'button[aria-label="Send message"]',
    'button[aria-label="メッセージを送信"]',
    'button[aria-label="送信"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="送信"]'
  ];
  
  let submitButton = null;
  for (const selector of buttonSelectors) {
    const button = document.querySelector(selector);
    if (button && button.tagName === 'BUTTON') {
        submitButton = button;
        break;
    }
  }

  if (!submitButton) {
    // 隣接するボタンを探す
    let sibling = textarea.nextElementSibling;
    if (sibling && sibling.tagName === 'BUTTON') {
      submitButton = sibling;
    } else if (textarea.parentElement && textarea.parentElement.nextElementSibling && textarea.parentElement.nextElementSibling.tagName === 'BUTTON') {
      submitButton = textarea.parentElement.nextElementSibling;
    } else if (textarea.closest('div')?.nextElementSibling?.tagName === 'BUTTON') {
        submitButton = textarea.closest('div').nextElementSibling;
    }
  }

  if (!submitButton) {
    console.error("NotebookLMの送信ボタンが見つかりません。");
    return { success: false, message: "NotebookLMの送信ボタンが見つかりませんでした。" };
  }

  // 1. テキスト入力
  if (textarea.disabled) {
    textarea.disabled = false;
  }
  textarea.value = textToInput;

  // 2. 入力イベント発火
  const inputEvent = new Event('input', { bubbles: true, cancelable: true });
  textarea.dispatchEvent(inputEvent);

  // 3. 送信ボタンクリック
  setTimeout(() => {
    if (!submitButton.disabled) {
      submitButton.click();
    } else {
      // ボタンがまだ無効な場合、再度イベントを発火させて試みる
      textarea.dispatchEvent(inputEvent);
      setTimeout(() => {
        if (!submitButton.disabled) {
          submitButton.click();
        } else {
          console.error("送信ボタンが押せない状態です。");
        }
      }, 100);
    }
  }, 100);

  return { success: true };
}