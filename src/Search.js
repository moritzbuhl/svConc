
/** @enum */
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
