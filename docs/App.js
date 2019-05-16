'use strict';
class Graph {
	constructor() {
    this.id = UI.graphs.list.length;
		this.nameValue = 'Neuer Graph';
    this.textId;
    this.chapterId;
    this.searches = [];
		this.listEntry = new ListEntry(this);
    UI.graphs.list.push(this);

		this.widget = new GraphWidget(this.id);
		this.widget.updateTitle(this.name);
	}

  set name(name) {
    this.nameValue = name;
    this.listEntry.adjust(name);
  }

  get name() {
    return this.nameValue;
  }

	display() {
    get('graph_name').value = this.name;
		get('graphs_settings').style.visibility = null;
    if (this.textId && UI.files.list[this.textId]) {
      get('graph_text').value = UI.files.list[this.textId].name;
      if (this.chapterId &&
        UI.files.list[this.textId].chapters[this.chapterId]) {
          get('graph_chapter').value =
            UI.files.list[this.textId].chapters[this.chapterId].chapterName;
      } else {
        get('graph_chapter').value = '';
      }
    } else {
      get('graph_text').value = '';
      get('graph_chapter').value = '';
    }
    for (let i = 0; i < UI.searches.list.length; i++) {
      get(`graph_searches_${i}`).checked = false;
    }
    this.searches.forEach(i => {
      get(`graph_searches_${i}`).checked = true;
    });
	}

  save(name, textId, chapterId, searches) {
    let recalculate = false;
    this.name = name;

    if ((textId !== undefined && chapterId !== undefined) &&
        (this.textId != textId || this.chapterId != chapterId))
        recalculate = true;

    this.textId = textId;
    this.chapterId = chapterId || 0;

    this.searches.forEach((s) => {
      UI.searches.list[s].unblock();
    });
    searches.forEach((s) => {
      UI.searches.list[s].block();
    });

    if (this.searches.length != searches.length) {
      recalculate = true;
      this.searches = searches;
    } else this.searches.forEach((search,i) => {
      if (search != searches[i]) {
        recalculate = true;
        this.searches = searches;
      }
    });
    let textName, chapterName = '';
    const text = UI.files.list[textId];
    if (textId !== undefined && text) {
      textName = text.name;
      if (chapterId !== undefined && text.chapters[chapterId])
        chapterName += ` - ${text.chapters[chapterId].chapterName}`;
    }

    if (recalculate) {
      this.widget.reset();
      this.widget.updateHeader(name, textName + chapterName, searches);
      new TextWorker(this.widget, text.chapters[chapterId].text,
        searches.reduce((res, i) => {
          const search = UI.searches.list[i];
          res.push({pattern: search.pattern, flags: search.flags});
          return res;
        }, [])
      );
    }
  }

  updateText(id) { // xxx optimize by giving each text it's graphs
    if (this.textId != id) return;
    this.widget.updateTextName(UI.files.list[id].name);
  }

  updateSearch(id) {// xxx optimize by giving each search it's graphs
    this.searches.forEach(search => {
      if (search == id) this.widget.updateSearches(this.searches);
    });
  }
}
class ListEntry {
		constructor(owner) {
			const ownerName = UI.state;
			const entry = document.createElement('li');
			entry.title = owner.name;
			const name = document.createTextNode(owner.name);
			entry.appendChild(name);
			entry.addEventListener('click', () => {
					UI[ownerName].current = owner;
					owner.display();
			});
			get(`${ownerName}_list`).appendChild(entry);
			this.entry = entry;
		}

		adjust(name) {
			const nameNode = document.createTextNode(name);
			this.entry.innerHTML = null;
			this.entry.appendChild(nameNode);
		}

		delete() {
			this.entry.remove();
		}
}
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


const METHOD = {
	TEXT: 0,
	REGEXP: 1
};

class Search {
	constructor() {
		this.id = UI.searches.list.length;
		this.lblText = document.createTextNode('');
		this.nameValue = 'Neue Suche';
		this.color = '#dd3044';
		this.pattern = '';
		this.flags = '';
		this.texts = {};
		UI.searches.list.push(this);
		this.listEntry = new ListEntry(this);
		this.name = this.nameValue;

		const inp = document.createElement('input')
		inp.id = `graph_searches_${this.id}`;
		inp.type= 'checkbox';
		const lbl = document.createElement('label')
		lbl.appendChild(inp);
		lbl.appendChild(this.lblText);
		get('graph_searches').appendChild(lbl);
		this.blocked = 0;
	}

	set name(name) {
		this.nameValue = name;
		this.lblText.nodeValue = name;
		this.listEntry.adjust(name);
	}

	get name() {
		return this.nameValue;
	}

	block() {
		this.blocked++;
		this.listEntry.entry.style.opacity = 0.5;
	}
	unblock() {
		this.blocked--;
		if (!this.blocked) this.listEntry.entry.style.opacity = null;
	}

	duplicate(search) {
		search.name = `${this.name} (Kopie)`;
		search.color = this.color;
		search.searchText = this.searchText;
		search.pattern = this.pattern;
		search.flags = this.flags;
	}

	display() {
		get('searches_settings').style.visibility = null;
		const name = get('search_name');
		name.value = this.name;
		const color = get('search_color');
		color.value = this.color;
		const cb1 = get('search_settings1');
		const cb2 = get('search_settings2');
		if (this.searchText) {
			cb1.checked = true;
			cb2.checked = false;
			get('search_text').value = this.searchText;
		} else {
			cb1.checked = false;
			cb2.checked = true;
			get('search_pattern').value = this.pattern;
			get('search_flags').value = this.flags;
		}
	}

	save(name, color, method, input1, input2) {
		if (this.blocked) return;
		this.name = name;
		this.color = color;
		if (method == METHOD.TEXT) {
			this.searchText = input1;
			input1 = input1.replace(
				/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
			input2 = '';
		} else this.searchText = '';
		if (input1 != this.pattern || input2 != this.flags) {
			this.pattern = input1;
			this.flags = input2;
			this.restartCalculation(); // xxx
		}

		UI.graphs.list.forEach(graph => {
			if (graph) graph.updateSearch(this.id);
		});
	}

	remove() { // xxx merge with other uis
		document.getElementById('searches_settings').style.display = 'none';
		this.list.removeEntry(this.id);
		Object.values(this.texts).forEach(text => {
			delete text.searches[this.id];
			text.workers[this.id].terminate();
			delete text.workers[this.id];
		});
	}
	restartCalculation() {
		Object.values(this.texts).forEach(text => {
			text.redoSearch(this);
		});
	}
}










const CHAPTER = {
	NONE: 0,
	XML: 1,
	REGEXP: 2,
	MANUAL: 3
};


// XXX format according to matches/markers
// XXX display calculating

class Text { // xxx remove unused code
	




	constructor(file) {
		this.file = file;
		this.id = UI.files.list.length;
		this.name = file.name;
		this.encoding = 'utf-8';
		this.chapters = [ this ];

		this.searches = {};
		this.workers = {};
		this.readText(() => {});
		this.calculating = [];
		this.busy = 0;

		this.method = CHAPTER.NONE;
		this.chapterMarks = '';
		this.chapterRegexp = '';
		this.chapterFlags = '';
		this.chapterName = '0: Gesamter Text';

		const option = document.createElement('option');
		option.value = this.chapterName;
		this.chapterOptions = [option];

		this.listEntry = new ListEntry(this);

		this.filesList = document.createElement('option');
		this.filesList.value = this.textName;
		get('files_drop').appendChild(this.filesList);

		UI.files.list.push(this);
	}

	get textName() {
		return `${this.id}: ${this.name}`
	}

	display() {
		get('files_settings').style.visibility = null;
		get('file_encoding').value = this.encoding;
		get('file_name').value = this.name;
		get('search_color').value = this.color;
		const cbs = [get('chapter_settings1'), get('chapter_settings2'),
			get('chapter_settings3'), get('chapter_settings4')];
		cbs.forEach((check, _ , i) => {
			check.checked = false;
		});
		cbs[this.method].checked = true;
		switch(this.method) {
		case CHAPTER.REGEXP:
      get('chapter_pattern').value = this.chapterRegexp;
      get('chapter_flags').value = this.chapterFlags;
			break;
		case CHAPTER.MANUAL:
      get('chapter_settings5').value = this.chapterMarks;
		default:
		}
	}

	getCalculating() {
		return this.calculating.reduce((undone, i) => {
			return undone + i;
		});
	}

	readText(cb, ...args) {
		this.busy++;
		const reader = new FileReader();
		const that = this;
		reader.addEventListener('load', () => {
			that.busy--;
			that.text = reader.result;
			cb(...args);
		});
		reader.readAsText(this.file, this.encoding);
	}

	remove() {
		document.getElementById('files_settings').style.display = 'none';
		this.list.removeEntry(this.id);
		this.chapters.forEach(chapter => { chapter.remove(); });
		this.removeSearches(this.searches);
	}

	save(name, encoding, method, in1, in2) {
		this.name = name;
		this.filesList.value = `${this.id}: ${this.name}`;
		this.method = method;
		if (this.encoding != encoding) {
			this.encoding = encoding;
			this.readText((that, in1, in2) => { that.doChapters(in1, in2) },
				this, in1, in2);
		} else {
			this.doChapters(in1, in2);
		}
		this.listEntry.adjust(this.name); // xxx create setter getter for this.name
		UI.graphs.list.forEach(graph => {
			if (graph) graph.updateText(this.id);
		});
	}

	doChapters(in1, in2) {
		switch(this.method) {
		case CHAPTER.XML: // xxx XML
			break;
		case CHAPTER.REGEXP:
			this.chapterRegexp = in1;
			this.chapterFlags = in2;
			this.splitTextByRE(new RegExp(in1, in2));
			break;
		case CHAPTER.MANUAL:
			this.chapterMarks = in1;
			const chapters = [];
			const re = new RegExp(/(\d+)\s+\-(\d+)\s+(.*)$/);
			in1.split('\n').forEach(line => {
				const m = re.exec(line);
				chapters.push({ begin: m[1], end: m[2], id: (chapters.length + 1) });
			});
			this.splitTextByChapters(chapters);
			break;
		default:
			break;
		}
	}

	




	splitTextByRE(re) {
		const regularExp = new RegExp(re.source, `g${re.flags}`);
		const chapters = [];
		let lIndex, m;
		while (m = regularExp.exec(this.text)) {
			if (lIndex) chapters.push({ begin: lIndex,
				end: m.index, name: m[0] });
			lIndex = regularExp.lastIndex;
		}
		chapters.push({ begin: lIndex, end: this.text.length,
			name: m[0] });
		this.splitTextByChapters(chapters);
	}

	





	splitTextByChapters(chapters) {
		this.chapters.forEach(chapter => {
			chapter.remove();
		});
		chapters.forEach(c => {
			this.chapters.push(new Chapter(c.name,
				this.text.substring(c.begin, c.end)));
		});
	}

	


	addSearches(searches) {
		searches.forEach(search => {
			search.texts[this.id] = this;
			this.searches[search.id] = search;
			this.workers[search.id] = new TextWorker(this);
			this.workers[search.id].postSearch(search);
		});
	}

	removeSearches(searches) {
		searcsearcheshes.forEach(search => {
			delete search.texts[this.id];
			delete this.searches[search.id];
			this.workers[search.id].terminate();
			delete this.workers[search.id];
		});
	}

	redoSearch(search) {
		this.workers[search.id].postSearch(search);
	}

	replaceSearches(searches) {
		const newSearches = [];
		const keepSearch = {};
		searches.forEach(search => {
			if (!this.searches[search.id])
				newSearches.push(search);
			else keepSearch[search.id] = true;
		});
		this.removeSearches(this.searches.reduce((remove, search) => {
			if (!keepSearch[search]) remove.push(search);
			return remove;
		}, []));
		this.addSearches(newSearches);
	}
}

class Chapter extends Text {
	constructor(name, text) {
		this.name = name;
		this.id = text.chapters.length; // xxx
		this.text = text;
		this.searches = {};
		this.workers = {};
		this.calculating = [];
		this.chapters = [];
	}
}
class TextWorker {
	constructor(receiver, text, searches) {
		const worker = new Worker('TextWorker.js');
		worker.onmessage = e => {
			if (e.data) receiver.push(e.data[0], e.data[1].start, e.data[1].end);
			else {
				receiver.done();
			}
		};
		window.setTimeout(data => {
			worker.postMessage(data);
		}, 2000, { text, searches });
		receiver.worker = worker;
	}
}




const translations = {
	move: 'Bewegen',
	download: 'Herunterladen',
	bigger: 'Vergrößern',
	smaller: 'Verkleinern',
	hide: 'Ausblenden'
};

class GraphWidget {
	constructor(id) {
		this.graphId = id;
		this.graph = document.createElement('div');
		this.graph.classList.add('graph');
		this.createNav();
		this.createTitle();
		this.createTextGraph();
		get('graphs_canvas').appendChild(this.graph);
		this.active = [];
		this.textIndex = 0;
		this.currentNode = null;
		this.unmatchedLength = 0;
		this.matches = 0;

		this.pre.style.fontSize = `3px`;
		this.pre.style.lineHeight = `3px`;
	}

	reset() {
		this.pre.innerHTML = '';
		this.active = [];
		this.textIndex = 0;
		this.currentNode = null;
		this.unmatchedLength = 0;
		this.matches = 0;
		if (this.worker) this.worker.terminate();
	}

	addDraggable(elem) {
		elem.dataset.graphId = this.graphId;
		elem.addEventListener('mousedown', ev => {
			UI.widget = UI.graphs.list[ev.target.dataset.graphId].widget;
			ev.preventDefault();
			UI.widget.oldPosX = ev.clientX;
	    UI.widget.oldPosY = ev.clientY;
			document.onmouseup = UI.widget.stopMove;
			document.onmousemove = UI.widget.dragGraph;
		});
	}

	createCurrentNode() {
		this.currentNode = document.createElement('span');
		this.active.forEach(a => {
			this.currentNode.classList.add(`search_${a.id}`);
		});
	}

	push(id, start, end) {
		const text = UI.files.list[UI.graphs.list[this.graphId].textId].text;
		let next;

		while (this.active.length && start > this.active[0].end) {
			this.createCurrentNode();
			next = this.active.shift();
			if (this.textIndex == next.end) continue;

			const t = document.createTextNode(text.slice(this.textIndex, next.end));
			this.currentNode.appendChild(t);
			this.pre.appendChild(this.currentNode);
			this.textIndex = next.end;
		}

		if (!this.active.length && this.textIndex < start) { // xxx
			const t = document.createTextNode(text.slice(this.textIndex, start));
			this.pre.appendChild(t);
			this.unmatchedLength += start - this.textIndex;
		} else if (this.active.length && this.textIndex != start) {
			const t = document.createTextNode(text.slice(this.textIndex, start));
			this.createCurrentNode();
			this.currentNode.appendChild(t);
			this.pre.appendChild(this.currentNode);
		}

		this.textIndex = start;
		let i = 0;
		for (; i < this.active.length; i++) { // xxx optimize
			const a = this.active[i];
			if (a.end > end) {
				break;
			}
		}
		this.active.splice(i, 0, {id, end});

		this.matches++;
		this.updateInfo();
	}

	done() {
		const text = UI.files.list[UI.graphs.list[this.graphId].textId].text;
		let next;
		while (this.active.length) {
			next = this.active.shift();
			const t = document.createTextNode(text.slice(this.textIndex, next.end));
			this.createCurrentNode();
			this.currentNode.appendChild(t);
			this.pre.appendChild(this.currentNode);
			this.textIndex = next.end;
		}

		const t = document.createTextNode(text.slice(this.textIndex));
		this.pre.appendChild(t);
		this.unmatchedLength += text.length - this.textIndex;
		this.updateInfo();
		//xxx show this!
		this.worker.terminate();
	}

	dragGraph(ev) {
		ev.preventDefault();
		const dPosX = UI.widget.oldPosX - ev.clientX;
		const dPosY = UI.widget.oldPosY - ev.clientY;
		UI.widget.oldPosX = ev.clientX;
    UI.widget.oldPosY = ev.clientY;
		const l = (UI.widget.graph.offsetLeft - dPosX);
		UI.widget.graph.style.left = (l < 0)? 0 : l + 'px';
		const t = UI.widget.graph.offsetTop - dPosY;
		UI.widget.graph.style.top = t + 'px';
	}

	stopMove(ev) {
		ev.preventDefault();
		document.onmouseup = null;
		document.onmousemove = null;
		UI.widget = null;
	}
	download() {
		// xxx
	}
	bigger(ev) {
		const id = ev.target.parentElement.dataset.graphId;
		const widget = UI.graphs.list[id].widget;
		const graph = widget.graph;
		const graphWidth = getComputedStyle(graph).getPropertyValue('width');
		if (graphWidth == '500px') return; // TODO: error msg
		graph.style.width = `${parseInt(graphWidth) + 50}px`;
		widget.updateFontSize(graph);
	}
	smaller(ev) {
		const id = ev.target.parentElement.dataset.graphId;
		const widget = UI.graphs.list[id].widget;
		const graph = widget.graph;
		const graphWidth = getComputedStyle(graph).getPropertyValue('width');
		if (graphWidth == '100px') return; // TODO: error msg
		graph.style.width = `${parseInt(graphWidth) - 50}px`;
		widget.updateFontSize(graph);
	}
	hide(ev) {
		const id = ev.target.parentElement.dataset.graphId;
		const graph = UI.graphs.list[id].widget.graph;
		graph.style.visibility = 'hidden';
	}
	updateFontSize(graph) {
		const graphWidth = getComputedStyle(graph)
			.getPropertyValue('width').match(/^\d+/);
		this.pre.style.fontSize = `${graphWidth/30}px`;
		this.pre.style.lineHeight = `${graphWidth/30}px`;
	}

	updateSearches(searches) {
		this.searches.innerHTML = '';
		if (!searches.length) return;
		if (this.sheet) this.sheet.remove();
		this.sheet = document.createElement('style');
		this.sheet.scoped = true;
		searches.forEach((s, i) => {
			this.sheet.innerHTML += `
			.search_${i} {
				background-color: ${UI.searches.list[s].color}80;
			}`;
		});
		this.graph.appendChild(this.sheet);
		this.searches.appendChild(document.createTextNode(
			`Suche${searches.length > 1? 'n' : ''}: ` +
			searches.reduce((o, s, i, a) => {
				const searchName = UI.searches.list[s].name;
				return o += `${searchName}${ i + 1 < a.length? ', ' : ''}`;
			},'')
		));
	}

	updateTextName(name) {
		this.text.innerHTML = '';
		if (name) this.text.appendChild(document.createTextNode(`Text: ${name}`));
	}

	updateTitle(title) {
		this.title.innerHTML = '';
		this.title.appendChild(document.createTextNode(title));
	}

	updateHeader(title, textName, searches) {
		this.updateTitle(title);
		this.updateSearches(searches);
		this.updateTextName(textName);
	}

	updateInfo() {
		const text = UI.files.list[UI.graphs.list[this.graphId].textId].text;
		this.results.innerHTML = '';
		this.results.appendChild(document.createTextNode(this.matches +
			' Ergebnis' + ((this.matches > 1)? 'se' : '')));
		this.coverage.innerHTML = '';
		this.coverage.appendChild(document.createTextNode(
			`${((text.length - this.unmatchedLength) /
				text.length * 100).toFixed(2)}% des Textes`
		));
	}

	createTextGraph() { // xxx
		const div = document.createElement('div');
		div.classList.add('paper');
		this.pre = document.createElement('pre');
		this.pre.classList.add('text');
		div.appendChild(this.pre);
		this.graph.appendChild(div);
	}

	createTitle() {
		this.title = document.createElement('h6');
		this.searches = document.createElement('p');
		this.text = document.createElement('p');
		this.results = document.createElement('p');
		this.coverage = document.createElement('p');
		this.searches.classList.add('graph_title');
		this.text.classList.add('graph_title');
		this.results.classList.add('graph_info');
		this.coverage.classList.add('graph_info');
		this.graph.appendChild(this.title);
		this.graph.appendChild(this.searches);
		this.graph.appendChild(this.text);
		this.graph.appendChild(this.results);
		this.graph.appendChild(this.coverage);
	}
	createNav() {
		const nav = document.createElement('nav');
		const ul = document.createElement('ul');
		const move = document.createElement('li');
		move.classList.add('graph_move');
		move.style.cursor = 'move';
		move.setAttribute('title', translations.move);
		this.addDraggable(move);
		ul.appendChild(move);
		ul.dataset.graphId = this.graphId;
		['bigger','smaller','hide'].forEach(type => {
			ul.appendChild(this.createButton(type));
		});
		nav.appendChild(ul);
		this.graph.appendChild(nav);
	}

	createButton(type) {
		const li = document.createElement('li');
		li.classList.add(`graph_${type}`);
		li.setAttribute('title', translations[type]);
		li.addEventListener('click', this[type]);
		return li;
	}
}
