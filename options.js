// options.js

// デフォルト値
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
  },
  autoExecutes: {
    autoExecute1: true,
    autoExecute2: true,
    autoExecute3: true
  }
};

// 設定を保存する関数
function saveOptions() {
  const buttonCount = parseInt(document.getElementById('buttonCount').value, 10);
  const titles = {};
  const prompts = {};
  const autoExecutes = {};

  for (let i = 1; i <= buttonCount; i++) {
    titles['title' + i] = document.getElementById('title' + i).value;
    prompts['prompt' + i] = document.getElementById('prompt' + i).value;
    autoExecutes['autoExecute' + i] = document.getElementById('autoExecute' + i).checked;
  }

  chrome.storage.sync.set(
    {
      buttonCount: buttonCount,
      titles: titles,
      prompts: prompts,
      autoExecutes: autoExecutes
    },
    () => {
      // 保存成功のメッセージを表示
      const status = document.getElementById('status');
      status.textContent = '設定を保存しました。';
      setTimeout(() => {
        status.textContent = '';
      }, 1500);
    }
  );
}

// 保存された設定を読み込んで表示する関数
function restoreOptions() {
  chrome.storage.sync.get(defaultValues, (items) => {
    const buttonCount = items.buttonCount;
    document.getElementById('buttonCount').value = buttonCount;
    generatePromptFields(buttonCount, items.titles, items.prompts, items.autoExecutes);
  });
}

// ボタンの数に応じてプロンプト設定の入力欄を生成する関数
function generatePromptFields(count, titles, prompts, autoExecutes) {
  const container = document.getElementById('promptsContainer');
  container.innerHTML = ''; // コンテナをクリア

  for (let i = 1; i <= count; i++) {
    const group = document.createElement('div');
    group.className = 'prompt-group';

    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'title' + i;
    titleLabel.textContent = `ボタン${i}: タイトル`;

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'title' + i;
    titleInput.value = (titles && titles['title' + i]) ? titles['title' + i] : '';

    const promptLabel = document.createElement('label');
    promptLabel.htmlFor = 'prompt' + i;
    promptLabel.textContent = `ボタン${i}: プロンプト`;

    const promptTextarea = document.createElement('textarea');
    promptTextarea.id = 'prompt' + i;
    promptTextarea.value = (prompts && prompts['prompt' + i]) ? prompts['prompt' + i] : '';

    group.appendChild(titleLabel);
    group.appendChild(titleInput);
    group.appendChild(promptLabel);
    group.appendChild(promptTextarea);

    const autoExecuteLabel = document.createElement('label');
    autoExecuteLabel.style.display = 'flex';
    autoExecuteLabel.style.alignItems = 'center';
    autoExecuteLabel.style.marginTop = '5px';

    const autoExecuteInput = document.createElement('input');
    autoExecuteInput.type = 'checkbox';
    autoExecuteInput.id = 'autoExecute' + i;
    // デフォルトはtrue (undefinedの場合もtrue扱いにするかは要検討だが、初期値defaultValuesでカバー)
    if (autoExecutes && autoExecutes['autoExecute' + i] !== undefined) {
      autoExecuteInput.checked = autoExecutes['autoExecute' + i];
    } else {
      autoExecuteInput.checked = true; // 新規追加時はデフォルトON
    }

    const autoExecuteText = document.createTextNode(' 自動送信する（チェックを外すと入力のみ行います）');

    autoExecuteLabel.appendChild(autoExecuteInput);
    autoExecuteLabel.appendChild(autoExecuteText);
    group.appendChild(autoExecuteLabel);

    container.appendChild(group);
  }
}

// ページ読み込み時に設定を復元
document.addEventListener('DOMContentLoaded', restoreOptions);

// 保存ボタンのクリックイベントを設定
document.getElementById('save').addEventListener('click', saveOptions);

// ボタン数変更時にフィールドを再生成
document.getElementById('buttonCount').addEventListener('change', (event) => {
  const count = parseInt(event.target.value, 10);
  // 現在の入力値を保持しつつ、フィールドを再生成
  chrome.storage.sync.get(defaultValues, (items) => {
    const currentTitles = {};
    const currentPrompts = {};
    const currentAutoExecutes = {};
    const existingFields = document.querySelectorAll('.prompt-group input, .prompt-group textarea');
    existingFields.forEach(field => {
      if (field.id.startsWith('title')) {
        currentTitles[field.id] = field.value;
      } else if (field.id.startsWith('prompt')) {
        currentPrompts[field.id] = field.value;
      } else if (field.id.startsWith('autoExecute')) {
        currentAutoExecutes[field.id] = field.checked;
      }
    });

    // 保存されている値と現在の入力値をマージ
    const titles = { ...items.titles, ...currentTitles };
    const prompts = { ...items.prompts, ...currentPrompts };
    const autoExecutes = { ...items.autoExecutes, ...currentAutoExecutes };

    generatePromptFields(count, titles, prompts, autoExecutes);
  });
});
