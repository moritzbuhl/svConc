'use strict';
var text;
var searches = [];

 onmessage = e => {
	/* init worker: */
	text = e.data.text;
	e.data.searches.forEach(search => {
		search.flags += (search.flags.indexOf('g') < 0)? 'g' : '';
		searches.push(new RegExp(search.pattern, search.flags));
	});

	const results = [];
	searches.forEach((search, index, searches) => {
		const result = search.exec(text);
		if (!result) return;
		const start = result.index;
		const end = start + result[0].length;
		results[index] = {start, end};
	});
	const order = Object.keys(results).sort((a, b) => {
		return results[a].start - results[b].start;
	});
	/* work loop: */
	for (;;) {
		const id = order.shift();
		if (id === undefined) break;
		postMessage([id, results[id]]);
		const result = searches[id].exec(text);
		if (result) {
			const start = result.index;
			const end = start + result[0].length;
			results[id] = {start, end};
			let i = 0
			while(i < order.length) {
				const o = results[order[i]];
				if (o.start == start && o.end > end || o.start > start) break;
				i++;
			}
			order.splice(i, 0, id);
		}
	}
	postMessage(null);
};
