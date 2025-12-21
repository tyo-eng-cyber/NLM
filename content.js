// content.js

if (!window.NLM_CONTENT_SCRIPT_LOADED) {
  window.NLM_CONTENT_SCRIPT_LOADED = true;

  // メッセージリスナー
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendText") {
      // 非同期で実行
      (async () => {
        try {
          const autoExecute = (request.autoExecute !== undefined) ? request.autoExecute : true;
          const result = await executeSend(request.text, autoExecute);
          if (result.success) {
            sendResponse({ status: "success" });
          } else {
            sendResponse({ status: "error", message: result.message });
          }
        } catch (e) {
          console.error("Unexpected error:", e);
          sendResponse({ status: "error", message: e.toString() });
        }
      })();
      return true; // async wait
    }
  });

  // メイン処理
  async function executeSend(textToInput, autoExecute) {
    // 1. 入力欄を探す
    const textareaSelectors = [
      'textarea[aria-label="クエリボックス"]',
      'textarea[aria-label="Prompt input"]',
      'textarea[aria-label="プロンプト入力"]',
      'textarea[aria-label="Chat input"]',
      'textarea[aria-label="チャット入力"]',
      'textarea[placeholder="メッセージを送信..."]',
      'textarea[placeholder="Send a message..."]',
      'textarea[placeholder*="メッセージ"]',
      'textarea[role="textbox"]',
      'div[role="main"] textarea'
    ];

    let textarea = null;
    for (const selector of textareaSelectors) {
      textarea = document.querySelector(selector);
      if (textarea) break;
    }

    if (!textarea) {
      return { success: false, message: "入力欄が見つかりません" };
    }

    // 2. テキスト入力 (防御的プログラミング)
    try {
      // まずは従来の単純な方法
      textarea.focus();
      if (textarea.disabled) textarea.disabled = false;
      textarea.value = textToInput;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Reactの状態更新を確実にするための追加処置 (念のため)
      // エラーが出ても止まらないようにtry-catch個別に囲むか、ここでのエラーは無視して進む
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      if (nativeSetter) {
        nativeSetter.call(textarea, textToInput);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (e) {
      console.error("Input failed partially:", e);
      // 最低限のフォールバック
      textarea.value = textToInput;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // UI反映待ち
    await new Promise(r => setTimeout(r, 200));

    // 3. 送信実行 (autoExecuteがtrueの場合のみ)
    if (!autoExecute) {
      return { success: true, message: "テキストを入力しました（自動送信はOFFです）" };
    }

    // A. 送信ボタンを探してクリック
    const buttonSelectors = [
      'button[aria-label="Send message"]',
      'button[aria-label="メッセージを送信"]',
      'button[aria-label="送信"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="送信"]',
      'button:has(svg)', // アイコンボタン
      'button:has(mat-icon)'
    ];

    let submitButton = null;
    // 親要素等から探索
    const form = textarea.closest('form') || textarea.closest('div[role="main"]') || document.body;

    // フォーム内、または近くのボタンを優先探索
    for (const sel of buttonSelectors) {
      const btn = form.querySelector(sel);
      if (btn && !btn.disabled && btn.offsetParent !== null) {
        submitButton = btn;
        break;
      }
    }

    if (submitButton) {
      submitButton.click();
      return { success: true, message: "ボタンをクリックしました" };
    }

    // B. ボタンが見つからない/押せない場合は Enter キー送信
    console.log("Submit button not found or disabled. Trying Enter key.");
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterEvent);

    // キーアップも送信
    textarea.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    }));

    return { success: true, message: "Enterキー送信を実行しました" };
  }
}