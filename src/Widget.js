/**
 * @file An interface for displaying matches
 * @version 1.0.0
 */
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
