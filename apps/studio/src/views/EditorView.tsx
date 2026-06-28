import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  Alert, AlertDescription, AlertTitle,
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator,
  Button,
  ColorPicker,
  confirm,
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Input,
  NumberInput,
  Segmented, SegmentedItem,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Switch,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';
import { useStore } from '../useStore';
import { CanvasView } from '../editor/CanvasView';
import { TopBarSlot } from '../components/TopBar';
import { Glyph } from '../components/Glyph';
import { statusLabel } from '../components/versionStatus';
import type { CanvasController, Mode } from '@threadwick/editor/browser';
import { STITCH_ORDER, START_ORDER, STITCHES, STITCH_KEYS, isStart, isRealStitch, defaultLen } from '@threadwick/editor';
import { chainOrder } from '@threadwick/editor';
import { usedTypes } from '@threadwick/editor';
import { exportPatternSVG, exportPatternPNG, printPattern } from '@threadwick/editor/browser';
import { summarizeRound } from '@threadwick/editor';
import { hasStart, isStartRow, isPlaceholderName } from '@threadwick/editor';
import { INK, ORIGIN, SPACE, SELECT, NEXT } from '@threadwick/editor';
import type { Stitch, StitchType } from '@threadwick/editor';

const KEY_TO_TYPE: Record<string, StitchType> = Object.fromEntries(
  Object.entries(STITCH_KEYS).map(([t, k]) => [k as string, t as StitchType]),
);

interface Chrome { mode: Mode; armed: StitchType; phase: 'base' | 'head'; nextId: string | null; transientMode: Mode | null; }

// Small wrapper so a control reads as one line: `<Tip label="…"><Button/></Tip>`.
// The child must be a single focusable element (Radix merges the trigger onto it).
function Tip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function EditorView() {
  const s = useStore();
  const pat = s.currentPattern();
  const proj = s.currentProject();
  const ver = s.currentVersion();
  const readOnly = !ver || ver.status !== 'draft'; // only draft versions are editable
  const ctrl = useRef<CanvasController | null>(null);
  const [chrome, setChrome] = useState<Chrome>({ mode: 'select', armed: 'dc', phase: 'base', nextId: null, transientMode: null });
  const [help, setHelp] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);

  const sync = () => {
    const c = ctrl.current; if (!c) return;
    setChrome({ mode: c.getMode(), armed: c.getArmed(), phase: c.getPhase(), nextId: c.getNextStitchId(), transientMode: c.getTransientMode() });
  };

  // keyboard, scoped to the editor
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    };
    const onKey = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const c = ctrl.current; if (!c) return;
      const meta = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (meta && k === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (meta && (k === 'y')) { e.preventDefault(); s.redo(); return; }
      if (meta && k === 's') { e.preventDefault(); return; }
      if (meta) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.deleteSelection(); return; }
      if (e.key === 'Escape') { if (!c.escape()) s.clearSelection(); return; }
      if (e.key === ' ') { e.preventDefault(); c.setTransientMode('pan'); return; } // hold Space = momentary pan
      if (k === 'v') { c.setMode('select'); return; }
      if (k === 'i') { c.setMode('insert'); return; }
      if (k === 'p') { c.setMode('pan'); return; }
      if (KEY_TO_TYPE[k]) {
        const cur = s.currentPattern();
        const onStartRow = !!cur && isStartRow(cur, cur.activeRound);
        if (!onStartRow) c.setArmed(KEY_TO_TYPE[k]!); // no normal stitches on the Start row
        return;
      }
      if (k === 'r') { s.rotateSelectionBy(e.shiftKey ? -15 : 15); return; }
      const n = e.shiftKey ? 8 : 2;
      if (e.key === 'ArrowLeft') { e.preventDefault(); s.moveSelectionBy(-n, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); s.moveSelectionBy(n, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); s.moveSelectionBy(0, -n); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); s.moveSelectionBy(0, n); }
    };
    const onUp = (e: KeyboardEvent) => { if (e.key === ' ') ctrl.current?.setTransientMode(null); };
    // releasing focus (alt-tab) while holding can swallow keyup — clear the hold
    const onBlur = () => ctrl.current?.setTransientMode(null);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur); };
  }, [s]);

  if (!pat) return null;
  const startRow = pat.rounds[0];
  const working = pat.rounds.slice(1);
  const onStart = isStartRow(pat, pat.activeRound);
  const started = hasStart(pat);
  // a momentarily-held mode (hold Space = pan) lights its button, only when it
  // differs from the mode you're actually in
  const heldMode = chrome.transientMode && chrome.transientMode !== chrome.mode ? chrome.transientMode : null;
  return (
    <TooltipProvider delayDuration={300}>
      <div className={'editor' + (readOnly ? ' has-banner' : '')}>
        <TopBarSlot>
          <Breadcrumb className="crumbs">
            <BreadcrumbList>
              <BreadcrumbItem>
                <button className="crumb-link" onClick={() => s.goProjects()}>All projects</button>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <button className={'crumb-link crumb-name' + (proj && isPlaceholderName(proj.name) ? ' name-placeholder' : '')} onClick={() => s.backToProject()}>{proj?.name ?? 'Project'}</button>
              </BreadcrumbItem>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <span className="crumb-leaf">
                  <span className="pat-name-wrap" data-value={pat.name}>
                    <input
                      className={'pat-name' + (isPlaceholderName(pat.name) ? ' name-placeholder' : '')}
                      aria-label="Pattern name"
                      value={pat.name}
                      readOnly={readOnly}
                      onChange={(e) => s.renamePattern(pat.id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    />
                  </span>
                  <span className="badge">Granny square</span>
                </span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="grow" />
          <Tip label="Undo (⌘Z)"><Button variant="ghost" size="iconSm" aria-label="Undo" disabled={!s.undoStack.length} onClick={() => s.undo()}><Icon name="undo" label="" /></Button></Tip>
          <Tip label="Redo (⇧⌘Z)"><Button variant="ghost" size="iconSm" aria-label="Redo" disabled={!s.redoStack.length} onClick={() => s.redo()}><Icon name="redo" label="" /></Button></Tip>
          <Tip label="How it works"><Button variant="ghost" size="iconSm" aria-label="How it works" onClick={() => setHelp(true)}><Icon name="help" label="" /></Button></Tip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label="Menu"><Icon name="open-menu" label="" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setExportOpen(true)}><Icon name="download" label="" /> Export pattern…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TopBarSlot>

        <div className="toolbar">
          {/* A held mode (e.g. hold Space for pan) lights that button as "held"
              in place — dashed + tinted — while the real selection stays put, so
              it's clearly different from a mode you clicked to keep, and changes
              directly between current and held (no sliding across the others).
              `held-<mode>` is generic: any future hold-to-use mode reuses it. */}
          <Segmented className={'mode-seg' + (heldMode ? ' holding held-' + heldMode : '')}
            aria-label="Editor mode"
            value={chrome.mode === 'insert' && readOnly ? 'select' : chrome.mode}
            onValueChange={(v) => ctrl.current?.setMode(v as Mode)}>
            {/* Tooltip wraps the inner glyph (as the AntD version did), NOT the toggle
                button — TooltipTrigger asChild would otherwise overwrite the item's own
                data-state="on" and kill the selected-pill styling. */}
            <SegmentedItem value="select" aria-label="Select"><Tip label="Select (V)"><span className="seg-icon"><Icon name="select-mode" label="" /></span></Tip></SegmentedItem>
            {!readOnly && <SegmentedItem value="insert" aria-label="Insert"><Tip label="Insert (I)"><span className="seg-icon"><Icon name="insert-mode" label="" /></span></Tip></SegmentedItem>}
            <SegmentedItem value="pan" aria-label="Pan"><Tip label="Pan (P) · or hold Space"><span className="seg-icon"><Icon name="pan-mode" label="" /></span></Tip></SegmentedItem>
          </Segmented>
          <div className="grow" />
          {!readOnly && <Tip label="Fan the current row out evenly"><Button variant="outline" size="sm" onClick={() => s.evenRound(pat.activeRound)}>Even out row</Button></Tip>}
          <div className="tool-view">
            <Tip label="Zoom out"><Button variant="ghost" size="iconSm" aria-label="Zoom out" onClick={() => ctrl.current?.zoomOut()}><Icon name="zoom-out" label="" /></Button></Tip>
            <Tip label="Fit to view"><Button variant="outline" size="sm" onClick={() => ctrl.current?.fit()}><Icon name="fit" label="" /> Fit</Button></Tip>
            <Tip label="Zoom in"><Button variant="ghost" size="iconSm" aria-label="Zoom in" onClick={() => ctrl.current?.zoomIn()}><Icon name="zoom-in" label="" /></Button></Tip>
          </div>
        </div>

        {readOnly && (
          <Alert variant="info" banner className="ed-readonly">
            <Icon name="view" label="" />
            <div className="ed-readonly-text">
              <AlertTitle>You are viewing a read-only version</AlertTitle>
              {ver && <AlertDescription>Version {ver.label} is {statusLabel(ver.status).toLowerCase()} and cannot be edited.</AlertDescription>}
            </div>
            {proj && <Button size="sm" className="ed-readonly-action" onClick={() => s.createDraft(proj.id)}><Icon name="edit" label="" /> Edit as new draft</Button>}
          </Alert>
        )}

        <div className={'ed-body' + (readOnly ? ' readonly' : '')}>
          {!readOnly && (
            <aside className="ed-left">
              <Palette pat={pat} chrome={chrome} ctrl={ctrl} />
              <HowItWorks />
            </aside>
          )}

          <div className="canvas-wrap">
            <CanvasView controllerRef={ctrl} onChange={sync} />
            {!readOnly && <StepToast chrome={chrome} onStart={onStart} started={started} />}
            {!readOnly && <Hint chrome={chrome} onStart={onStart} started={started} />}
          </div>

          <aside className="ed-right">
            <div className="rows-panel">
              <div className="panel-head"><div className="panel-title">Rows</div>{!readOnly && <Button variant="outline" size="sm" onClick={() => { s.addRound(); ctrl.current?.resetInsert(); }}><Icon name="add" label="" /> Row</Button>}</div>
              <div className="rows-list">
                {startRow && (
                  <div className={'row-item start-row' + (onStart ? ' on' : '')}>
                    <button className="row-main" onClick={() => { s.setActiveRound(startRow.id); ctrl.current?.resetInsert(); }}>
                      <b>Start</b><small>{pat.start ? STITCHES[pat.start].name : 'pick a starting stitch'}</small>
                    </button>
                  </div>
                )}
                {working.map((r) => {
                  const count = chainOrder(pat.stitches, r.id).filter((x) => !isStart(x.type)).length;
                  const summary = summarizeRound(pat, r.id);
                  return (
                    <div key={r.id} className={'row-item' + (r.id === pat.activeRound ? ' on' : '')}>
                      <button className="row-main" onClick={() => { s.setActiveRound(r.id); ctrl.current?.resetInsert(); }}>
                        <b>{r.name}</b><small>{count ? summary : 'empty'}</small>
                      </button>
                      {!readOnly && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" aria-label={`${r.name} options`}><Icon name="more" label="" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setRename({ id: r.id, name: r.name })}><Icon name="edit" label="" /> Rename</DropdownMenuItem>
                            {working.length > 1 && <DropdownMenuItem variant="destructive" onSelect={() => confirm({
                              title: `Delete ${r.name} and its stitches?`,
                              okText: 'Delete',
                              destructive: true,
                              onConfirm: () => { s.removeRound(r.id); ctrl.current?.resetInsert(); },
                            })}><Icon name="delete" label="" /> Delete row</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="ed-right-scroll">
              <div className="panel"><div className="panel-title">Selection</div><Inspector pat={pat} ctrl={ctrl} readOnly={readOnly} /></div>
              <div className="panel"><div className="panel-title">Legend</div><Legend pat={pat} /></div>
            </div>
          </aside>
        </div>

        <HelpModal open={help} onClose={() => setHelp(false)} />
        {exportOpen && <ExportModal pattern={pat} onClose={() => setExportOpen(false)} />}

        <Dialog open={!!rename} onOpenChange={(o) => { if (!o) setRename(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Rename row</DialogTitle></DialogHeader>
            <Input value={rename?.name ?? ''} autoFocus aria-label="Row name"
              onChange={(e) => setRename((r) => r && { ...r, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (rename) s.renameRound(rename.id, rename.name.trim() || 'Row'); setRename(null); } }} />
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={() => { if (rename) s.renameRound(rename.id, rename.name.trim() || 'Row'); setRename(null); }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// The collapse state is a local UI preference (not project data), so it lives
// in its own localStorage key and never enters the portable project format.
const HOWTO_KEY = 'threadwickstudio:ui:howto-collapsed';

function HowItWorks() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(HOWTO_KEY) !== '1'; } catch { return true; }
  });
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try { localStorage.setItem(HOWTO_KEY, next ? '0' : '1'); } catch { /* ignore quota */ }
  };
  return (
    <div className="howto-card">
      <button className="howto-toggle" onClick={toggle} aria-expanded={open}>
        <span className="panel-title">How it works</span>
        <Icon name="chevron-down" label="" className={'howto-chevron' + (open ? '' : ' closed')} />
      </button>
      <div className={'howto-body' + (open ? '' : ' closed')} aria-hidden={!open}>
        <ol className="howto">
          <li>Pick a <b>start</b>, then a <b>row</b>.</li>
          <li>Hit <b>Insert</b> (or a stitch key).</li>
          <li>Click a <b>base</b> — a stitch or an <span className="dot-space" /> space.</li>
          <li>Click again to set the <b>head</b>.</li>
          <li><kbd>Alt</kbd>/<kbd>⌘</kbd>-click a stitch to work out of it.</li>
        </ol>
      </div>
    </div>
  );
}

// The palette is contextual: on the Start row you pick a starting stitch; on any
// working row you pick a normal stitch.
function Palette({ pat, chrome, ctrl }: { pat: import('@threadwick/editor').Pattern; chrome: Chrome; ctrl: React.MutableRefObject<CanvasController | null>; }) {
  const s = useStore();
  const onStart = isStartRow(pat, pat.activeRound);
  if (onStart) {
    return (
      <div className="panel">
        <div className="panel-title">Start</div>
        <div className="chips">
          {START_ORDER.map((t) => (
            <button key={t} className={'chip' + (pat.start === t ? ' on' : '')} title={STITCHES[t].name}
              onClick={() => { s.setStart(t); ctrl.current?.setArmed('dc'); ctrl.current?.resetInsert(); }}>
              <Glyph type={t} /><span>{STITCHES[t].abbr}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="panel-title">Stitches</div>
      <div className="chips">
        {STITCH_ORDER.map((t) => (
          <button key={t} className={'chip' + (chrome.mode === 'insert' && chrome.armed === t ? ' on' : '')} title={STITCHES[t].name}
            onClick={() => ctrl.current?.setArmed(t)}>
            <Glyph type={t} /><span>{STITCHES[t].abbr}</span>
            {STITCH_KEYS[t] && <kbd>{STITCH_KEYS[t]!.toUpperCase()}</kbd>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Inspector({ pat, ctrl, readOnly }: { pat: import('@threadwick/editor').Pattern; ctrl: React.MutableRefObject<CanvasController | null>; readOnly?: boolean; }) {
  const s = useStore();
  const sel = [...s.selection];
  const items = sel.map((id) => pat.stitches.find((x) => x.id === id)).filter(Boolean) as Stitch[];
  if (!items.length) return (
    <div className="muted small insp-empty">
      <p>{readOnly ? <>This is a <b>read-only</b> version. Click a stitch to inspect it.</> : <>Nothing selected. In <b>Select</b> mode, click a stitch or drag a box.</>}</p>
      <p>Selected stitches reveal their framework:</p>
      <ul className="insp-legend">
        <li><span className="sw" style={{ background: ORIGIN }} /> origin</li>
        <li><span className="sw" style={{ background: SPACE }} /> base / space</li>
        <li><span className="sw" style={{ background: SELECT }} /> head</li>
      </ul>
    </div>
  );
  const first = items[0]!;
  const sameType = items.every((x) => x.type === first.type);
  const post = isRealStitch(first.type) && first.type !== 'ch';
  const chains = items.filter((x) => x.type === 'ch');
  const allAuto = chains.length > 0 && chains.every((x) => x.auto !== false);
  return (
    <div className="inspector">
      <p className="muted small">{items.length} stitch{items.length > 1 ? 'es' : ''} selected</p>
      <label className="field"><span>Type</span>
        {/* value is undefined when the selection mixes types so the "(mixed)" placeholder shows;
            onValueChange looks the string back up in STITCH_ORDER to narrow it to a StitchType. */}
        <Select disabled={readOnly} value={sameType ? first.type : undefined} onValueChange={(v) => { const t = STITCH_ORDER.find((x) => x === v); if (t) s.updateSelection({ type: t }); }}>
          <SelectTrigger aria-label="Stitch type"><SelectValue placeholder="(mixed)" /></SelectTrigger>
          <SelectContent>
            {STITCH_ORDER.map((t) => (
              <SelectItem key={t} value={t}><span className="type-opt"><Glyph type={t} size={16} /> {STITCHES[t].name}</span></SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="field"><span>Colour</span>
        <ColorPicker label="Stitch colour" value={first.color || INK} isCleared={!first.color} disabled={readOnly}
          onChange={(hex) => s.updateSelection({ color: hex })}
          onClear={() => s.updateSelection({ color: null })} />
      </label>
      {post && (
        <label className="field"><span>Length</span>
          <NumberInput label="Stitch length" min={10} max={70} disabled={readOnly}
            value={Math.round(first.len ?? defaultLen(first.type))}
            onChange={(v) => s.updateSelection({ len: v })} />
        </label>
      )}
      {chains.length > 0 && (
        <label className="field row"><span>Auto-position chain{chains.length > 1 ? 's' : ''}</span>
          <Switch disabled={readOnly} checked={allAuto} onCheckedChange={(v) => s.setChainAuto(v)} />
        </label>
      )}
      {!readOnly && items.length === 1 && first.round === pat.activeRound && (
        <label className="field row"><span>Corner mark</span>
          <Switch checked={s.isCornerMarked(first.id)} onCheckedChange={() => s.toggleCornerMark(first.id)} />
        </label>
      )}
      {!readOnly && items.length >= 2 && (
        <Button variant="outline" size="sm" onClick={() => s.setRepeatOnSelection()}>Mark repeat</Button>
      )}
      {!readOnly && <div className="insp-acts">
        <Tip label="Rotate −15°"><Button variant="outline" size="iconSm" aria-label="Rotate −15°" onClick={() => s.rotateSelectionBy(-15)}><Icon name="rotate-stitch-right" label="" className="icon-flip-h" /></Button></Tip>
        <Tip label="Rotate +15°"><Button variant="outline" size="iconSm" aria-label="Rotate +15°" onClick={() => s.rotateSelectionBy(15)}><Icon name="rotate-stitch-right" label="" /></Button></Tip>
        <Tip label="Flip the selection horizontally"><Button variant="outline" size="sm" onClick={() => s.mirrorSelection()}><Icon name="mirror-stitch" label="" /> Mirror</Button></Tip>
        {items.length === 1 && <Button variant="outline" size="sm" onClick={() => { ctrl.current?.setMode('insert'); ctrl.current?.setOrigin(first.id); }}><Icon name="set-origin" label="" /> Set as origin</Button>}
        <Button variant="outline" size="sm" className="insp-delete" onClick={() => s.deleteSelection()}><Icon name="delete-stitch" label="" /> Delete</Button>
      </div>}
    </div>
  );
}

function Legend({ pat }: { pat: import('@threadwick/editor').Pattern }) {
  const seen = usedTypes(pat.stitches);
  if (!seen.length) return <p className="muted small">Place a stitch to build the legend.</p>;
  return (
    <div className="legend">
      {seen.map((t) => (
        <div key={t} className="legend-row"><Glyph type={t} size={26} /><span>{STITCHES[t].name}{STITCHES[t].abbr ? ` (${STITCHES[t].abbr})` : ''}</span></div>
      ))}
    </div>
  );
}

function ExportModal({ pattern, onClose }: { pattern: import('@threadwick/editor').Pattern; onClose: () => void }) {
  const [format, setFormat] = useState<'svg' | 'png' | 'pdf'>('svg');
  const [title, setTitle] = useState(true);
  const [legend, setLegend] = useState(true);
  const [bg, setBg] = useState<'white' | 'transparent'>('white');
  const [scale, setScale] = useState(3);

  const doExport = () => {
    if (format === 'svg') exportPatternSVG(pattern, { title, legend, background: bg });
    else if (format === 'png') exportPatternPNG(pattern, { title, legend, background: bg, scale });
    else printPattern(pattern, { title, legend });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Export pattern</DialogTitle></DialogHeader>
        <div className="export-form">
          <label className="field"><span>Format</span>
            <Segmented block value={format} onValueChange={(v) => setFormat(v as 'svg' | 'png' | 'pdf')}>
              <SegmentedItem block value="svg">SVG</SegmentedItem>
              <SegmentedItem block value="png">PNG</SegmentedItem>
              <SegmentedItem block value="pdf">Printable PDF</SegmentedItem>
            </Segmented>
          </label>
          <label className="field check"><Switch checked={title} onCheckedChange={setTitle} /> Include title</label>
          <label className="field check"><Switch checked={legend} onCheckedChange={setLegend} /> Include legend</label>
          {format !== 'pdf' && (
            <label className="field"><span>Background</span>
              <Segmented value={bg} onValueChange={(v) => setBg(v as 'white' | 'transparent')}>
                <SegmentedItem value="white">White</SegmentedItem>
                <SegmentedItem value="transparent">Transparent</SegmentedItem>
              </Segmented>
            </label>
          )}
          {format === 'png' && (
            <label className="field"><span>Resolution</span>
              <Segmented value={String(scale)} onValueChange={(v) => setScale(Number(v))}>
                <SegmentedItem value="1">1×</SegmentedItem>
                <SegmentedItem value="2">2×</SegmentedItem>
                <SegmentedItem value="3">3×</SegmentedItem>
              </Segmented>
            </label>
          )}
          {format === 'pdf' && <p className="muted small">Print-ready — this pattern's chart, legend and written instructions. (For the whole project with QR-coded links, use “Printable PDF” on the project page.)</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={doExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepToast({ chrome, onStart, started }: { chrome: Chrome; onStart: boolean; started: boolean }) {
  if (onStart) return <div className="toast">Pick a starting stitch — magic ring, double ring, chain ring or slip knot</div>;
  if (!started) return <div className="toast">Pick a starting stitch first (the Start row)</div>;
  if (chrome.mode !== 'insert') return null;
  const name = STITCHES[chrome.armed]?.name || 'stitch';
  let text: string;
  if (chrome.armed === 'ch') text = `Click to place a ${name} flowing off the origin`;
  else if (chrome.phase === 'head') text = 'Click to set the head';
  else text = chrome.nextId ? `Inserting ${name} — pick a base` : `Pick a base for ${name} — a stitch or a space`;
  return <div className="toast">{text}</div>;
}

function Hint({ chrome, onStart, started }: { chrome: Chrome; onStart: boolean; started: boolean }) {
  let text: string;
  if (chrome.mode === 'pan') text = 'Pan mode — drag anywhere to move the canvas · scroll to zoom · press V or I to leave';
  else if (onStart || !started) text = 'Every stitch is worked out from the centre — pick a start to begin';
  else if (chrome.mode !== 'insert') text = 'Drag to move · drag empty space to box-select · scroll to zoom · hold Space to pan · press a stitch key to start';
  else if (chrome.armed === 'ch') text = 'Chains flow out of the origin (light blue) · Alt/⌘-click a stitch to work out of it · Esc to leave Insert';
  else if (chrome.phase === 'head') text = 'The bottom sits in the base; the top follows your cursor · Esc to redo the base';
  else text = 'Click a stitch head or an orange space · Alt/⌘-click a stitch to work out of it (insert after) · Esc to leave Insert';
  return <div className="hint">{text}</div>;
}

function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="help-modal max-w-[560px]">
        <DialogHeader><DialogTitle>Designing a granny square</DialogTitle></DialogHeader>
        <div className="help-body">
          <p>This editor recreates your crochet work. Every stitch <b>comes out of</b> an origin and is <b>worked into</b> a base — a stitch head or the space between two stitches. Build on even bases and the chart stays even, no symmetry maths required.</p>
          <ol className="help-steps">
            <li><b>Start:</b> pick a centre (magic ring, etc.). It drops into the Start row.</li>
            <li><b>Row:</b> choose which row you're working in the Rows panel (top-right).</li>
            <li><b>Insert:</b> press <kbd>I</kbd> or a stitch key (<kbd>D</kbd>=dc). The origin is <span className="sw" style={{ background: ORIGIN }} /> light blue.</li>
            <li><b>Base:</b> orange dots <span className="sw" style={{ background: SPACE }} /> mark spaces. Click a space or a stitch head, then click again to set the head.</li>
            <li><b>Chains:</b> flow off the origin in one click and auto-align evenly between neighbours.</li>
            <li><b>Insert after:</b> <kbd>Alt</kbd>/<kbd>⌘</kbd>-click a stitch to set it as origin; the next stitch turns <span className="sw" style={{ background: NEXT }} /> purple and everything after greys out.</li>
          </ol>
          <h4 className="help-subhead">Keys</h4>
          <table className="keys">
            <tbody>
              <tr><td><kbd>V</kbd> / <kbd>I</kbd></td><td>Select / Insert mode</td></tr>
              <tr><td><kbd>S H D T E</kbd></td><td>arm sc / hdc / dc / tr / dtr</td></tr>
              <tr><td><kbd>C</kbd> / <kbd>L</kbd></td><td>arm chain / slip stitch</td></tr>
              <tr><td><kbd>R</kbd> / <kbd>⇧R</kbd></td><td>rotate selection ±15°</td></tr>
              <tr><td>Arrows</td><td>nudge selection</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>step back / deselect</td></tr>
              <tr><td><kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd></td><td>undo / redo</td></tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
