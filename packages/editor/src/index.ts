// Internal aggregator — re-exports the chart + follow layer subpaths (the production surface) for
// the package's OWN modules and tests (store/files/editor-canvas and test/*). This file is NOT part
// of the public API: package.json `exports` has no "." entry, so external consumers import the layer
// subpaths directly — @threadwick/editor/chart, /follow, /fixtures, /browser.
//
// Sample data is intentionally NOT aggregated here — import it from @threadwick/editor/fixtures
// (or ./fixtures internally) so no barrel drags demo fixtures into a production graph.

export * from './chart';
export * from './follow';
