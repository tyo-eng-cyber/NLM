// popup.js

// デフォルト値（options.jsと同一）
const defaultValues = {
  buttonCount: 3,
  titles: {
    title1: '文字起こしから議事録作成',
    title2: '論文の要約',
    title3: 'テーマ・重要ポイントの特定'
  },
  prompts: {
    prompt1: `この文字起こしデータを分析し、以下の形式で議事録を作成してください。
・議論された主要トピック: (箇条書き)
・各トピックの議論の要点:
・決定事項:
・ネクストアクション (ToDo): (担当者と期限がわかる場合はそれも明記)
・保留となった事項や懸念点:`,
    prompt2: `この論文の研究目的、主な結果、そして結論（考察）を簡潔に要約してください。
著者が使用した研究手法（実験方法やデータ分析方法）について説明してください。
この研究が、既存の関連研究と比べて新しい点（新規性や貢献）は何ですか？`,
    prompt3: `これらの資料全体で共通して述べられている主要なテーマやトピックを3つ挙げてください。
すべての資料の中で、最も重要なポイントや結論は何ですか？ 箇条書きで示してください。`
  }
};

// 送信処理を行う関数
function sendTextToNotebookLM(text) {
  // 1. 現在アクティブで、NotebookLMのタブを検索
  chrome.tabs.query({ active: true, url: "https://notebooklm.google.com/*" }, (tabs) => {
    if (tabs.length === 0) {
      alert("NotebookLM のタブ（ https://notebooklm.google.com/ ）を開いてからクリックしてください。");
      window.close(); // ポップアップを閉じる
      return;
    }

    const targetTab = tabs[0];

    // 2. content.js を実行（まだ読み込まれていない場合に備える）
    chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      files: ["content.js"]
    }, () => {
      // 3. content.js の実行後、メッセージを送信
      chrome.tabs.sendMessage(targetTab.id, {
        action: "sendText",
        text: text
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          alert("ページの読み込みが完了していないか、通信に失敗しました。ページを再読み込みしてお試しください。");
        } else if (response && response.status === "success") {
          console.log("テキスト送信成功");
        } else {
          // content.js 側でエラーが起きた場合 (textareaが見つからない等)
          alert(response.message || "テキストの送信に失敗しました。");
        }
        window.close(); // ポップアップを閉じる
      });
    });
  });
}

// ボタンを動的に生成して設定する関数
function setupButtons() {
  chrome.storage.sync.get(defaultValues, (items) => {
    const buttonContainer = document.getElementById('button-container');
    const buttonCount = items.buttonCount;
    const titles = items.titles;
    const prompts = items.prompts;

    for (let i = 1; i <= buttonCount; i++) {
      const title = titles['title' + i];
      const prompt = prompts['prompt' + i];

      if (title && prompt) {
        const button = document.createElement('button');
        button.id = 'btn-text' + i;
        button.textContent = title;
        button.addEventListener('click', () => sendTextToNotebookLM(prompt));
        buttonContainer.appendChild(button);
      }
    }
  });
}

// オプションページへのボタンを設置する関数
function setupOptionsButton() {
  const container = document.getElementById('options-container');
  const optionsButton = document.createElement('button');
  optionsButton.textContent = 'プロンプト設定';
  optionsButton.className = 'options-button'; // スタイルを適用
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  container.appendChild(optionsButton);
}


// ページ読み込み時にボタンを設定
document.addEventListener('DOMContentLoaded', () => {
  setupButtons();
  setupOptionsButton();
});
