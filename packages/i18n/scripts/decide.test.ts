import { describe, expect, it } from 'vitest';
import { decide } from './decide';

describe('decide', () => {
	it('translates when there is no existing record', () => {
		expect(decide('h1', undefined, undefined, false).status).toBe('translate');
	});

	it('keeps a record whose fingerprint still matches', () => {
		const result = decide(
			'h1',
			{ value: 'x', hash: 'h1', origin: 'machine' },
			undefined,
			false,
		);
		expect(result.status).toBe('keep');
		expect(result.record?.value).toBe('x');
	});

	it('adopts a seeded value with no fingerprint', () => {
		const result = decide(
			'h1',
			{ value: 'x', origin: 'seed' },
			undefined,
			false,
		);
		expect(result.status).toBe('adopt');
		expect(result.record?.hash).toBe('h1');
	});

	it('keeps a seed even when the source changed (re-fingerprinted, not re-translated)', () => {
		const result = decide(
			'h2',
			{ value: 'x', hash: 'h1', origin: 'seed' },
			undefined,
			false,
		);
		expect(result.status).toBe('adopt');
		expect(result.record?.value).toBe('x');
		expect(result.record?.hash).toBe('h2');
	});

	it('holds a human edit stale when the source changed', () => {
		const result = decide(
			'h2',
			{ value: 'x', hash: 'h1', origin: 'human' },
			undefined,
			false,
		);
		expect(result.status).toBe('stale');
		expect(result.record?.value).toBe('x');
	});

	it('re-translates a machine value when the source changed', () => {
		expect(
			decide(
				'h2',
				{ value: 'x', hash: 'h1', origin: 'machine' },
				undefined,
				false,
			).status,
		).toBe('translate');
	});

	it('lets a human override win over a current machine value', () => {
		const result = decide(
			'h1',
			{ value: 'x', hash: 'h1', origin: 'machine' },
			'O',
			false,
		);
		expect(result.status).toBe('override');
		expect(result.record?.value).toBe('O');
	});

	it('force re-translates even a current record', () => {
		expect(
			decide(
				'h1',
				{ value: 'x', hash: 'h1', origin: 'machine' },
				undefined,
				true,
			).status,
		).toBe('translate');
	});
});
