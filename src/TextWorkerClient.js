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
