// Root barrel — re-exports tokens (NOT the stylesheet).
// Import the stylesheet separately via '@threadwick/core/tokens.css'.
// Brand + UI primitives are at their own subpaths ('/brand', '/ui' + the kit subpaths
// '/follow', '/interior', '/overview', '/marketplace-gate').
// The Pattern types live in @threadwick/types; a crochet domain package
// (@threadwick/domain) arrives when a second surface needs the stitch renderers.

export * from './tokens';
