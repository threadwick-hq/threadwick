import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert, AlertDescription, AlertTitle,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator,
  Button,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Input,
  Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@threadwick/core/components';
import {
  PlusIcon, DownloadIcon, PdfIcon, DeleteIcon,
  CopyIcon, MoreIcon, EditIcon, YarnIcon, LinkIcon, NotesIcon, VariationIcon,
} from '../icons';
import { useStore } from '../useStore';
import { TopBarSlot } from '../components/TopBar';
import { Thumb } from '../components/Thumb';
import { VersionTag } from '../components/VersionTag';
import { statusLabel } from '../components/versionStatus';
import { exportProjectFile, printProject } from '@threadwick/editor/browser';
import { PATTERN_TYPES, activeVersion, isPlaceholderName } from '@threadwick/editor';
import type { ProjectVersion, Pattern, ResourceKind, Yarn, LinkRes, NoteRes, VariationRes } from '@threadwick/editor';

const RES_META: Record<ResourceKind, { title: string; add: string; empty: string; Icon: ComponentType }> = {
  yarns: { title: 'Yarns', add: 'Yarn', empty: 'Track the yarns you used — brand, weight, colour.', Icon: YarnIcon },
  links: { title: 'Links & videos', add: 'Link', empty: 'Tutorial videos and reference links.', Icon: LinkIcon },
  notes: { title: 'Notes & tips', add: 'Note', empty: 'Gotchas, gauge, hooks — anything worth remembering.', Icon: NotesIcon },
  variations: { title: 'Variations', add: 'Variation', empty: 'Colourways and tweaks of this project.', Icon: VariationIcon },
};

type ResItem = Yarn | LinkRes | NoteRes | VariationRes;
type ResForm = Partial<Yarn & LinkRes & NoteRes & VariationRes>;
type PatternForm = { name: string; type: 'granny' | 'round' | 'flat' };

type ConfirmState = {
  title: string;
  description?: string;
  okText: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function ProjectView() {
  const s = useStore();
  const prj = s.currentProject();
  const [newPat, setNewPat] = useState(false);
  const [res, setRes] = useState<{ kind: ResourceKind; item: ResItem | null } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const patForm = useForm<PatternForm>({ defaultValues: { type: 'granny' } });
  const resForm = useForm<ResForm>();

  useEffect(() => {
    if (newPat) patForm.reset({ name: '', type: 'granny' });
  }, [newPat, patForm]);

  useEffect(() => {
    if (res) {
      resForm.reset(res.item ?? (res.kind === 'links' ? { kind: 'video' } : {}));
    }
  }, [res, resForm]);

  if (!prj) return null;
  const ver = activeVersion(prj);
  const isDraft = ver.status === 'draft';
  const hasDraft = prj.versions.some((v) => v.status === 'draft');

  const publish = () => setConfirm({
    title: `Publish ${ver.label}?`,
    description: 'This becomes the live version. Any currently published version is marked Outdated.',
    okText: 'Publish',
    onConfirm: () => s.publishVersion(prj.id),
  });
  const discard = () => setConfirm({
    title: `Discard draft ${ver.label}?`,
    description: 'Unpublished changes in this draft will be removed. This can’t be undone.',
    okText: 'Discard draft',
    destructive: true,
    onConfirm: () => s.discardDraft(prj.id),
  });
  const startDraft = () => s.createDraft(prj.id);

  const createPattern = patForm.handleSubmit((v) => {
    const id = s.createPattern(prj.id, v.name?.trim() || 'Untitled pattern', v.type || 'granny');
    setNewPat(false);
    patForm.reset();
    if (id) s.openPattern(prj.id, id);
  });

  const openRes = (kind: ResourceKind, item: ResItem | null) => setRes({ kind, item });
  const saveRes = resForm.handleSubmit((v) => {
    if (!res) return;
    if (res.item) s.updateResource(prj.id, res.kind, res.item.id, v);
    else s.addResource(prj.id, res.kind, v);
    setRes(null);
  });

  const deleteProject = () => setConfirm({
    title: `Delete “${prj.name}”?`,
    description: 'Removes the project and all its patterns.',
    okText: 'Delete',
    destructive: true,
    onConfirm: () => s.deleteProject(prj.id),
  });

  return (
    <div className="home">
      <TopBarSlot>
        <Breadcrumb className="crumbs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <button className="crumb-link" onClick={() => s.goProjects()}>All projects</button>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className={'crumb-name' + (isPlaceholderName(prj.name) ? ' name-placeholder' : '')}>{prj.name || 'Untitled project'}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grow" />
        <Button variant="outline" onClick={() => exportProjectFile(prj)}><DownloadIcon /> Export</Button>
        <Button variant="outline" onClick={() => { void printProject(prj); }}><PdfIcon /> Printable PDF</Button>
        <Button variant="ghost" onClick={deleteProject}><DeleteIcon /> Delete</Button>
      </TopBarSlot>

      <div className="page">
        <span className="proj-name-wrap" data-value={prj.name}>
          <input
            className={'proj-name' + (isPlaceholderName(prj.name) ? ' name-placeholder' : '')}
            aria-label="Project name"
            value={prj.name}
            onChange={(e) => s.renameProject(prj.id, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          />
        </span>
        <textarea
          className="proj-desc"
          aria-label="Project description"
          value={prj.description}
          placeholder="Add a description…"
          rows={1}
          onChange={(e) => s.updateProject(prj.id, { description: e.target.value })}
        />

        <div className="version-bar">
          <span className="version-label">Version</span>
          <Select value={prj.activeVersionId} onValueChange={(id) => s.setActiveVersion(prj.id, id)}>
            <SelectTrigger className="version-select h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {prj.versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>{`${v.label} · ${statusLabel(v.status)}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <VersionTag status={ver.status} />
          <div className="grow" />
          {isDraft ? (<>
            {prj.versions.length > 1 && <Button size="sm" variant="outline" onClick={discard}>Discard draft</Button>}
            <Button size="sm" onClick={publish}>Publish</Button>
          </>) : (
            <Button size="sm" onClick={startDraft}><EditIcon /> {hasDraft ? 'Go to draft' : 'Edit as new draft'}</Button>
          )}
        </div>

        {!isDraft && (
          <Alert variant="info" className="version-readonly">
            <AlertTitle>You are viewing a read-only version</AlertTitle>
            <AlertDescription>{`Version ${ver.label} is ${statusLabel(ver.status).toLowerCase()} and cannot be edited.`}</AlertDescription>
          </Alert>
        )}

        <section className="section">
          <div className="section-head">
            <h4 className="section-title">Patterns</h4>
            {isDraft && <Button onClick={() => setNewPat(true)}><PlusIcon /> New pattern</Button>}
          </div>
          {ver.patterns.length === 0 ? (
            <div className="section-empty">
              <div className="empty-head">No patterns {isDraft ? 'yet' : 'in this version'}</div>
              {isDraft && <p className="muted">Add your first granny square to start charting.</p>}
              {isDraft && <Button className="mt-3" onClick={() => setNewPat(true)}><PlusIcon /> New pattern</Button>}
            </div>
          ) : (
            <div className="card-grid">
              {ver.patterns.map((pat: Pattern) => (
                <Card key={pat.id} className="proj-card">
                  <div className="card-cover" onClick={() => s.openPattern(prj.id, pat.id)}><Thumb pattern={pat} /></div>
                  <CardContent className="p-[14px]">
                    <div className="card-row">
                      <div className="card-main" role="button" tabIndex={0} onClick={() => s.openPattern(prj.id, pat.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.openPattern(prj.id, pat.id); } }}>
                        <CardTitle className="text-base font-semibold leading-snug">
                          <span className={isPlaceholderName(pat.name) ? 'name-placeholder' : undefined}>{pat.name}</span>
                        </CardTitle>
                        <CardDescription>{`${(PATTERN_TYPES[pat.type] || {}).name || pat.type} · ${pat.stitches.length} stitches`}</CardDescription>
                      </div>
                      {isDraft && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="iconSm" aria-label="Pattern actions" onClick={(e) => e.stopPropagation()}><MoreIcon /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => s.duplicatePattern(prj.id, pat.id)}><CopyIcon /> Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setConfirm({
                              title: `Delete pattern “${pat.name}”?`,
                              description: 'Removes the pattern from this project. This can’t be undone.',
                              okText: 'Delete',
                              destructive: true,
                              onConfirm: () => s.deletePattern(prj.id, pat.id),
                            })}><DeleteIcon /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head"><h4 className="section-title">Resources</h4></div>
          <div className="res-grid">
            {(Object.keys(RES_META) as ResourceKind[]).map((kind) => {
              const meta = RES_META[kind];
              const count = ver.resources[kind].length;
              return (
                <Card key={kind} className="res-col">
                  <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-2">
                    <CardTitle className="text-sm font-semibold">
                      <span className="res-title"><meta.Icon /> {meta.title}{count > 0 && <span className="res-count">{count}</span>}</span>
                    </CardTitle>
                    {isDraft && (
                      <Button size="sm" variant="outline" aria-label={`Add ${meta.add.toLowerCase()}`} title={`Add ${meta.add.toLowerCase()}`} onClick={() => openRes(kind, null)}>
                        <PlusIcon />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <ResourceList version={ver} kind={kind} readOnly={!isDraft} onEdit={(it) => openRes(kind, it)} onDelete={(id) => s.removeResource(prj.id, kind, id)} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      <Dialog open={newPat} onOpenChange={setNewPat}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New pattern</DialogTitle></DialogHeader>
          <form id="new-pattern-form" className="form-stack" onSubmit={createPattern}>
            <div className="form-field">
              <Label htmlFor="pattern-name">Name</Label>
              <Input id="pattern-name" placeholder="e.g. Centre motif" autoFocus {...patForm.register('name')} />
            </div>
            <fieldset className="form-field type-radios">
              <legend className="sr-only">Type</legend>
              <Label>Type</Label>
              {Object.values(PATTERN_TYPES).map((t) => (
                <label key={t.id} className="type-radio">
                  <input type="radio" value={t.id} disabled={!t.available} {...patForm.register('type')} />
                  <span><b>{t.name}</b><span className="muted"> — {t.worked}{t.available ? '' : ' · coming soon'}</span></span>
                </label>
              ))}
            </fieldset>
          </form>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" form="new-pattern-form">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!res} onOpenChange={(o) => { if (!o) setRes(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{res ? `${res.item ? 'Edit' : 'Add'} ${RES_META[res.kind].add.toLowerCase()}` : ''}</DialogTitle>
          </DialogHeader>
          <form id="resource-form" className="form-stack" onSubmit={saveRes}>
            {res?.kind === 'yarns' && <>
              <div className="form-field">
                <Label htmlFor="yarn-name">Name</Label>
                <Input id="yarn-name" placeholder="e.g. Cotton 8/4" autoFocus {...resForm.register('name')} />
              </div>
              <div className="form-field">
                <Label htmlFor="yarn-brand">Brand</Label>
                <Input id="yarn-brand" {...resForm.register('brand')} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <Label htmlFor="yarn-weight">Weight</Label>
                  <Input id="yarn-weight" placeholder="DK, worsted…" {...resForm.register('weight')} />
                </div>
                <div className="form-field">
                  <Label htmlFor="yarn-color">Colour name</Label>
                  <Input id="yarn-color" {...resForm.register('color')} />
                </div>
              </div>
              <div className="form-field">
                <Label htmlFor="yarn-hex">Swatch</Label>
                <Input id="yarn-hex" type="color" className="color-input" {...resForm.register('hex')} />
              </div>
              <div className="form-field">
                <Label htmlFor="yarn-notes">Notes</Label>
                <textarea id="yarn-notes" className="form-textarea" rows={2} {...resForm.register('notes')} />
              </div>
            </>}
            {res?.kind === 'links' && <>
              <div className="form-field">
                <Label htmlFor="link-title">Title</Label>
                <Input id="link-title" placeholder="e.g. Magic ring tutorial" autoFocus {...resForm.register('title')} />
              </div>
              <div className="form-field">
                <Label htmlFor="link-url">URL</Label>
                <Input id="link-url" placeholder="https://…" {...resForm.register('url')} />
              </div>
              <div className="form-field">
                <Label htmlFor="link-kind">Kind</Label>
                <Select value={resForm.watch('kind') ?? 'video'} onValueChange={(v) => resForm.setValue('kind', v as LinkRes['kind'])}>
                  <SelectTrigger id="link-kind"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>}
            {(res?.kind === 'notes' || res?.kind === 'variations') && <>
              <div className="form-field">
                <Label htmlFor="res-title">Title</Label>
                <Input id="res-title" autoFocus {...resForm.register('title')} />
              </div>
              <div className="form-field">
                <Label htmlFor="res-body">{res?.kind === 'notes' ? 'Note' : 'Details'}</Label>
                <textarea id="res-body" className="form-textarea" rows={4} {...resForm.register('body')} />
              </div>
            </>}
          </form>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" form="resource-form">{res?.item ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            {confirm?.description && <AlertDialogDescription>{confirm.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={confirm?.destructive ? 'destructive' : 'default'}
              onClick={() => { confirm?.onConfirm(); setConfirm(null); }}>{confirm?.okText ?? 'OK'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ResourceList({ version, kind, readOnly, onEdit, onDelete }: { version: ProjectVersion; kind: ResourceKind; readOnly?: boolean; onEdit: (it: ResItem) => void; onDelete: (id: string) => void; }) {
  const items = version.resources[kind] as ResItem[];
  if (!items.length) return <p className="muted small">{readOnly ? 'Nothing here in this version.' : RES_META[kind].empty}</p>;
  return (
    <div className="res-list">
      {items.map((it) => (
        <div key={it.id} className="res-item">
          <div className="res-text">{resourceLine(kind, it)}</div>
          {!readOnly && <div className="res-acts">
            <Button variant="ghost" size="iconSm" aria-label="Edit" onClick={() => onEdit(it)}><EditIcon /></Button>
            <Button variant="ghost" size="iconSm" aria-label="Delete" onClick={() => onDelete(it.id)}><DeleteIcon /></Button>
          </div>}
        </div>
      ))}
    </div>
  );
}

function resourceLine(kind: ResourceKind, it: ResItem) {
  if (kind === 'yarns') {
    const y = it as Yarn;
    const head = [y.name, y.brand].filter(Boolean).join(' · ') || 'Yarn';
    const sub = [y.weight, y.color].filter(Boolean).join(' · ');
    return <><b>{y.hex ? <span className="swatch" style={{ background: y.hex }} /> : null}{head}</b>{sub && <small>{sub}</small>}{y.notes && <small>{y.notes}</small>}</>;
  }
  if (kind === 'links') {
    const l = it as LinkRes;
    return <><b>{l.title || l.url || 'Link'}</b>{l.url && <a className="res-url" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>}</>;
  }
  const n = it as NoteRes;
  return <><b>{n.title || 'Untitled'}</b>{n.body && <small>{n.body}</small>}</>;
}
