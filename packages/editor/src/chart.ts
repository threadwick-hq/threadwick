// @threadwick/editor/chart — the framework-agnostic, DOM-free chart core: content model,
// renderer, connectivity, symbols, geometry, palette, codec, and utilities. The Studio editor
// and the Follow read-side both build on this layer.
//
// The name `Pattern` is deliberately NOT exported here: the chart model is `ChartPattern`, and
// the freed name is the Phase 7 seam — once model unification lands, this layer re-exports the
// authoring `Pattern` from @threadwick/types under its own name.

export * from './codec';
export * from './colors';
export * from './connectivity';
export * from './geometry';
export * from './model';
export * from './render';
export * from './symbols';
export * from './types';
export * from './util';
