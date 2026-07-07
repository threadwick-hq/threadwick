// @threadwick/editor — the framework-agnostic chart-editor core.
// Public barrel: the DOM-free model, renderer, connectivity, symbols, geometry, palette,
// sample, and the read primitives (chainOrder, spacesForRound, chartToSVG, stitchToSVG,
// summarizeRound) the Studio editor and the Follow view consume.
//
// The name `Pattern` is deliberately NOT exported here: the chart model is `ChartPattern`,
// and the freed name is the Phase 7 seam — once model unification lands, this barrel
// re-exports the authoring `Pattern` from @threadwick/types under its own name.

export * from './colors';
export * from './connectivity';
export * from './decomposition';
export * from './external-follow';
export * from './follow-chart';
export * from './follow-ui';
export * from './geometry';
export * from './instructions';
export * from './model';
export * from './pattern-overview';
export * from './pattern-versioning';
export * from './pattern-view-mode';
export * from './progress';
export * from './project-overview';
export * from './render';
export * from './sample';
export * from './sample-marketplace-pattern';
export * from './sample-workbench-pattern';
export * from './symbols';
export * from './types';
export * from './util';
