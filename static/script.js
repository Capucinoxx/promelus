const pipe = (...fns) => (input) => fns.reduce((acc, fn) => fn(acc), input);

const COMMENT_REGEX = /(\/\/.*)/g;
const KEYWORDS_REGEX = /\b(proctype|chan|if|fi|do|od|else|skip|break|goto|int|bool|true|false|assert|run|atomic|inline|nondet|priority|timeout|d_step|->|::|;\s*|\{|})\b/g;
const STRING_REGEX = /("[^"]*")/g;
const NUMBER_REGEX = /\b(\d+)\b/g;
const LTL_REGEX = /ltl\s+(\w+)\s*{([^}]*)}/g;

const COMMENT_REPLACEMENT = '<em>$1</em>';
const KEYWORDS_REPLACEMENT = '<strong>$1</strong>';
const STRING_REPLACEMENT = '<em>$1</em>';
const NUMBER_REPLACEMENT = '<em>$1</em>';


const highlight_comments = (text) => text.replace(COMMENT_REGEX, COMMENT_REPLACEMENT);
const highlight_keywords = (text) => text.replace(KEYWORDS_REGEX, KEYWORDS_REPLACEMENT);
const highlight_strings  = (text) => text.replace(STRING_REGEX, STRING_REPLACEMENT);
const highlight_numbers  = (text) => text.replace(NUMBER_REGEX, NUMBER_REPLACEMENT);


const highlight_promela = (el) => {
  const fn = pipe(highlight_comments, highlight_keywords, highlight_strings, highlight_numbers);

  const fragment = document.createDocumentFragment();

  Array.from(el.childNodes)
    .filter((node) => node.nodeType !== Node.TEXT_NODE)
    .forEach((node) => {
      node.innerText.split('\n').forEach((line) => {
        const div = document.createElement('div');
        div.innerHTML = fn(line);
        fragment.appendChild(div);
      });
    });
  
    el.innerHTML = '';
    el.append(fragment);
};


const caret = {
  get: (el) => {
    const range = window.getSelection().getRangeAt(0);
    const prefix = range.cloneRange();
    prefix.selectNodeContents(el);
    prefix.setEnd(range.endContainer, range.endOffset);
    return prefix.toString().length;
  },
  set: (pos, parent) => {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.length >= pos) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(node, pos);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return -1;
        }
        pos -= node.length;
      } else if ((pos = caret.set(pos, node)) < 0) return pos;
    }
    return pos;
  }
};


const setup_editor = (el, highlight = highlight_promela, tab = '  ') => {
  highlight(el);

  // const handle_paste = (e) => {
  //   e.preventDefault();
  //   const text = (e.clipboardData || window.clipboardData).getData('text').trim();
  //   if (!text) return;
  
  //   const selection = window.getSelection();
  //   const range = selection.getRangeAt(0);
  
  //   // Si on veut insérer à la position actuelle, on va d'abord supprimer le contenu sélectionné
  //   range.deleteContents();
  
  //   // Sépare le texte par lignes
  //   const lines = text.split('\n').filter(line => line.trim() !== '');
  
  //   // Crée un fragment de document pour une insertion efficace
  //   const fragment = document.createDocumentFragment();
  
  //   lines.forEach(line => {
  //     const div = document.createElement('div');
  //     div.textContent = line;
  //     fragment.appendChild(div);
  //   });
  
  //   range.insertNode(fragment);

  //   if (fragment.lastChild) {
  //     range.setStartAfter(fragment.lastChild);
  //   } else {
  //     range.setStart(range.startContainer, range.startOffset);
  //   }

  //   range.collapse(true);
  //   selection.removeAllRanges();
  //   selection.addRange(range);
  
  //   highlight(el);
  // };
  
  
  

  const handle_keydown = (e) => {
    if (e.key === 'Tab') {
      const pos = caret.get(el) + tab.length;
      const range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(tab));
      highlight(el);
      caret.set(pos, el);
      e.preventDefault();
    }
  };

  const handle_keyup = (e) => {
    if (e.key.length === 1 || e.key === ' ') {
      const pos = caret.get(el);
      highlight(el);
      caret.set(pos, el);
    }
  };

  el.addEventListener('keydown', handle_keydown);
  el.addEventListener('keyup', handle_keyup);
};


const editor = document.querySelector('.editor');
setup_editor(editor);
