import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

/** Reads and parses a JSON file as `unknown`; the caller narrows the shape. */
function readJson(path: string): unknown {
	return JSON.parse(readFileSync(path, 'utf8'));
}

/** Writes a value as tab-indented JSON with a trailing newline, creating parent dirs. */
function writeJson(path: string, value: unknown): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, undefined, '\t')}\n`, 'utf8');
}

/** Writes UTF-8 text with a trailing newline, creating parent dirs. */
function writeText(path: string, text: string): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

/** Lists the immediate subdirectory names of a directory, or `[]` if it does not exist. */
function listDirs(path: string): string[] {
	if (!existsSync(path)) {
		return [];
	}
	return readdirSync(path, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

/** Lists the `*.json` basenames (without extension) in a directory, or `[]`. */
function listJsonFiles(path: string): string[] {
	if (!existsSync(path)) {
		return [];
	}
	return readdirSync(path)
		.filter((name) => name.endsWith('.json'))
		.map((name) => name.slice(0, -'.json'.length));
}

export { existsSync, listDirs, listJsonFiles, readJson, writeJson, writeText };
