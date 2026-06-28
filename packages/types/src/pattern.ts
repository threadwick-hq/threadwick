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
  workingCopy: WorkingCopyRef; // legacy branch/dirty placeholder — Phase 7 re-seats onto versioning
  versioning?: PatternVersioning; // §4.3 whole-pattern publish + linear versions (TW-035 anchor)
  lineage?: PatternLineage; // present when this pattern was Remixed from another (§4.3)
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
// Legacy placeholder — Phase 7 re-seats publish/draft onto Pattern.versioning.
export interface WorkingCopyRef {
  branch: string;
  dirty: boolean;
}

// ── Pattern versioning & publishing (§4.3 — read contract; Phase 7 re-seats data) ──
// A pattern is **published or private — whole-pattern**, never a mix. **Versions**
// are a **linear history**; at most **one working draft** sits atop the published
// history. Creating a new version on a published pattern → draft (yours only) →
// **Publish version** releases it. **Buy once = yours forever** — updates included,
// never re-charged; makers stay on their last-viewed version with a "newer version
// available" banner until they switch. **Unpublish** removes a pattern from the
// marketplace (no longer buyable/listed) but **keeps it in the library of everyone
// who already owns it.** **Remix** duplicates into a **new, private, editable**
// pattern carrying **lineage** ("remixed from {pattern} · {designer}").
//
// INVARIANTS (enforced at runtime in Phase 7, not by JSON Schema):
//   • `versions` is strictly linear (oldest → newest); no branches.
//   • At most one `status === 'draft'` and at most one `status === 'published'`.
//   • Superseded published versions become `outdated` when a newer version publishes.
//   • `visibility` is whole-pattern — never per-version public/private mix.
//   • `PatternOwnership` is viewer-specific read state, never stored on Pattern.

export type PatternVisibility = 'private' | 'published';

// Deliberately aligned with @threadwick/editor's VersionStatus so Phase 7 can
// migrate ProjectVersion → PatternVersion without a rename.
export type PatternVersionStatus = 'draft' | 'published' | 'outdated';

export interface PatternVersion {
  id: string;
  label: string; // "v1", "v4" — the version-switcher label (spec §4.1 rail tile)
  status: PatternVersionStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  publishedAt?: string; // ISO 8601 — absent until this version is published
}

export interface PatternVersioning {
  visibility: PatternVisibility; // whole-pattern Private/Public pill (§4.1)
  versions: PatternVersion[]; // linear history, oldest → newest
  activeVersionId: string; // version the interior is viewing/editing
  unpublishedAt?: string; // ISO 8601 — set when a published pattern is Unpublished (§4.3)
}

export interface PatternLineage {
  remixedFromPatternId: string; // → Pattern.id of the source
  remixedFromVersionId?: string; // → PatternVersion.id when the remix pins a source version
  remixedFromLabel: string; // denormalised title for "remixed from {pattern}"
  remixedFromDesigner?: string; // denormalised attribution for "· {designer}"
}

// Per-viewer entitlement read contract (§4.3 buy-once + §4.4 view-mode actions).
// NOT stored on Pattern — Phase 7 owns the write-side entitlement store.
export interface PatternOwnership {
  owned: boolean; // true when free or purchased — drives Start making vs Buy
  purchasedAt?: string; // ISO 8601 — buy-once; absent for free patterns (owned=true, no charge)
  lastViewedVersionId?: string; // maker's pinned version for the "newer version available" banner
  // INVARIANT: buy-once-yours-forever — once owned, entitlement persists across version
  // bumps; ownership is never re-charged when the designer publishes a new version.
}

// ── Maker plane: a Project is a MAKE that references one or more patterns ─────
// (Phase-7 increment #1 — "one model, not a fork.") Out of the authoring tree
// above, but kept here so the noun is unambiguous and shares the vocabulary.
//
// This is co-designed to converge WITH the editor's legacy authoring/version
// model (@threadwick/editor: Project owns ProjectVersion[]; a version owns
// patterns + resources) — NOT to compete. That `Project` is the AUTHORING plane
// (a different package); the `Project` below is the MAKER plane (a make over
// published patterns). They unify by REFERENCE, never by duplication: this model
// points at patterns by id/url and never re-models pattern content; its status
// union maps onto — but stays distinct from — the legacy VersionStatus; and it
// addresses progress through an OPAQUE `UnitAddress` so the decomposition engine
// (TW-027) and the progress machine (TW-028) land without reshaping anything
// here. Versioning/lineage is TW-035 (the `patternVersionId` seam); the Library
// stash is TW-044 (the `stashId` seam). Both are referenced by id only.

// ── Source-tagged pattern reference — discriminated on `source` (§5/§6) ──────
// A make references one or more patterns ACROSS CRAFTS, each with a SOURCE TAG.
// Internal (threadwick) refs point at a Pattern.id and carry full structured
// chart data → rich Follow. External refs (Ravelry / blog / your PDF) carry a
// url/file + a denormalised label and lack structured chart data, so Follow
// falls back to a plain checklist / open-source (spec §6, TW-032). The
// discriminant is `source`; narrow on it to know whether rich decomposition is
// even possible.
export type PatternSource = 'threadwick' | 'ravelry' | 'blog' | 'pdf';

// Fields every reference carries regardless of source. `id` is the reference's
// OWN id — stable within the project; progress and follow-mode key off it — and
// is distinct from the pattern it points at (two refs may aim at one pattern; an
// external ref may have no pattern id at all).
interface PatternReferenceBase {
  id: string;
  label: string; // denormalised display title — always present so the rail renders without resolving the ref
  craft?: Craft; // denormalised craft for the across-crafts list + the inclusion filter (§2)
  followMode?: FollowMode; // the maker's remembered choice (§6); omit → fall back to suggestedFollowMode / a default
  suggestedFollowMode?: FollowMode; // the pattern's suggested default (§6); kept separate so a reset never clobbers the maker's choice
  progress?: PatternProgress; // per-pattern progress (TW-028 owns the machine; this is its stored shape)
}

// Internal: points at a Threadwick Pattern by id → structured → rich Follow.
export interface ThreadwickPatternReference extends PatternReferenceBase {
  source: 'threadwick';
  patternId: string; // → Pattern.id (the authoring model in this file) — a live FK, never a denormalised copy
  patternVersionId?: string; // pin to a version once TW-035 lands; omit = latest owned (the Phase-7 lineage seam)
}

// External: a link or an uploaded file. No structured chart data → checklist.
// NOTE: `file` reuses ImageRef purely as a stored asset shape — for source 'pdf'
// its `src` holds a PDF href, not an image, so a renderer must not assume an
// image MIME. (A dedicated FileRef is deferred to TW-044's capability seam.)
export interface ExternalPatternReference extends PatternReferenceBase {
  source: 'ravelry' | 'blog' | 'pdf';
  url?: string; // a Ravelry/blog link, or a resolvable href to the uploaded file
  file?: ImageRef; // an uploaded PDF/scan as a stored asset (src holds the href)
  designer?: string; // denormalised attribution ("by @mara_makes") — no internal Pattern to read it from
  ravelryId?: string; // structured Ravelry pattern id when source==='ravelry' (the §0 metadata backbone)
}

export type PatternReference = ThreadwickPatternReference | ExternalPatternReference;

// ── Follow mode: the granularity the one-action model counts at (§6) ─────────
// Remembered as project state on each reference; the pattern can suggest a
// default. 'per-row' = one tap per round; 'pattern' = bite-size chunks;
// 'granular' = cluster-by-cluster; 'checklist' = the explicit external/
// unstructured fallback (a plain round list) so a surface never has to infer the
// fallback from `source`. INVARIANT (enforced at runtime by TW-028, not by the
// type): external refs use 'checklist'; the finer modes need structured charts.
export type FollowMode = 'per-row' | 'pattern' | 'granular' | 'checklist';

// ── Progress: the stored cursor TW-028's machine advances over Units ─────────
// TW-027 decomposes a round into Units at the chosen granularity; TW-028 builds
// the advance/undo/aggregate STATE MACHINE. TW-026 lands ONLY the cursor/progress
// TYPES it operates on. A Unit is addressed by an OPAQUE, engine-owned string so
// the address vocabulary (round/repeat/cluster position) is defined downstream in
// TW-027 without reshaping this contract — the seam that keeps "one model, not a
// fork." It is deliberately NOT a structured {round,repeat,cluster}: that would
// pre-empt TW-027 and break the moment a fourth coordinate is needed.
//
// STORED vs DERIVED — verified against the mockups: we persist only the cursor
// frontier, the count of completed units, and (as a cheap cache) the total at
// decomposition time. Every counter pill ("Round 3/5", "Rep 2/6", "St 14"), the
// "square 18 of 40" / "Squares left" / "45%" displays are DERIVED by
// re-decomposing at the cursor — never stored — so they can never drift from the
// chart. Overall project progress is likewise derived (see Project below).
export type UnitAddress = string; // opaque; the grammar is owned by TW-027's decomposition engine

export interface ProgressCursor {
  unitAddress: UnitAddress; // the next/current Unit the big action will complete
  followMode: FollowMode; // the granularity this cursor was produced at (Units are mode-specific, so Undo is exact)
}

// DONE-SIGNAL PRECEDENCE (cross-field — JSON-Schema can't express it; TW-028 enforces it at
// runtime): `completed` is the SOLE per-pattern authority for "is this ref finished?". When it is
// true, `cursor` and the unit counts are advisory only — a make can finish without ticking every
// Unit, so a finished ref may still carry a mid-round cursor. `unitsDone`/`unitsTotal` drive the
// display % (see above), never done-ness. `Project.status` is the independent PROJECT-level state:
// a make spans several refs, so it is not redundant with any single ref's `completed`.
export interface PatternProgress {
  cursor?: ProgressCursor; // omit before the first action / when finished
  unitsDone: number; // completed Units at cursor.followMode — the only stored progress scalar
  unitsTotal?: number; // total Units at decomposition time; omit when not yet decomposed (external/checklist) — a cache for cheap %
  completed?: boolean; // explicit done flag (see DONE-SIGNAL PRECEDENCE above; default false/absent)
  updatedAt?: string; // last advance/undo; ISO 8601 (matches the editor's createdAt/updatedAt convention) — also drives "Continue making"
}

// ── Maker status: the union + Ravelry mapping + quiet colours (§5) ───────────
// The maker plane's own state union. kebab-case to match the enum-value
// convention. Deliberately NOT the editor's VersionStatus (draft/published/
// outdated) — that is the AUTHORING plane; Phase 7 keeps both vocabularies.
export type MakerStatus = 'draft' | 'in-progress' | 'on-hold' | 'done' | 'frogged';
export type RavelryStatus = 'hibernating' | 'in-progress' | 'finished' | 'frogged';

// Threadwick → Ravelry on push (§5), a total map. Draft & On-hold both collapse
// to Hibernating; Done → Finished; In-progress / Frogged pass through.
export const MAKER_STATUS_TO_RAVELRY: Record<MakerStatus, RavelryStatus> = {
  draft: 'hibernating',
  'in-progress': 'in-progress',
  'on-hold': 'hibernating',
  done: 'finished',
  frogged: 'frogged',
};

// Ravelry → Threadwick on pull (§5), the lossy reverse. Hibernating is ambiguous
// (Draft + On-hold both produce it) → defaults BACK to 'on-hold' (not Draft —
// Draft is pre-make). Threadwick stays the source of truth on conflict.
export const RAVELRY_STATUS_TO_MAKER: Record<RavelryStatus, MakerStatus> = {
  hibernating: 'on-hold',
  'in-progress': 'in-progress',
  finished: 'done',
  frogged: 'frogged',
};

// Each state's quiet status-dot colour (§5: gray/blue/amber/green/red). A
// semantic token name — not a hex — so @threadwick/core / the design system owns
// the actual value. Derived off the union, never stored (no drift).
export type StatusColor = 'gray' | 'blue' | 'amber' | 'green' | 'red';
export const MAKER_STATUS_COLOR: Record<MakerStatus, StatusColor> = {
  draft: 'gray',
  'in-progress': 'blue',
  'on-hold': 'amber',
  done: 'green',
  frogged: 'red',
};

// ── Materials & notes rail: Yarns · Tools · Notes · Photos (§5) ──────────────
// The make REFERENCES the yarns/tools it uses — it does NOT own the stash. The
// full StashYarn/OwnedTool model is TW-044; here a used item carries a
// denormalised label (survives a stash unlink) plus an optional `stashId`
// "from stash" linkage seam (§5: the picker defaults to your owned stash and
// tags "from stash"). `stashId` absent = an ad-hoc item not (yet) in the Library.
// `acquired` backs the mockup's "in my stash" vs "need to buy" checklist.
export interface UsedYarn {
  id: string;
  label: string; // "Cotton DK · sage green" (denormalised so the rail renders standalone)
  stashId?: string; // → StashYarn.id when picked from the Library (TW-044 seam); present renders "in my stash"
  colorway?: string;
  quantity?: string; // free text ("2 skeins") — precise yardage tracking is TW-044's optional concern
  acquired?: boolean; // checklist state: true = have it, false/absent = "need to buy"
}
export interface UsedTool {
  id: string;
  label: string; // "Hook 4.0 mm"
  stashId?: string; // → OwnedTool.id when owned (TW-044 seam)
  acquired?: boolean;
}
export interface ProjectNote {
  id: string;
  title: string;
  body: RichText;
}
// Progress photos (§5). Reuses the authoring ImageRef → one image contract; an
// optional `patternRefId` pins a photo to one referenced pattern.
export interface ProjectPhoto {
  id: string;
  image: ImageRef;
  patternRefId?: string; // optionally attribute the photo to one PatternReference.id
}

// ── Custom sections: the power-user "+ Add section" escape hatch (§5) ────────
// Keeps beginners on rails (the four defaults above) while letting power users
// add lightweight custom entity types. Deliberately minimal — a titled list of
// label/body rows, NOT a typed-entity builder. Anything richer is out of scope
// for this anchor.
export interface CustomSectionEntry {
  id: string;
  label: string;
  body?: RichText;
}
export interface CustomSection {
  id: string;
  title: string; // the user-named section ("Buttons", "Embellishments"…)
  entries: CustomSectionEntry[];
}

// ── The Project (a make) ─────────────────────────────────────────────────────
// Vocabulary-compatible with the editor's authoring Project (string ids, ISO
// timestamps, a status union) so Phase 7 can unify the two without a rename.
// `createdAt`/`updatedAt` are OPTIONAL here (relaxed vs the editor's required
// pair) purely so the legacy {patternIds} upgrade fabricates no timestamps that
// would break a deep-equal re-run of the migration.
export interface Project {
  id: string;
  name: string;
  status: MakerStatus; // the pinned status-tile selector (§5); colour via MAKER_STATUS_COLOR
  patterns: PatternReference[]; // ≥0 source-tagged refs across crafts (replaces the legacy patternIds:string[] stub)
  summary?: RichText; // optional make-level description (mirrors Pattern.overview.summary)
  cover?: ImageRef; // identity-tile / lead progress photo
  photos?: ProjectPhoto[]; // the §5 Photos rail (progress-photo gallery)
  yarns?: UsedYarn[]; // §5 Materials & notes › Yarns (referenced, not the stash)
  tools?: UsedTool[]; // §5 Materials & notes › Tools
  notes?: ProjectNote[]; // §5 Materials & notes › Notes
  customSections?: CustomSection[]; // §5 "+ Add section" power-user entity types
  ravelryProjectId?: string; // sync linkage when this make is mirrored on Ravelry (status maps above)
  timeLoggedMs?: number; // §5 "Time logged" key-fact tile — session telemetry; TW-028 owns its writer (may relocate)
  lastWorkedAt?: string; // §5 "Last worked on" key-fact tile; ISO 8601 (else derive from max patterns[].progress.updatedAt)
  createdAt?: string; // ISO 8601 — matches the editor Project convention
  updatedAt?: string;
  // OVERALL (aggregated) progress and "Continue making" are DERIVED, not stored:
  //   • overall progress = Σ unitsDone / Σ unitsTotal over patterns[].progress (TW-028's reducer).
  //   • "Continue making" resolves to the most-recently-updated reference,
  //     i.e. the patterns[] entry with the max progress.updatedAt.
  // A stored aggregate would be a second source of truth that drifts.
}
