// background.js

// 以前の chrome.action.onClicked.addListener は削除します。
// ポップアップが指定されたため、アイコンクリックで popup.html が開きます。

chrome.runtime.onInstalled.addListener(() => {
  console.log("NotebookLM クイック送信 拡張機能（ポップアップ版）がインストールされました。");
});