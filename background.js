// background.js

importScripts('defaults.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log("NotebookLM クイック送信 拡張機能（ポップアップ版）がインストールされました。");
});

chrome.commands.onCommand.addListener((command) => {
  const m = /^prompt-button-(\d)$/.exec(command);
  if (!m) return;
  const index = parseInt(m[1], 10);
  if (index < 1 || index > 4) return;

  chrome.storage.sync.get(defaultValues, (items) => {
    const prompts = items.prompts || {};
    const autoExecutes = items.autoExecutes || defaultValues.autoExecutes || {};
    const text = prompts['prompt' + index];
    if (!text) {
      console.warn('NotebookLM クイック入力: ボタン' + index + 'のプロンプトが空です。');
      return;
    }
    const autoExecute = autoExecutes['autoExecute' + index] !== undefined
      ? autoExecutes['autoExecute' + index]
      : true;

    chrome.tabs.query({ active: true, url: 'https://notebooklm.google.com/*' }, (tabs) => {
      if (!tabs.length) {
        console.warn('NotebookLM クイック入力: アクティブな NotebookLM タブがありません。');
        return;
      }
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        chrome.tabs.sendMessage(tabId, {
          action: 'sendText',
          text,
          autoExecute
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }
          if (response && response.status !== 'success') {
            console.warn('NotebookLM クイック入力:', response.message || '送信に失敗しました');
          }
        });
      });
    });
  });
});
