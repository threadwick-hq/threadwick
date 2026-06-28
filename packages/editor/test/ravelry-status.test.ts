import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
	makerStatusToRavelry,
	ravelryStatusDiffersFromMaker,
	ravelryStatusToMaker,
} from '@threadwick/types';

describe('Ravelry status mapping (§5)', () => {
	test('maker → Ravelry total map', () => {
		assert.equal(makerStatusToRavelry('draft'), 'hibernating');
		assert.equal(makerStatusToRavelry('in-progress'), 'in-progress');
		assert.equal(makerStatusToRavelry('on-hold'), 'hibernating');
		assert.equal(makerStatusToRavelry('done'), 'finished');
		assert.equal(makerStatusToRavelry('frogged'), 'frogged');
	});

	test('Ravelry → maker lossy reverse (Hibernating → on-hold)', () => {
		assert.equal(ravelryStatusToMaker('hibernating'), 'on-hold');
		assert.equal(ravelryStatusToMaker('in-progress'), 'in-progress');
		assert.equal(ravelryStatusToMaker('finished'), 'done');
		assert.equal(ravelryStatusToMaker('frogged'), 'frogged');
	});

	test('draft and on-hold both round-trip to on-hold from Ravelry', () => {
		assert.equal(ravelryStatusToMaker(makerStatusToRavelry('draft')), 'on-hold');
		assert.equal(ravelryStatusToMaker(makerStatusToRavelry('on-hold')), 'on-hold');
	});

	test('ravelryStatusDiffersFromMaker detects mapped changes', () => {
		assert.equal(ravelryStatusDiffersFromMaker('draft', 'hibernating'), true);
		assert.equal(ravelryStatusDiffersFromMaker('on-hold', 'hibernating'), false);
		assert.equal(ravelryStatusDiffersFromMaker('in-progress', 'in-progress'), false);
	});
});
