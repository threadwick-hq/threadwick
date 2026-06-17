// Threadwick — project content model (the canonical authoring vocabulary).
//
// Three nouns, no collisions:
//   Project   — a MAKE (maker plane); references one or more Patterns. See bottom of file.
//   Pattern   — the authored design a user works on in Studio. The sidebar root (this model).
//   Component — a worked unit of a pattern (motif / front / sleeve / head). Holds the charts.
//
// PLANE A (this file) = authoring artifacts the designer creates = the sidebar tree.
// PLANE B (comments, ratings, related, ads, PDF export, shop links) is NOT modeled here —
// the platform renders it around a published pattern, derived from Plane A.
//
// A JSON Schema mirror ships at ./pattern.schema.json as a fail-closed guardrail for agents.

export type Craft = 'crochet' | 'knit' | 'amigurumi' | 'tunisian' | 'other';
export type SkillLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced';

// Lightweight aliases — swap for the Studio's real types when wiring in.
export type RichText = string;
export interface ImageRef {
  src: string;
  alt?: string;
  caption?: string;
}
export interface ChartData {
  id: string;
} // produced by the Studio chart designer
export interface SchematicData {
  id: string;
}

// ── The pattern (authored root = the Studio sidebar) ─────────────────────────
export interface Pattern {
  id: string;
  craft: Craft;
  overview: Overview; // singleton root page
  components: Component[]; // COMPONENTS group (optional/implicit — see Component)
  materials: Material[]; // MATERIALS & REFERENCE › Yarns & hooks
  tutorials: Tutorial[]; // MATERIALS & REFERENCE › Tutorials & videos
  stitches: Stitch[]; // MATERIALS & REFERENCE › Special stitches
  notes: Note[]; // MATERIALS & REFERENCE › Notes & tips
  variations: Variation[]; // MATERIALS & REFERENCE › Variations
  workingCopy: WorkingCopyRef; // version/branch state — not content
}

// ── Overview: pattern identity + specs (fields, not sidebar nodes) ───────────
export interface Overview {
  name: string; // Title/Header
  summary?: RichText; // Introduction/Description
  cover?: ImageRef; // Hero image
  gallery?: ImageRef[]; // Photo gallery
  designer?: { name: string; bio?: RichText; url?: string }; // Designer/Author info (+ bio)
  skillLevel?: SkillLevel; // Difficulty/Skill level
  sizes?: SizeSpec[]; // Finished size + graded Sizing chart
  estimate?: { time?: string; yardage?: string }; // Estimated time/yardage
  license?: string; // Copyright/Terms (authored metadata)
  tags?: string[]; // pattern attributes/tags
}
export interface SizeSpec {
  label: string;
  measurements: Record<string, string>;
}

// ── COMPONENTS: each worked unit of the pattern + its artifact views ─────────
// Optional/implicit layer: a single-piece pattern (a hat, a cowl) has one component and the
// UI hides the grouping — charts hang straight off the pattern. The "Components" group only
// surfaces once components.length > 1 (sweater front/back/sleeves, amigurumi parts, a granny
// blanket's motifs). "motif" is just one kind of component, not the generic.
export type ComponentKind = 'motif' | 'panel' | 'part' | 'assembly';
export interface Component {
  id: string;
  name: string; // "Centre motif", "Front", "Head & body", "Assembly"
  kind?: ComponentKind; // omit for a plain/main component; 'assembly' = finishing
  artifacts: ComponentArtifact[];
}
export type ComponentArtifact = ChartArtifact | WrittenArtifact | SchematicArtifact;

export interface ChartArtifact {
  type: 'chart';
  id: string;
  kind?: 'stitch' | 'colorwork'; // colorwork carries a color key
  data: ChartData;
}
export interface WrittenArtifact {
  type: 'written';
  id: string;
  body: RichText; // rounds/rows collapsed into one body
  media?: ImageRef[]; // inline step-by-step / process photos
}
export interface SchematicArtifact {
  type: 'schematic';
  id: string;
  data: SchematicData;
}

// ── MATERIALS & REFERENCE ────────────────────────────────────────────────────
export type MaterialKind = 'yarn' | 'hook' | 'needle' | 'notion';
export interface Material {
  // Yarns & hooks
  id: string;
  kind: MaterialKind;
  label: string; // "Cotton 8/4 · Drops"
  brand?: string;
  weight?: string; // yarn weight or hook/needle size
  colorway?: string;
  quantity?: string;
  substitution?: string; // yarn-substitution note
}

export type TutorialKind = 'project' | 'technique';
export interface Tutorial {
  // Tutorials & videos
  id: string;
  kind: TutorialKind; // 'project' = whole make; 'technique' = one stitch
  label: string; // "Magic ring tutorial"
  url: string;
  provider?: 'youtube' | 'vimeo' | 'file';
  stitchId?: string; // link a 'technique' video to a Stitch
}

export type StitchKind = 'special' | 'abbreviation';
export interface Stitch {
  // Special stitches (incl. abbreviation glossary)
  id: string;
  kind: StitchKind;
  abbr: string; // "puff" / "sc"
  name: string; // "Puff stitch" / "single crochet"
  definition: RichText;
  chartId?: string; // optional symbol
  tutorialId?: string; // optional technique video
}

export type NoteKind = 'general' | 'gauge' | 'care' | 'safety' | 'colorchange' | 'stuffing';
export interface Note {
  // Notes & tips
  id: string;
  kind: NoteKind; // 'gauge' = the mockup's "Gauge & hook note"
  title: string;
  body: RichText;
}

export type VariationKind = 'size' | 'colorway' | 'yarn-weight' | 'technique' | 'difficulty';
export interface Variation {
  // Variations — alternate makes of the same pattern
  id: string;
  kind: VariationKind;
  label: string;
  description: RichText;
}

// ── Working copy (version control) ───────────────────────────────────────────
export interface WorkingCopyRef {
  branch: string;
  dirty: boolean;
}

// ── Maker plane: a Project is a MAKE that references one or more patterns ─────
// Out of the authoring tree above, but kept here so the noun is unambiguous.
export interface Project {
  id: string;
  name: string;
  patternIds: string[]; // the pattern(s) this make is worked from
  // maker-side state (yarn actually used, modifications, progress, photos) lives here.
}
