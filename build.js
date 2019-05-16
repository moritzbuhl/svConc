#!/usr/bin/env node
/**
 * @file Build all files defined in the target property in package.json
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Remove JS comments starting with '/**' from a string
 * and replace it with empty lines.
 * @param {string} code - the code with comments
 * @returns {string} the code without comments
 */
function stripComments(code) {
	return code.replace(/\/\*\*(?:(?:\*(?!\/))|[^\*]|\s)*\*\//gm, str => {
			return '\n'.repeat((str.match(/\n/g)||[]).length);
		}
	);
}

/**
 * Create a path of folders as in 'mkdir -p /path/to/folder'
 * @param {string} path - a path to a folder
 */
function createPath(path) {
	path.split('/').forEach((_, i, arr) => {
		const folder = arr.slice(0, i + 1).join('/');
		if (!fs.existsSync(folder))
			fs.mkdirSync(folder);
	});
}

const targets = process.argv.splice(2)
if (targets.length == 0)
	targets.push('./package.json');

targets.forEach(targetFile => {
	const { target } = JSON.parse(fs.readFileSync(targetFile));

	[target, ...target.files].forEach(t => {
		if (t.outputPath) createPath(t.outputPath);
	});

	target.assets.forEach(a => {
		fs.copyFile(a, `${target.outputPath}/${path.basename(a)}`,
			e => { if (e) console.log(e); });
	});

	target.files.forEach(f => {
		let data = `'use strict';\n`;
		f.sources.forEach(s => {
			data += stripComments(fs.readFileSync(
				`${f.srcPrefix || target.srcPrefix}/${s}`,
				{ encoding: 'utf8' }));
		});
		const file = `${f.outputPath || target.outputPath}/${f.name}`;
		fs.writeFileSync(file, data);
	});
});

