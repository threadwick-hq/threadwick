#!/usr/bin/env node
/**
 * Claude Code Stop hook for the bare+worktree monorepo container.
 *
 * The user-global stop gate binds to the single nearest package.json from
 * cwd, which never works here: the container cwd is not a work tree (git
 * fatals), and the workspace root has neither a tsconfig.json nor a vitest
 * binary. This gate instead walks every linked worktree with changed
 * TypeScript files, maps each file to its owning workspace package, and runs
 * that package's own `tsc --noEmit` and `vitest related`.
 *
 * Failures exit 2, feeding output back to Claude for one fix round
 * (stop_hook_active caps the forced continuation). Exits 0 silently when
 * there is nothing to check or the environment is unusable — fail-open.
 *
 * Known gap (by design): files owned by the workspace-root package (e.g.
 * scripts/*.ts) have no tsconfig or vitest there and are skipped; CI's
 * `work check` and turbo gates cover them instead.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { resolveGitCommonDir } from './lib/git.mjs';

const TS_FILE_PATTERN = /\.(ts|tsx|mts|cts)$/;
const OUTPUT_LIMIT_CHARS = 6000;
// Per-run caps plus the overall deadline must fit inside the 240s hook timeout
// in settings.json — a hook killed from outside loses failures it already found.
const TYPECHECK_TIMEOUT_MS = 90_000;
const TEST_TIMEOUT_MS = 120_000;
const OVERALL_DEADLINE_MS = 200_000;
const startedAt = Date.now();

const input = readStdinJson();
if (input?.stop_hook_active === true) process.exit(0); // one forced fix round max

const containerDir = resolveContainerDir(input);
if (containerDir === undefined) process.exit(0);

const failures = [];
outer: for (const worktree of listWorktrees(containerDir)) {
	const changedTsFiles = listChangedTsFiles(worktree);
	if (changedTsFiles.length === 0) continue;
	for (const [packageRoot, files] of groupByPackage(worktree, changedTsFiles)) {
		if (Date.now() - startedAt > OVERALL_DEADLINE_MS) break outer; // fail-open: report what we have
		const typecheckOutput = runTypecheck(packageRoot);
		if (typecheckOutput !== undefined) {
			failures.push(
				`Typecheck failed in ${packageRoot} (tsc --noEmit):\n${typecheckOutput}`,
			);
		}
		const testOutput = runRelatedTests(packageRoot, files);
		if (testOutput !== undefined) {
			failures.push(
				`Vitest tests related to changed files failed in ${packageRoot}:\n${testOutput}`,
			);
		}
	}
}

if (failures.length > 0) {
	console.error(failures.join('\n\n').slice(0, OUTPUT_LIMIT_CHARS));
	process.exit(2);
}
process.exit(0);

function readStdinJson() {
	try {
		return JSON.parse(readFileSync(0, 'utf8'));
	} catch {
		return undefined;
	}
}

/**
 * Resolves the bare+worktree container directory. Sessions start either at
 * the container itself or inside one of its worktrees; in both cases the
 * container is the parent of the shared git dir.
 */
function resolveContainerDir(hookInput) {
	const workingDir =
		typeof hookInput?.cwd === 'string' ? hookInput.cwd : process.cwd();
	const commonDir = resolveGitCommonDir({ cwd: workingDir });
	if (commonDir !== undefined) return path.dirname(commonDir);
	const projectDir = process.env.CLAUDE_PROJECT_DIR ?? workingDir;
	return existsSync(projectDir) ? projectDir : undefined;
}

/** Lists worktree checkouts inside the container (dirs holding a .git entry). */
function listWorktrees(container) {
	if (
		existsSync(path.join(container, '.git')) &&
		existsSync(path.join(container, 'package.json'))
	) {
		return [container]; // plain single-checkout layout
	}
	try {
		return readdirSync(container)
			.map((name) => path.join(container, name))
			.filter(
				(dir) =>
					existsSync(path.join(dir, '.git')) &&
					existsSync(path.join(dir, 'package.json')),
			);
	} catch {
		return [];
	}
}

/**
 * Lists changed (tracked-modified + untracked) TypeScript files in one
 * worktree as absolute paths. Returns [] when git is unusable there.
 */
function listChangedTsFiles(worktree) {
	const tracked =
		git(worktree, ['diff', '--name-only', 'HEAD', '--diff-filter=ACMR']) ?? '';
	const untracked =
		git(worktree, ['ls-files', '--others', '--exclude-standard']) ?? '';
	const uniquePaths = new Set(
		`${tracked}\n${untracked}`
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => TS_FILE_PATTERN.test(line) && !line.endsWith('.d.ts')),
	);
	return [...uniquePaths].map((relativePath) =>
		path.join(worktree, relativePath),
	);
}

/** Groups changed files by their owning package root (nearest package.json within the worktree). */
function groupByPackage(worktree, changedTsFiles) {
	const filesByPackage = new Map();
	for (const filePath of changedTsFiles) {
		const packageRoot = findPackageRoot(worktree, path.dirname(filePath));
		if (packageRoot === undefined) continue;
		const bucket = filesByPackage.get(packageRoot) ?? [];
		bucket.push(filePath);
		filesByPackage.set(packageRoot, bucket);
	}
	return filesByPackage;
}

/** Walks up from startDir (staying inside the worktree) to the nearest directory with a package.json. */
function findPackageRoot(worktree, startDir) {
	let currentDir = startDir;
	while (currentDir.startsWith(worktree)) {
		if (existsSync(path.join(currentDir, 'package.json'))) return currentDir;
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) return undefined;
		currentDir = parentDir;
	}
	return undefined;
}

function git(cwd, args) {
	try {
		return execFileSync('git', ['-C', cwd, ...args], {
			stdio: ['ignore', 'pipe', 'ignore'],
			timeout: 10_000,
		}).toString();
	} catch {
		return undefined;
	}
}

function localBin(root, name) {
	const binPath = path.join(root, 'node_modules', '.bin', name);
	return existsSync(binPath) ? binPath : undefined;
}

/** Runs the package's tsc --noEmit; returns failure output, or undefined when clean/skipped. */
function runTypecheck(packageRoot) {
	const tsc = localBin(packageRoot, 'tsc');
	if (tsc === undefined || !existsSync(path.join(packageRoot, 'tsconfig.json')))
		return undefined;
	try {
		execFileSync(tsc, ['--noEmit'], {
			cwd: packageRoot,
			stdio: ['ignore', 'pipe', 'pipe'],
			timeout: TYPECHECK_TIMEOUT_MS,
		});
		return undefined;
	} catch (error) {
		if (error?.killed === true) return undefined; // timed out — skip rather than block
		return collectOutput(error);
	}
}

/** Runs the package's vitest on tests related to the changed files; undefined when clean/skipped. */
function runRelatedTests(packageRoot, changedTsFiles) {
	const vitest = localBin(packageRoot, 'vitest');
	if (vitest === undefined) return undefined;
	const relativeFiles = changedTsFiles.map((absolutePath) =>
		path.relative(packageRoot, absolutePath),
	);
	try {
		execFileSync(
			vitest,
			[
				'related',
				'--run',
				'--passWithNoTests',
				'--reporter=dot',
				...relativeFiles,
			],
			{
				cwd: packageRoot,
				stdio: ['ignore', 'pipe', 'pipe'],
				timeout: TEST_TIMEOUT_MS,
			},
		);
		return undefined;
	} catch (error) {
		if (error?.killed === true) return undefined; // timed out — skip rather than block
		return collectOutput(error);
	}
}

function collectOutput(error) {
	const output = [error?.stdout, error?.stderr]
		.map((stream) => stream?.toString?.() ?? '')
		.filter((text) => text.trim().length > 0)
		.join('\n');
	return output.length > 0 ? output : 'Command failed without output.';
}
