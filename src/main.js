var get = id => { return document.getElementById(id); };

/* TODO: refactor: rename fileId and textId */
var UI = {
  state: 'main',
  viewId: 'main_view',
  widget: null,
  searches: {
    current: null,
    list: []
  },
  files: {
    current: null,
    list: []
  },
  graphs: {
    current: null,
    list: []
  }
}

const states = [
  'files',
  'searches',
  'graphs',
  'manual',
];

function initNav() {
  const views = {};
  const back = get('back');
  const main = get('main_view');
  states.forEach(state => {
    views[state] = get(`${state}_view`);
    views[state].style.display = 'none';
  });
  views['main'] = main;

  main.style.display = null;
  back.style.background = 'none';

  back.addEventListener('click', () => {
    get(`${UI.state}_view`).style.display = 'none';
    back.style.background = 'none';
    main.style.display = null;
    UI.state = 'main';
  });
  states.forEach(id => {
    get(id).addEventListener('click', ev => {
      back.style.background = null;
      views[UI.state].style.display = 'none';
      UI.state = ev.target.id;
      views[UI.state].style.display = null;
      //if (UI[UI.state].current) UI[UI.state].current.display();
    });
    get(`${id}_settings`).style.visibility = 'hidden';
  });
}

function initFiles() {
  get('file-upload').addEventListener('change', ev => {
    let text;
    for (let i = 0; i < ev.target.files.length; i++) {
      text = new Text(ev.target.files[i]);
    }
    /* to trigger on change when selecting the same file again: */
    ev.target.value = null;
    if (text) {
      UI.files.current = text;
      UI.files.current.display();
    }
  });
  get('file_save').addEventListener('click', ev => {
    const name = get('file_name').value;
    const encoding = get('file_encoding').value;
		const cb1 = get('chapter_settings1').checked;
		const cb2 = get('chapter_settings2').checked;
		const cb3 = get('chapter_settings3').checked;
		const cb4 = get('chapter_settings4').checked;
    let method, input1, input2;
    if (cb4) {
      method = CHAPTER.MANUAL;
      input1 = get('chapter_settings5').value;
    } else if (cb3) {
      method = CHAPTER.REGEXP;
      input1 = get('chapter_pattern').value;
      input2 = get('chapter_flags').value;
    } else if (cb2) {
      method = CHAPTER.XML;
    } else method = CHAPTER.NONE;
    UI.files.current.save(name, encoding, method, input1, input2);
  })
  get('file_remove').addEventListener('click', () => {
    UI.files.current.listEntry.delete();
    UI.files.current.filesList.remove();
    UI.files.list[UI.files.current.id] = null;
    UI.files.current = null;
    get('files_settings').style.visibility = 'hidden';
  });
  get('file_reset').addEventListener('click', () => {
    UI.files.current.display();
  });
}

function initSearches() {
  get('new_search').addEventListener('click', () => {
    UI.searches.current = new Search();
    UI.searches.current.display();
  });
  get('search_save').addEventListener('click', ev => {
    const name = get('search_name').value;
    const color = get('search_color').value;
    const cb1 = get('search_settings1').checked;
    const cb2 = get('search_settings2').checked;
    let method, input1, input2;
    if (cb1) {
      method = METHOD.TEXT;
      input1 = get('search_text').value;
    } else if (cb2) {
      method = METHOD.REGEXP;
      input1 = get('search_pattern').value;
      input2 = get('search_flags').value;
    }
    UI.searches.current.save(name, color, method, input1, input2);
  });
  get('search_duplicate').addEventListener('click', () => {
    const dup = new Search();
    UI.searches.current.duplicate(dup);
    UI.searches.current = dup;
    UI.searches.current.display();
  });
  get('search_reset').addEventListener('click', () => {
    UI.searches.current.display();
  });
  get('search_remove').addEventListener('click', () => {
    UI.searches.current.listEntry.delete();
    UI.searches.list[UI.searches.current.id] = null;
    UI.searches.current = null;
    get('searches_settings').style.visibility = 'hidden';
  });
}

function initGraphs() {
  get('new_graph').addEventListener('click', () => {
    UI.graphs.current = new Graph();
    UI.graphs.current.display();
  });
  get('graph_text').addEventListener('change', ev => {
    const inp = ev.target.value.match(/^\d+/);
    if (!inp) return;
    const option = inp[0];
    const selectedText = UI.files.list[option];
    if (selectedText) {
      const chapterSelect = get('chapters_drop');
      chapterSelect.innerHTML = '';
      selectedText.chapterOptions.forEach(option => {
        chapterSelect.appendChild(option);
      });
    }
  });
  get('graph_save').addEventListener('click', ev => {
    const name = get('graph_name').value;
    const textInp = get('graph_text').value.match(/^\d+/);
    let textId, chapterId;
    if (textInp) {
      textId = textInp[0];
    }
    const chapterInp = get('graph_chapter').value.match(/^\d+/);
    if (chapterInp) {
      chapterId = chapterInp[0];
    }
    const searches = [];
    for (let i = 0; i < UI.searches.list.length; i++) {
      const search = get(`graph_searches_${i}`);
      if (search.checked) searches.push(i);
    }
    UI.graphs.current.save(name, textId, chapterId, searches);
  });
  get('graph_reset').addEventListener('click', ev => {
    UI.graphs.current.display();
  });
  get('graph_remove').addEventListener('click', ev => {
    UI.graphs.current.listEntry.delete();
    UI.graphs.current.widget.graph.remove();
    UI.graphs.current.widget.worker.terminate();
    if (UI.graphs.current.widget.sheet) UI.graphs.current.widget.sheet.remove();
    UI.graphs.current.searches.forEach(search => {
      search.unblock();
    })
    UI.graphs.current = null;
    get('graphs_settings').style.visibility = 'hidden';
  });
  get('graph_show').addEventListener('click', ev => {
    const arr = document.getElementsByClassName('graph');
    for (let i = 0; i < arr.length; i++) {
      arr[i].style.visibility = null;
    }
  });
}

function init() {
  initNav();
  initFiles();
  initSearches();
  initGraphs();
  console.log('svConc was initiated by Moritz Buhl');
}

document.addEventListener('DOMContentLoaded', init, false);
