// @threadwick/editor/chart — the framework-agnostic, DOM-free chart core: content model,
// renderer, connectivity, symbols, geometry, palette, codec, and utilities. The Studio editor
// and the Follow read-side both build on this layer.
//
// The chart model is `ChartPattern` (the editor's authoring envelope over @threadwick/types
// `ChartData`). Phase 7 model unification has landed, so this layer now re-exports the authoring
// `Pattern` from @threadwick/types under its own name — the freed-name seam is closed.

export * from './codec';
export * from './colors';
export * from './connectivity';
export * from './geometry';
export * from './model';
export * from './render';
export * from './symbols';
export * from './types';
export * from './util';
