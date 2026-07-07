// Seed test wiring @threadwick/types into `turbo run test` (TW — migration test net).
// pattern.schema.json is a fail-closed guardrail mirroring src/pattern.ts (see its own
// top-of-file comment); this pins that it stays parseable, declares the schema dialect
// it's written against, and that its Pattern.required list matches the hand-maintained
// mirror below. It does NOT read the Pattern interface — schema-vs-type drift is only
// caught when this mirror is updated alongside the type (full codegen is parked until
// Phase 7 stabilizes the model).

import { describe, expect, it } from 'vitest';
import patternSchema from '../pattern.schema.json';

// Mirrors the non-optional (no `?`) fields on `Pattern` in src/pattern.ts. Keep this in
// sync by hand — it's the "cheap" half of the schema/type sync check; a JSON Schema
// can't be derived from the TS type at build time here.
const PATTERN_REQUIRED_FIELDS = [
	'id',
	'craft',
	'overview',
	'components',
	'materials',
	'tutorials',
	'stitches',
	'notes',
	'variations',
	'workingCopy',
].sort();

describe('pattern.schema.json', () => {
	it('parses as JSON and declares the draft-07 dialect', () => {
		expect(typeof patternSchema).toBe('object');
		expect(patternSchema.$schema).toBe(
			'http://json-schema.org/draft-07/schema#',
		);
	});

	it('validates either a Pattern or a maker-plane Project at the root', () => {
		expect(patternSchema.oneOf).toEqual([
			{ $ref: '#/definitions/Pattern' },
			{ $ref: '#/definitions/Project' },
		]);
	});

	it("Pattern's required list matches the non-optional fields on the Pattern type", () => {
		const pattern = patternSchema.definitions.Pattern;
		expect([...pattern.required].sort()).toEqual(PATTERN_REQUIRED_FIELDS);
		// `versioning` and `lineage` are optional on the TS type (`?`) and must stay
		// out of `required`, though they're still valid properties on the schema.
		expect(pattern.required).not.toContain('versioning');
		expect(pattern.required).not.toContain('lineage');
		expect(Object.keys(pattern.properties)).toEqual(
			expect.arrayContaining(['versioning', 'lineage']),
		);
	});
});
