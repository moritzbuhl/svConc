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
