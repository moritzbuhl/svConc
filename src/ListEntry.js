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
