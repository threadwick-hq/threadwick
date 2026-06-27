/**
 * One-way mirror: upsert GitHub Issues from work/*.md frontmatter (read-only from git).
 *
 * Env:
 *   GITHUB_REPOSITORY   — owner/repo (set by Actions)
 *   GITHUB_TOKEN        — issues:write, project (if mirroring to a board)
 *   WORK_PROJECT_NUMBER — optional GitHub Project v2 number
 *   WORK_PROJECT_OWNER  — optional project owner (defaults to repo owner)
 *
 * Reads JSON array from stdin (output of `pnpm run work export --json`).
 */
const LABEL = 'tw-tracker';

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const projectNumber = process.env.WORK_PROJECT_NUMBER;
const projectOwner =
	process.env.WORK_PROJECT_OWNER ?? repo?.split('/')[0] ?? '';

if (!repo || !token) {
	console.error('sync-work-project: GITHUB_REPOSITORY and GITHUB_TOKEN required');
	process.exit(1);
}

const [owner, name] = repo.split('/');

const headers = {
	Accept: 'application/vnd.github+json',
	Authorization: `Bearer ${token}`,
	'X-GitHub-Api-Version': '2022-11-28',
};

const api = (path, opts = {}) =>
	fetch(`https://api.github.com${path}`, { ...opts, headers: { ...headers, ...(opts.headers ?? {}) } });

const jsonApi = (path, opts = {}) =>
	api(path, {
		...opts,
		headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
	});

const graphql = (query, variables) =>
	fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	}).then((r) => r.json());

async function readTasks() {
	const chunks = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}
	return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function listTrackedIssues() {
	const issues = [];
	let page = 1;
	for (;;) {
		const res = await api(
			`/repos/${owner}/${name}/issues?labels=${LABEL}&state=all&per_page=100&page=${page}`,
		);
		if (!res.ok) {
			throw new Error(`list issues: ${res.status} ${await res.text()}`);
		}
		const batch = await res.json();
		issues.push(...batch.filter((i) => !i.pull_request));
		if (batch.length < 100) {
			break;
		}
		page += 1;
	}
	const byId = new Map();
	for (const issue of issues) {
		const match = issue.title.match(/^(TW-\d+)\b/);
		if (match) {
			byId.set(match[1], issue);
		}
	}
	return byId;
}

function issueBody(task) {
	const lines = [
		`> Mirror of \`${task.file}\` — **do not edit here**; git \`work/\` is the source of truth.`,
		'',
		'| Field | Value |',
		'| --- | --- |',
		`| Status | ${task.status} |`,
		`| Type | ${task.type} |`,
		`| Phase | ${task.phase} |`,
		`| Priority | ${task.priority} |`,
		`| Area | ${task.area.join(', ')} |`,
	];
	if (task.assignee) lines.push(`| Assignee | ${task.assignee} |`);
	if (task.started) lines.push(`| Started | ${task.started} |`);
	if (task.completed) lines.push(`| Completed | ${task.completed} |`);
	if (task.pr) lines.push(`| PR | #${task.pr} |`);
	lines.push('', '## Acceptance', '');
	for (const item of task.acceptance) {
		lines.push(`- ${item}`);
	}
	return lines.join('\n');
}

function issueLabels(task) {
	return [
		LABEL,
		`tw-status-${task.status}`,
		`tw-priority-${task.priority}`,
		`tw-phase-${task.phase}`,
	];
}

async function ensureLabel(labelName) {
	const res = await jsonApi(`/repos/${owner}/${name}/labels`, {
		method: 'POST',
		body: JSON.stringify({
			name: labelName,
			color: 'ededed',
			description:
				labelName === LABEL
					? 'Mirrored from work/ — do not edit issues directly'
					: 'Auto-managed by the work-project-mirror workflow',
		}),
	});
	// 422 = label already exists
	if (res.ok || res.status === 422) {
		return;
	}
	throw new Error(
		`create label ${labelName}: ${res.status} ${await res.text()}`,
	);
}

async function ensureLabelsForTasks(tasks) {
	const names = new Set([LABEL]);
	for (const task of tasks) {
		for (const label of issueLabels(task)) {
			names.add(label);
		}
	}
	for (const labelName of names) {
		await ensureLabel(labelName);
	}
}

async function upsertIssue(task, existing) {
	const title = `${task.id}: ${task.title}`;
	const body = issueBody(task);
	const labels = issueLabels(task);
	const state = task.status === 'done' ? 'closed' : 'open';

	if (existing) {
		const res = await jsonApi(`/repos/${owner}/${name}/issues/${existing.number}`, {
			method: 'PATCH',
			body: JSON.stringify({ title, body, state, labels }),
		});
		if (!res.ok) {
			throw new Error(`update ${task.id}: ${res.status} ${await res.text()}`);
		}
		return res.json();
	}

	const res = await jsonApi(`/repos/${owner}/${name}/issues`, {
		method: 'POST',
		body: JSON.stringify({ title, body, labels }),
	});
	if (!res.ok) {
		throw new Error(`create ${task.id}: ${res.status} ${await res.text()}`);
	}
	return res.json();
}

async function resolveProjectId() {
	if (!projectNumber) {
		return undefined;
	}
	const data = await graphql(
		`query($login: String!, $number: Int!) {
      user(login: $login) { projectV2(number: $number) { id } }
      organization(login: $login) { projectV2(number: $number) { id } }
    }`,
		{ login: projectOwner, number: Number(projectNumber) },
	);
	return (
		data.data?.user?.projectV2?.id ??
		data.data?.organization?.projectV2?.id ??
		undefined
	);
}

async function addIssueToProject(projectId, issueNodeId) {
	const data = await graphql(
		`mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }`,
		{ projectId, contentId: issueNodeId },
	);
	if (data.errors?.length) {
		// Item may already be on the board — not fatal
		const msg = data.errors.map((e) => e.message).join('; ');
		if (!msg.includes('already exists')) {
			console.warn(`sync-work-project: project add: ${msg}`);
		}
	}
}

async function main() {
	const tasks = await readTasks();
	await ensureLabelsForTasks(tasks);
	const existing = await listTrackedIssues();
	const projectId = await resolveProjectId();
	if (projectNumber && !projectId) {
		console.warn(
			`sync-work-project: project ${projectOwner}#${projectNumber} not found — syncing issues only`,
		);
	}

	let created = 0;
	let updated = 0;

	for (const task of tasks) {
		const prev = existing.get(task.id);
		const issue = await upsertIssue(task, prev);
		if (prev) {
			updated += 1;
		} else {
			created += 1;
			if (projectId && issue.node_id) {
				await addIssueToProject(projectId, issue.node_id);
			}
		}
	}

	console.log(
		`sync-work-project: ${tasks.length} task(s) — ${created} created, ${updated} updated`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
