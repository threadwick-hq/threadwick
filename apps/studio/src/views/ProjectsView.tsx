import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList,
  Button,
  Card, CardContent, CardDescription, CardTitle,
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Input,
  Label,
  confirm,
} from '@threadwick/core/components';
import {
  PlusIcon, ImportIcon, MoreIcon, DownloadIcon, CopyIcon, DeleteIcon,
} from '../icons';
import { useStore } from '../useStore';
import { TopBarSlot } from '../components/TopBar';
import { Thumb } from '../components/Thumb';
import { Glyph } from '../components/Glyph';
import { VersionTag } from '../components/VersionTag';
import { exportProjectFile, importProjectFile } from '@threadwick/editor/browser';
import { displayVersion, isPlaceholderName } from '@threadwick/editor';
import type { Project } from '@threadwick/editor';

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

type NewProjectForm = { name: string; description?: string };

export function ProjectsView() {
  const s = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<NewProjectForm>();
  const projects = s.state.library.projects;

  useEffect(() => {
    if (newOpen) reset({ name: '', description: '' });
  }, [newOpen, reset]);

  const create = handleSubmit((v) => {
    const id = s.createProject(v.name?.trim() || 'Untitled project');
    if (v.description?.trim()) s.updateProject(id, { description: v.description.trim() });
    setNewOpen(false);
    reset();
    s.openProject(id);
  });

  const onImport = async () => {
    const obj = await importProjectFile();
    if (obj) s.openProject(s.importProject(obj));
  };

  const confirmDelete = (p: Project) => confirm({
    title: `Delete “${p.name}”?`,
    description: 'This removes the project and all its patterns. This can’t be undone.',
    okText: 'Delete',
    destructive: true,
    onConfirm: () => s.deleteProject(p.id),
  });

  return (
    <div className="home">
      <TopBarSlot>
        <Breadcrumb className="crumbs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="crumb-here">All projects</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grow" />
        <Button variant="outline" onClick={onImport}><ImportIcon /> Import…</Button>
        <Button onClick={() => setNewOpen(true)}><PlusIcon /> New project</Button>
      </TopBarSlot>

      <div className="page">
        <p className="tagline">Your crochet workshop — one folder per project, for patterns, yarns, links and notes. Design granny squares the way you crochet them.</p>

        {projects.length ? (
          <div className="card-grid">
            {projects.map((p) => {
              const dv = displayVersion(p);
              return (
                <Card key={p.id} className="proj-card">
                  <div className="card-cover" onClick={() => s.openProject(p.id)}>
                    <Thumb pattern={dv.patterns[0]} />
                    <span className="card-status"><VersionTag status={dv.status} /></span>
                  </div>
                  <CardContent className="p-[14px]">
                    <div className="card-row">
                      <div className="card-main" role="button" tabIndex={0} onClick={() => s.openProject(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.openProject(p.id); } }}>
                        <CardTitle className="text-base font-semibold leading-snug">
                          <span className={isPlaceholderName(p.name) ? 'name-placeholder' : undefined}>{p.name}</span>
                        </CardTitle>
                        <CardDescription>{`${dv.label} · ${dv.patterns.length} pattern${dv.patterns.length === 1 ? '' : 's'} · ${fmtDate(p.updatedAt)}`}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="iconSm" aria-label="Project actions" onClick={(e) => e.stopPropagation()}><MoreIcon /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => exportProjectFile(p)}><DownloadIcon /> Export to file</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => s.duplicateProject(p.id)}><CopyIcon /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => confirmDelete(p)}><DeleteIcon /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="empty-wrap">
            <div className="empty-art"><Glyph type="dc" size={56} /><Glyph type="mr" size={56} /><Glyph type="tr" size={56} /></div>
            <h2>Start your first project</h2>
            <p className="muted">A project is your folder for everything: patterns, the yarns you used, video links and notes.</p>
            <Button size="lg" className="mt-4" onClick={() => setNewOpen(true)}><PlusIcon /> New project</Button>
          </div>
        )}
      </div>

      <footer className="home-foot">Saved in your browser · export any project to a file to back it up or share it</footer>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
          <form id="new-project-form" className="form-stack" onSubmit={create}>
            <div className="form-field">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" placeholder="e.g. Spring blanket" autoFocus {...register('name')} />
            </div>
            <div className="form-field">
              <Label htmlFor="project-desc">Description</Label>
              <textarea id="project-desc" className="form-textarea" rows={2} placeholder="Optional" {...register('description')} />
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit" form="new-project-form">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
