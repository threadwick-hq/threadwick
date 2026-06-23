import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Absolute paths to every input and output the i18n tooling reads or writes. */
const PATHS = {
	root: packageRoot,
	source: join(packageRoot, 'source'),
	glossary: join(packageRoot, 'glossary.json'),
	voice: join(packageRoot, 'voice.json'),
	overrides: join(packageRoot, 'overrides'),
	translations: join(packageRoot, 'translations'),
	messages: join(packageRoot, 'messages'),
	generated: join(packageRoot, 'src', 'generated'),
	lock: join(packageRoot, 'i18n.lock.json'),
} as const;

export { PATHS };
