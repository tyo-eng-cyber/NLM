// options.js — defaultValues は defaults.js を参照

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
