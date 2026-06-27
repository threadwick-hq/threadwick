/**
 * work.ts — the work-tracking ledger tool and CI gate for `work/*.md` task files.
 *
 * Subcommands:
 *   check            validate every task file, run the status + git-derivation gates,
 *                    and fail if `work/INDEX.md` is stale. This is the hard CI gate.
 *   index            regenerate `work/INDEX.md` from frontmatter.
 *   next [--area A] [--phase N]   print the next claimable backlog task.
 *   list [--status S] [--area A] [--phase N]   print a table of tasks.
 *   new  --title "..." [--type T] [--area A] [--phase N] [--priority P]   scaffold a task.
 *   claim TW-NNN [--assignee name]   set status active + started (backlog only).
 *   show TW-NNN [--json]             print one task.
 *   stale [--days N] [--json]        list active tasks older than N days (default 3).
 *   export [--json]                  print all tasks (for mirrors/automation).
 *
 * Status is derived, not trusted: a task marked `done` must be referenced by a real commit,
 * and any id a commit closes (`Closes TW-NNN`) must actually be `done`. See checkGitDerivation.
 *
 * Exits non-zero on any violation. Run via `pnpm run work <command>`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type TaskType = 'feat' | 'fix' | 'refactor' | 'chore' | 'docs' | 'test';
type TaskStatus =
	| 'backlog'
	| 'active'
	| 'review'
	| 'done'
	| 'blocked'
	| 'abandoned';
type Priority = 'p0' | 'p1' | 'p2' | 'p3';
type Area =
	| 'apps/studio'
	| 'apps/web'
	| 'packages/config'
	| 'packages/core'
	| 'packages/editor'
	| 'packages/i18n'
	| 'packages/icons'
	| 'packages/org'
	| 'packages/types'
	| 'repo';

type Task = {
	id: string;
	idNum: number;
	title: string;
	type: TaskType;
	area: Area[];
	phase: number;
	status: TaskStatus;
	priority: Priority;
	assignee?: string;
	created: string;
	started?: string;
	completed?: string;
	blockedBy: string[];
	acceptance: string[];
	pr?: number;
	links: string[];
	file: string;
};

type RawFrontmatter = Record<string, string | string[]>;
type Violation = { file: string; field?: string; message: string };
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

const TASK_TYPES = [
	'feat',
	'fix',
	'refactor',
	'chore',
	'docs',
	'test',
] as const;
const STATUSES = [
	'backlog',
	'active',
	'review',
	'done',
	'blocked',
	'abandoned',
] as const;
const PRIORITIES = ['p0', 'p1', 'p2', 'p3'] as const;
const AREAS = [
	'apps/studio',
	'apps/web',
	'packages/config',
	'packages/core',
	'packages/editor',
	'packages/i18n',
	'packages/icons',
	'packages/org',
	'packages/types',
	'repo',
] as const;

const STATUS_ORDER: Record<TaskStatus, number> = {
	active: 0,
	review: 1,
	blocked: 2,
	backlog: 3,
	done: 4,
	abandoned: 5,
};
const MAX_PHASE = 8;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID_PATTERN = /^TW-\d{3,}$/;
const TASK_FILENAME = /^TW-\d{3,}-.+\.md$/;
const CLOSE_REF =
	/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(TW-\d{3,})\b/gi;

const WORK_DIR = join(process.cwd(), 'work');
const INDEX_FILE = join(WORK_DIR, 'INDEX.md');
const TEMPLATE_FILE = join(WORK_DIR, '_TEMPLATE.md');

function main(): void {
	const [command = 'check', ...rest] = process.argv.slice(2);
	switch (command) {
		case 'check':
			runCheck();
			break;
		case 'index':
			runIndex();
			break;
		case 'next':
			runNext(rest);
			break;
		case 'list':
			runList(rest);
			break;
		case 'new':
			runNew(rest);
			break;
		case 'claim':
			runClaim(rest);
			break;
		case 'show':
			runShow(rest);
			break;
		case 'stale':
			runStale(rest);
			break;
		case 'export':
			runExport(rest);
			break;
		default:
			console.error(
				`work: unknown command "${command}". Use: check | index | next | list | new | claim | show | stale | export`,
			);
			process.exit(2);
	}
}

function runCheck(): void {
	const { tasks, violations } = loadTasks();
	violations.push(...checkCrossReferences(tasks));
	violations.push(...checkGitDerivation(tasks));
	violations.push(...checkIndexFreshness(tasks));

	console.log(`work: checked ${tasks.length} task file(s) in work/`);
	for (const v of violations) {
		const where = v.field ? `${v.file} [${v.field}]` : v.file;
		console.log(`  ${where}  ${v.message}`);
	}
	console.log(
		violations.length === 0
			? '  ok — no violations'
			: `  fail — ${violations.length} violation(s)`,
	);
	process.exit(violations.length > 0 ? 1 : 0);
}

function runIndex(): void {
	const { tasks, violations } = loadTasks();
	if (violations.length > 0) {
		console.error(
			'work: refusing to write INDEX.md while task files have violations. Run `pnpm run work check`.',
		);
		process.exit(1);
	}
	writeFileSync(INDEX_FILE, renderIndex(tasks), 'utf8');
	console.log(`work: wrote work/INDEX.md (${tasks.length} task(s))`);
}

function runNext(rest: string[]): void {
	const { tasks } = loadTasks();
	const area = getFlag(rest, '--area');
	const phase = getFlag(rest, '--phase');
	const doneIds = new Set(
		tasks.filter((t) => t.status === 'done').map((t) => t.id),
	);
	const claimable = tasks
		.filter((t) => t.status === 'backlog')
		.filter((t) => t.blockedBy.every((id) => doneIds.has(id)))
		.filter((t) => area === undefined || t.area.some((a) => a === area))
		.filter((t) => phase === undefined || String(t.phase) === phase)
		.sort(byPriorityThenId);

	const next = claimable[0];
	if (next === undefined) {
		console.log('work: no claimable backlog task matches the filter.');
		return;
	}
	console.log(`${next.id}  ${next.title}`);
	console.log(
		`  ${next.file}  (${next.type}, ${next.area.join(', ')}, phase ${next.phase}, ${next.priority})`,
	);
}

function runList(rest: string[]): void {
	const { tasks } = loadTasks();
	const status = getFlag(rest, '--status');
	const area = getFlag(rest, '--area');
	const phase = getFlag(rest, '--phase');
	const rows = tasks
		.filter((t) => status === undefined || t.status === status)
		.filter((t) => area === undefined || t.area.some((a) => a === area))
		.filter((t) => phase === undefined || String(t.phase) === phase)
		.sort(byPhaseThenStatus);
	for (const t of rows) {
		console.log(
			`${t.id}  ${t.status.padEnd(9)} p${t.phase}  ${t.priority}  ${t.title}`,
		);
	}
	console.log(`  ${rows.length} task(s)`);
}

function runClaim(rest: string[]): void {
	const id = rest.find((a) => !a.startsWith('--'));
	if (id === undefined) {
		console.error('work claim: TW-NNN is required');
		process.exit(2);
	}
	const assignee = getFlag(rest, '--assignee') ?? 'agent';
	const { tasks, violations } = loadTasks();
	if (violations.length > 0) {
		console.error(
			'work claim: fix task file violations first (`pnpm run work check`).',
		);
		process.exit(1);
	}
	const task = tasks.find((t) => t.id === id);
	if (task === undefined) {
		console.error(`work claim: ${id} not found`);
		process.exit(1);
	}
	if (task.status !== 'backlog') {
		console.error(
			`work claim: ${id} is "${task.status}" — only backlog tasks can be claimed`,
		);
		process.exit(1);
	}
	const doneIds = new Set(
		tasks.filter((t) => t.status === 'done').map((t) => t.id),
	);
	const blocked = task.blockedBy.filter((dep) => !doneIds.has(dep));
	if (blocked.length > 0) {
		console.error(
			`work claim: ${id} is blocked by unfinished ${blocked.join(', ')}`,
		);
		process.exit(1);
	}
	const today = new Date().toISOString().slice(0, 10);
	const filePath = join(WORK_DIR, task.file);
	const content = readFileSync(filePath, 'utf8');
	const patched = patchFrontmatter(content, {
		status: 'active',
		assignee,
		started: today,
	});
	const logged = appendLogLine(
		patched,
		`${today} claimed by ${assignee}.`,
	);
	writeFileSync(filePath, logged, 'utf8');
	console.log(`work: claimed ${id} (${task.file}) for ${assignee}`);
	console.log(`  branch feat/${id.toLowerCase()}-<slug>`);
}

function runShow(rest: string[]): void {
	const id = rest.find((a) => !a.startsWith('--'));
	if (id === undefined) {
		console.error('work show: TW-NNN is required');
		process.exit(2);
	}
	const json = hasFlag(rest, '--json');
	const { tasks } = loadTasks();
	const task = tasks.find((t) => t.id === id);
	if (task === undefined) {
		console.error(`work show: ${id} not found`);
		process.exit(1);
	}
	if (json) {
		console.log(JSON.stringify(taskToJson(task), null, 2));
		return;
	}
	console.log(`${task.id}  ${task.title}`);
	console.log(
		`  ${task.file}  (${task.type}, ${task.area.join(', ')}, phase ${task.phase}, ${task.priority}, ${task.status})`,
	);
	if (task.assignee) {
		console.log(`  assignee: ${task.assignee}`);
	}
	if (task.started) {
		console.log(`  started: ${task.started}`);
	}
}

function runStale(rest: string[]): void {
	const daysRaw = getFlag(rest, '--days') ?? '3';
	const days = Number.parseInt(daysRaw, 10);
	if (!Number.isInteger(days) || days < 1) {
		console.error('work stale: --days must be a positive integer');
		process.exit(2);
	}
	const json = hasFlag(rest, '--json');
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - days);
	const cutoffStr = cutoff.toISOString().slice(0, 10);
	const { tasks } = loadTasks();
	const stale = tasks
		.filter((t) => t.status === 'active' && t.started !== undefined)
		.filter((t) => t.started! < cutoffStr)
		.sort(byPriorityThenId);
	if (json) {
		console.log(JSON.stringify(stale.map(taskToJson), null, 2));
		return;
	}
	for (const t of stale) {
		console.log(
			`${t.id}  started ${t.started}  ${t.assignee ?? '-'}  ${t.title}`,
		);
	}
	console.log(`  ${stale.length} stale active task(s) (>${days} day(s))`);
	process.exit(stale.length > 0 ? 1 : 0);
}

function runExport(rest: string[]): void {
	const json = hasFlag(rest, '--json');
	const { tasks, violations } = loadTasks();
	if (violations.length > 0 && !json) {
		console.error(
			'work export: task files have violations; output may be incomplete.',
		);
	}
	const payload = tasks.map(taskToJson);
	if (json) {
		console.log(JSON.stringify(payload, null, 2));
		return;
	}
	for (const t of tasks) {
		console.log(`${t.id}\t${t.status}\t${t.title}`);
	}
}

function runNew(rest: string[]): void {
	const title = getFlag(rest, '--title');
	if (title === undefined) {
		console.error('work new: --title "..." is required');
		process.exit(2);
	}
	if (!existsSync(TEMPLATE_FILE)) {
		console.error('work new: work/_TEMPLATE.md not found');
		process.exit(1);
	}
	const { tasks } = loadTasks();
	const nextNum = tasks.reduce((max, t) => Math.max(max, t.idNum), 0) + 1;
	const id = `TW-${String(nextNum).padStart(3, '0')}`;
	const slug = slugify(title);
	const file = join(WORK_DIR, `${id}-${slug}.md`);

	const today = new Date().toISOString().slice(0, 10);
	const filled = readFileSync(TEMPLATE_FILE, 'utf8')
		.replace(/^id:.*$/m, `id: ${id}`)
		.replace(/^title:.*$/m, `title: ${title}`)
		.replace(/^type:.*$/m, `type: ${getFlag(rest, '--type') ?? 'feat'}`)
		.replace(/^phase:.*$/m, `phase: ${getFlag(rest, '--phase') ?? '0'}`)
		.replace(
			/^priority:.*$/m,
			`priority: ${getFlag(rest, '--priority') ?? 'p2'}`,
		)
		.replace(/^created:.*$/m, `created: ${today}`);
	writeFileSync(file, filled, 'utf8');
	console.log(
		`work: created ${file}. Set the area, acceptance, and body, then run \`pnpm run work index\`.`,
	);
}

function loadTasks(): { tasks: Task[]; violations: Violation[] } {
	if (!existsSync(WORK_DIR)) {
		return {
			tasks: [],
			violations: [
				{ file: 'work/', message: 'work/ directory does not exist' },
			],
		};
	}
	const files = readdirSync(WORK_DIR)
		.filter((name) => TASK_FILENAME.test(name))
		.sort();
	const tasks: Task[] = [];
	const violations: Violation[] = [];
	for (const name of files) {
		const content = readFileSync(join(WORK_DIR, name), 'utf8');
		const split = splitFrontmatter(content);
		if (!split.ok) {
			violations.push({ file: name, message: split.error });
			continue;
		}
		const raw = parseYamlBlock(split.value.yaml);
		const result = validateTask(raw, name);
		violations.push(...result.violations);
		if (result.task) {
			tasks.push(result.task);
		}
	}
	return { tasks, violations };
}

function validateTask(
	raw: RawFrontmatter,
	file: string,
): { task?: Task; violations: Violation[] } {
	const violations: Violation[] = [];
	const id = requireScalar(raw, 'id', file, violations);
	const title = requireScalar(raw, 'title', file, violations);
	const type = oneOf(scalar(raw, 'type'), TASK_TYPES, 'type', file, violations);
	const status = oneOf(
		scalar(raw, 'status'),
		STATUSES,
		'status',
		file,
		violations,
	);
	const priority = oneOf(
		scalar(raw, 'priority'),
		PRIORITIES,
		'priority',
		file,
		violations,
	);
	const created = requireDate(raw, 'created', file, violations);
	const area = requireAreas(raw, file, violations);
	const phase = requirePhase(raw, file, violations);
	const acceptance = list(raw, 'acceptance');
	if (acceptance.length === 0) {
		violations.push({
			file,
			field: 'acceptance',
			message: 'at least one acceptance criterion is required',
		});
	}

	violations.push(...checkIdFormat(id, file));
	const started = optionalDate(raw, 'started', file, violations);
	const completed = optionalDate(raw, 'completed', file, violations);
	const pr = optionalInt(raw, 'pr', file, violations);
	const blockedBy = list(raw, 'blocked_by');
	violations.push(
		...checkStatusInvariants(
			status,
			{ started, completed, pr, blockedBy },
			file,
		),
	);

	if (
		id === undefined ||
		title === undefined ||
		type === undefined ||
		status === undefined ||
		priority === undefined ||
		created === undefined ||
		area === undefined ||
		phase === undefined ||
		acceptance.length === 0
	) {
		return { violations };
	}
	const task: Task = {
		id,
		idNum: Number.parseInt(id.slice(3), 10),
		title,
		type,
		area,
		phase,
		status,
		priority,
		assignee: scalar(raw, 'assignee'),
		created,
		started,
		completed,
		blockedBy,
		acceptance,
		pr,
		links: list(raw, 'links'),
		file,
	};
	return { task, violations };
}

function checkIdFormat(id: string | undefined, file: string): Violation[] {
	if (id === undefined) {
		return [];
	}
	const violations: Violation[] = [];
	if (!ID_PATTERN.test(id)) {
		violations.push({
			file,
			field: 'id',
			message: `"${id}" must match TW-NNN`,
		});
	}
	if (!file.startsWith(`${id}-`)) {
		violations.push({
			file,
			field: 'id',
			message: `filename must start with "${id}-"`,
		});
	}
	return violations;
}

function checkStatusInvariants(
	status: TaskStatus | undefined,
	fields: {
		started?: string;
		completed?: string;
		pr?: number;
		blockedBy: string[];
	},
	file: string,
): Violation[] {
	const violations: Violation[] = [];
	const require = (ok: boolean, field: string, message: string) => {
		if (!ok) {
			violations.push({ file, field, message });
		}
	};
	if (status === 'active') {
		require(fields.started !==
			undefined, 'started', 'status "active" requires a started date');
	}
	if (status === 'review') {
		require(fields.pr !==
			undefined, 'pr', 'status "review" requires a pr number');
	}
	if (status === 'done') {
		require(fields.completed !==
			undefined, 'completed', 'status "done" requires a completed date');
		require(fields.pr !==
			undefined, 'pr', 'status "done" requires a pr number');
	}
	if (status === 'blocked') {
		require(fields.blockedBy.length >
			0, 'blocked_by', 'status "blocked" requires at least one blocked_by id');
	}
	return violations;
}

function checkCrossReferences(tasks: Task[]): Violation[] {
	const violations: Violation[] = [];
	const ids = new Set(tasks.map((t) => t.id));
	const seen = new Set<string>();
	for (const t of tasks) {
		if (seen.has(t.id)) {
			violations.push({
				file: t.file,
				field: 'id',
				message: `duplicate id ${t.id}`,
			});
		}
		seen.add(t.id);
		for (const dep of t.blockedBy) {
			if (!ids.has(dep)) {
				violations.push({
					file: t.file,
					field: 'blocked_by',
					message: `${dep} does not exist`,
				});
			}
		}
	}
	return violations;
}

/**
 * The core "status is derived, not trusted" gate. Uses full git history (CI must checkout
 * with fetch-depth 0). Skipped with a note when git history is unavailable, never failing falsely.
 */
function checkGitDerivation(tasks: Task[]): Violation[] {
	const log = readGitLog();
	if (log === undefined) {
		console.log('  (git history unavailable — skipping derivation gate)');
		return [];
	}
	const violations: Violation[] = [];
	const referenced = new Set(log.match(/\bTW-\d{3,}\b/g) ?? []);
	const closed = new Set<string>();
	for (const m of log.matchAll(CLOSE_REF)) {
		if (m[1]) {
			closed.add(m[1]);
		}
	}
	const byId = new Map(tasks.map((t) => [t.id, t]));
	for (const t of tasks) {
		if (t.status === 'done' && !referenced.has(t.id)) {
			violations.push({
				file: t.file,
				field: 'status',
				message: `"done" but no commit references ${t.id}`,
			});
		}
	}
	for (const id of closed) {
		const t = byId.get(id);
		if (t && t.status !== 'done') {
			violations.push({
				file: t.file,
				field: 'status',
				message: `a commit closes ${id} but status is "${t.status}"`,
			});
		}
	}
	return violations;
}

function checkIndexFreshness(tasks: Task[]): Violation[] {
	const expected = renderIndex(tasks);
	const actual = existsSync(INDEX_FILE) ? readFileSync(INDEX_FILE, 'utf8') : '';
	if (actual.trimEnd() !== expected.trimEnd()) {
		return [
			{
				file: 'work/INDEX.md',
				message: 'is stale — run `pnpm run work index`',
			},
		];
	}
	return [];
}

function renderIndex(tasks: Task[]): string {
	const ordered = tasks.slice().sort(byPhaseThenStatus);
	const counts = STATUSES.map(
		(s) => `${s} ${tasks.filter((t) => t.status === s).length}`,
	).join(' · ');
	const header = [
		'# Work index',
		'',
		'Generated from `work/*.md` frontmatter by `scripts/work.ts`. Do not edit by hand; run `pnpm run work index`.',
		'',
		`Totals: ${counts}`,
		'',
		'| ID | Title | Type | Area | Phase | Status | Priority | Assignee |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
	];
	const rows = ordered.map(
		(t) =>
			`| ${t.id} | ${t.title} | ${t.type} | ${t.area.join(', ')} | ${t.phase} | ${t.status} | ${t.priority} | ${t.assignee ?? '-'} |`,
	);
	return `${[...header, ...rows].join('\n')}\n`;
}

function byPriorityThenId(a: Task, b: Task): number {
	return a.priority === b.priority
		? a.idNum - b.idNum
		: a.priority.localeCompare(b.priority);
}

function byPhaseThenStatus(a: Task, b: Task): number {
	if (a.phase !== b.phase) {
		return a.phase - b.phase;
	}
	if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
		return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
	}
	return a.idNum - b.idNum;
}

function splitFrontmatter(
	content: string,
): Result<{ yaml: string; body: string }> {
	const lines = content.split('\n');
	if (lines[0]?.trim() !== '---') {
		return {
			ok: false,
			error: 'file does not open with a --- frontmatter fence',
		};
	}
	const closing = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
	if (closing === -1) {
		return { ok: false, error: 'frontmatter fence is not closed with ---' };
	}
	return {
		ok: true,
		value: {
			yaml: lines.slice(1, closing).join('\n'),
			body: lines.slice(closing + 1).join('\n'),
		},
	};
}

function parseYamlBlock(yaml: string): RawFrontmatter {
	const data: RawFrontmatter = {};
	let listKey: string | undefined;
	for (const rawLine of yaml.split('\n')) {
		const line = rawLine.replace(/\s+$/, '');
		if (isSkippableLine(line)) {
			continue;
		}
		const item = matchListItem(line);
		if (item !== undefined && listKey !== undefined) {
			appendItem(data, listKey, item);
			continue;
		}
		const entry = matchKeyValue(line);
		if (entry === undefined) {
			continue;
		}
		listKey = assignEntry(data, entry);
	}
	return data;
}

function isSkippableLine(line: string): boolean {
	const trimmed = line.trim();
	return trimmed === '' || trimmed.startsWith('#');
}

function matchListItem(line: string): string | undefined {
	const item = line.match(/^\s+-\s+(.*)$/);
	return item?.[1] === undefined ? undefined : stripQuotes(item[1].trim());
}

function matchKeyValue(
	line: string,
): { key: string; value: string } | undefined {
	const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
	const key = kv?.[1];
	if (key === undefined) {
		return undefined;
	}
	return { key, value: kv?.[2]?.trim() ?? '' };
}

function assignEntry(
	data: RawFrontmatter,
	entry: { key: string; value: string },
): string | undefined {
	const { key, value } = entry;
	if (value === '') {
		return key;
	}
	data[key] = isInlineArray(value)
		? parseInlineArray(value)
		: stripQuotes(value);
	return undefined;
}

function isInlineArray(value: string): boolean {
	return value.startsWith('[') && value.endsWith(']');
}

function appendItem(data: RawFrontmatter, key: string, item: string): void {
	const existing = data[key];
	if (Array.isArray(existing)) {
		existing.push(item);
	} else {
		data[key] = [item];
	}
}

function parseInlineArray(value: string): string[] {
	return value
		.slice(1, -1)
		.split(',')
		.map((part) => stripQuotes(part.trim()))
		.filter((part) => part !== '');
}

function stripQuotes(value: string): string {
	const quoted =
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"));
	return quoted ? value.slice(1, -1) : value;
}

function scalar(data: RawFrontmatter, key: string): string | undefined {
	const v = data[key];
	return typeof v === 'string' ? v : undefined;
}

function list(data: RawFrontmatter, key: string): string[] {
	const v = data[key];
	return Array.isArray(v) ? v : [];
}

function requireScalar(
	data: RawFrontmatter,
	key: string,
	file: string,
	violations: Violation[],
): string | undefined {
	const v = scalar(data, key);
	if (v === undefined || v === '') {
		violations.push({
			file,
			field: key,
			message: `missing required field "${key}"`,
		});
		return undefined;
	}
	return v;
}

function oneOf<T extends string>(
	value: string | undefined,
	allowed: readonly T[],
	key: string,
	file: string,
	violations: Violation[],
): T | undefined {
	const match = allowed.find((a) => a === value);
	if (match === undefined) {
		violations.push({
			file,
			field: key,
			message: `"${value ?? ''}" is not one of: ${allowed.join(', ')}`,
		});
	}
	return match;
}

function requireAreas(
	data: RawFrontmatter,
	file: string,
	violations: Violation[],
): Area[] | undefined {
	const raw = list(data, 'area');
	if (raw.length === 0) {
		violations.push({
			file,
			field: 'area',
			message: 'at least one area is required',
		});
		return undefined;
	}
	const areas: Area[] = [];
	for (const value of raw) {
		const match = AREAS.find((a) => a === value);
		if (match === undefined) {
			violations.push({
				file,
				field: 'area',
				message: `"${value}" is not a known area`,
			});
		} else {
			areas.push(match);
		}
	}
	return areas.length === raw.length ? areas : undefined;
}

function requirePhase(
	data: RawFrontmatter,
	file: string,
	violations: Violation[],
): number | undefined {
	const v = scalar(data, 'phase');
	const n = v === undefined ? Number.NaN : Number.parseInt(v, 10);
	if (!Number.isInteger(n) || n < 0 || n > MAX_PHASE) {
		violations.push({
			file,
			field: 'phase',
			message: `must be an integer 0..${MAX_PHASE}`,
		});
		return undefined;
	}
	return n;
}

function requireDate(
	data: RawFrontmatter,
	key: string,
	file: string,
	violations: Violation[],
): string | undefined {
	const v = requireScalar(data, key, file, violations);
	if (v === undefined) {
		return undefined;
	}
	if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(v))) {
		violations.push({
			file,
			field: key,
			message: `"${v}" is not a valid ISO date (YYYY-MM-DD)`,
		});
		return undefined;
	}
	return v;
}

function optionalDate(
	data: RawFrontmatter,
	key: string,
	file: string,
	violations: Violation[],
): string | undefined {
	const v = scalar(data, key);
	if (v === undefined || v === '') {
		return undefined;
	}
	if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(v))) {
		violations.push({
			file,
			field: key,
			message: `"${v}" is not a valid ISO date (YYYY-MM-DD)`,
		});
		return undefined;
	}
	return v;
}

function optionalInt(
	data: RawFrontmatter,
	key: string,
	file: string,
	violations: Violation[],
): number | undefined {
	const v = scalar(data, key);
	if (v === undefined || v === '') {
		return undefined;
	}
	const n = Number.parseInt(v, 10);
	if (!Number.isInteger(n) || String(n) !== v) {
		violations.push({ file, field: key, message: `"${v}" is not an integer` });
		return undefined;
	}
	return n;
}

function readGitLog(): string | undefined {
	try {
		return execFileSync('git', ['log', '--no-color', '--pretty=format:%B'], {
			encoding: 'utf8',
		});
	} catch {
		return undefined;
	}
}

function getFlag(rest: string[], flag: string): string | undefined {
	const i = rest.indexOf(flag);
	return i >= 0 ? rest[i + 1] : undefined;
}

function hasFlag(rest: string[], flag: string): boolean {
	return rest.includes(flag);
}

function taskToJson(task: Task): Record<string, unknown> {
	return {
		id: task.id,
		title: task.title,
		type: task.type,
		area: task.area,
		phase: task.phase,
		status: task.status,
		priority: task.priority,
		assignee: task.assignee ?? null,
		created: task.created,
		started: task.started ?? null,
		completed: task.completed ?? null,
		blockedBy: task.blockedBy,
		acceptance: task.acceptance,
		pr: task.pr ?? null,
		links: task.links,
		file: task.file,
	};
}

function patchFrontmatter(
	content: string,
	fields: Record<string, string>,
): string {
	const split = splitFrontmatter(content);
	if (!split.ok) {
		throw new Error(split.error);
	}
	let yaml = split.value.yaml;
	for (const [key, value] of Object.entries(fields)) {
		const uncommented = new RegExp(`^#\\s*${key}:\\s*.*$`, 'm');
		const existing = new RegExp(`^${key}:\\s*.*$`, 'm');
		const line = `${key}: ${value}`;
		if (existing.test(yaml)) {
			yaml = yaml.replace(existing, line);
		} else if (uncommented.test(yaml)) {
			yaml = yaml.replace(uncommented, line);
		} else {
			yaml = `${yaml}\n${line}`;
		}
	}
	return `---\n${yaml}\n---${split.value.body}`;
}

function appendLogLine(content: string, line: string): string {
	const entry = `- ${line}`;
	if (content.includes('## Log')) {
		return content.replace(/(## Log\r?\n\r?\n)/, `$1${entry}\n`);
	}
	return `${content.trimEnd()}\n\n## Log\n\n${entry}\n`;
}

function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48);
}

main();
