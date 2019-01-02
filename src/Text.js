/**
 * @file An interface to manipulate and display a text
 * @version 1.0.0
 */

/**
 * An interface for a text loaded into the program
 * @interface
 */

const CHAPTER = {
	NONE: 0,
	XML: 1,
	REGEXP: 2,
	MANUAL: 3
};


// XXX format according to matches/markers
// XXX display calculating

class Text { // xxx remove unused code
	/**
	 * @params {File} file - The text file
	 * @params {string} encoding - The texts encoding
	 * @todo XML
	 */
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

	/**
	 * Split the text according to a Regular Expression,
	 * exclude the match from the texts.
	 * @params {RegExp} re - A regular Expression to find chapters
	 */
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

	/**
	 * Split the text according to an array of chapter bounds
	 * @params {Object[]} chapters - An optional list of chapters
	 * @params {Integer} chapters[].begin - The beginning of a chapter
	 * @params {Integer} chapters[].end - The end of a chapter
	 */
	splitTextByChapters(chapters) {
		this.chapters.forEach(chapter => {
			chapter.remove();
		});
		chapters.forEach(c => {
			this.chapters.push(new Chapter(c.name,
				this.text.substring(c.begin, c.end)));
		});
	}

	/**
	 * @params {Search[]} searches - Searches to be used on this text
	 */
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
