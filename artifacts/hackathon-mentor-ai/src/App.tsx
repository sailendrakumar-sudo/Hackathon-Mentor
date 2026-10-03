import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useRoute } from 'wouter';
import {
  Activity as ActivityIcon, ArrowLeft, ArrowRight, ArrowUpRight, Blocks, Copy,
  Check, CheckCircle2, Clock3, Code2, Compass, Cpu, FileText, Flag, FolderKanban,
  Gauge, Hammer, Lightbulb, ListChecks, LoaderCircle, Menu, MessageSquareText, MoreHorizontal,
  Plus, Presentation, Rocket, Settings2, ShieldAlert, Sparkles, Target, Trash2, X,
} from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetProjectQueryKey, getHealthCheckQueryKey, getListActivityQueryKey,
  getListProjectsQueryKey, getListTasksQueryKey, useCreateProject, useCreateTask, useDeleteProject,
  useDeleteTask, useGenerateMentorResponse, useGetDashboard, useGetProject, useHealthCheck,
  useListActivity, useListProjects, useListTasks, useUpdateProject, useUpdateTask,
} from '@workspace/api-client-react';
import type { MentorRequestAction, MentorResult, Project, ProjectInput, Task, TaskInput } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const sections = [
  ['Overview', 'overview', Compass], ['Problem', 'problem', Target], ['Ideas', 'ideas', Lightbulb],
  ['MVP', 'mvp', Blocks], ['Tech Stack', 'tech-stack', Code2], ['Architecture', 'architecture', Cpu],
  ['Build Plan', 'build-plan', ListChecks], ['AI Lab', 'ai-lab', Sparkles], ['Validation', 'validation', ShieldAlert],
  ['Demo', 'demo', Presentation], ['Pitch', 'pitch', MessageSquareText], ['Presentation', 'presentation', FileText],
  ['Judge Simulator', 'judge-simulator', Gauge], ['Evaluation', 'evaluation', Flag], ['Settings', 'settings', Settings2],
] as const;
type SectionSlug = typeof sections[number][1];
type CoachAction = { action: MentorRequestAction; title: string };

const coachActions: Record<string, CoachAction[]> = {
  problem: [{ action: 'problem_analysis', title: 'Analyze the problem' }],
  ideas: [
    { action: 'idea_generation', title: 'Generate directions' },
    { action: 'idea_comparison', title: 'Compare ideas' },
    { action: 'critical_feature_review', title: 'Review critical features' },
  ],
  mvp: [{ action: 'mvp_design', title: 'Shape the MVP' }],
  'tech-stack': [{ action: 'tech_stack', title: 'Review the tech stack' }],
  architecture: [
    { action: 'architecture', title: 'Review architecture' },
    { action: 'ai_architecture', title: 'Review AI architecture' },
  ],
  'build-plan': [{ action: 'build_plan', title: 'Plan the build' }],
  'ai-lab': [
    { action: 'coding_help', title: 'Get coding help' },
    { action: 'debugging', title: 'Debug a problem' },
    { action: 'ai_architecture', title: 'Review AI architecture' },
    { action: 'critical_feature_review', title: 'Review critical features' },
  ],
  validation: [
    { action: 'validation', title: 'Plan validation' },
    { action: 'competitors', title: 'Map alternatives' },
    { action: 'risk_analysis', title: 'Check project risks' },
  ],
  demo: [{ action: 'demo_strategy', title: 'Plan the demo' }],
  pitch: [
    { action: 'pitch_30', title: '30-second pitch' },
    { action: 'pitch_60', title: '60-second pitch' },
    { action: 'pitch_180', title: '3-minute pitch' },
    { action: 'pitch_300', title: '5-minute pitch' },
  ],
  presentation: [{ action: 'presentation', title: 'Plan the presentation' }],
  'judge-simulator': [
    { action: 'judge_questions', title: 'Practice judge questions' },
    { action: 'judge_feedback', title: 'Get judge-style feedback' },
  ],
  evaluation: [{ action: 'evaluation', title: 'Review the project' }],
};

function App() {
  return <QueryClientProvider client={queryClient}><Switch>
    <Route path="/" component={DashboardPage} />
    <Route path="/projects/new" component={NewProjectPage} />
    <Route path="/projects/:id/:section?"><WorkspacePage /></Route>
    <Route component={NotFound} />
  </Switch></QueryClientProvider>;
}

function AppFrame({ children, activeId }: { children: ReactNode; activeId?: string }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [location] = useLocation();
  const onWorkspace = location.startsWith('/projects/') && location !== '/projects/new';
  return <div className="app-layout">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <Link href="/" className="brand" aria-label="Hackathon Mentor AI home">
        <span className="brand-mark"><span></span><span></span><span></span></span>
        <span className="brand-words"><b>build<span>wise</span></b><small>HACKATHON WORKSPACE</small></span>
      </Link>
      <div className="side-caption">WORKSPACE</div>
      <Link href="/" className={`side-link ${!onWorkspace ? 'side-active' : ''}`} data-testid="nav-dashboard">
        <FolderKanban size={17} /><span>Projects</span><span className="side-shortcut">⌘ 1</span>
      </Link>
      {activeId && <div className="side-project">
        <span className="project-pin"></span><span className="side-project-name">Current project</span>
      </div>}
      <div className="side-bottom">
        <div className="mentor-note"><div className="mentor-icon"><MessageSquareText size={16} /></div>
          <p>Build the smallest thing that proves the biggest thing.</p><span>YOUR MENTOR, IN YOUR CORNER</span>
        </div>
        <div className="side-user"><div className="user-initials">Y</div><div><b>Your workspace</b><small>Student builder</small></div><MoreHorizontal size={17} /></div>
      </div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-shell">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button>
        <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><b>{onWorkspace ? 'Project room' : location === '/projects/new' ? 'New project' : 'Projects'}</b></div>
        <div className="topbar-right"><span className="health-pulse"></span><span>Workspace online</span><span className="topbar-divider"></span><span className="topbar-date">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
      </header>
      {children}
    </main>
  </div>;
}

function DashboardPage() {
  const queryClient = useQueryClient();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const projects = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const activity = useListActivity({ limit: 8 }, { query: { queryKey: getListActivityQueryKey({ limit: 8 }) } });
  const deleteProject = useDeleteProject();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const summary = dashboard.data;
  const projectList = projects.data ?? summary?.recentProjects ?? [];
  const filtered = projectList.filter(project => `${project.name} ${project.hackathonName}`.toLowerCase().includes(search.toLowerCase()));
  const open = summary?.tasksOpen ?? 0;
  const done = summary?.tasksDone ?? 0;
  const completion = open + done ? Math.round(done / (open + done) * 100) : 0;

  const removeProject = (project: Project) => {
    if (!window.confirm(`Delete “${project.name}” and its tasks? This cannot be undone.`)) return;
    deleteProject.mutate({ id: project.id }, { onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey({ limit: 8 }) });
    }, onError: () => setError('Could not delete the project. Try again.') });
  };
  return <AppFrame><div className="page-content page-enter">
    <section className="dashboard-hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"></span> YOUR BUILD SEASON</div>
        <h1>Big idea.<br /><em>Real build.</em></h1>
        <p>Make the deadline. Keep the scope honest. Give the judges something worth remembering.</p>
        <Link href="/projects/new" className="button button-accent" data-testid="button-new-project"><Plus size={17} /> Start a project <ArrowRight size={16} /></Link>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="visual-grid"></div><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
        <div className="orbit-core"><Rocket size={32} strokeWidth={1.4} /></div>
        <div className="orbit-tag tag-top"><span>01</span> IDEA → MVP</div>
        <div className="orbit-tag tag-bottom"><span className="tag-dot"></span> BUILD MODE</div>
        <span className="visual-cross cross-one">+</span><span className="visual-cross cross-two">+</span>
      </div>
      <div className="hero-index"><span>01</span><span className="index-rule"></span><span>03</span></div>
    </section>

    <div className="stats-strip">
      <Stat label="PROJECTS" value={summary?.projectCount} loading={dashboard.isLoading} accent="sage" />
      <Stat label="IN MOTION" value={summary?.activeProjectCount} loading={dashboard.isLoading} accent="orange" />
      <Stat label="TASKS SHIPPED" value={done} loading={dashboard.isLoading} accent="blue" />
      <div className="stat-item progress-stat"><div className="stat-label">OVERALL PROGRESS</div><div className="stat-bottom"><strong>{dashboard.isLoading ? '—' : `${completion}%`}</strong><div className="mini-progress"><span style={{ width: `${completion}%` }} /></div></div></div>
    </div>

    <section className="section-block">
      <div className="section-heading">
        <div><div className="eyebrow"><span className="eyebrow-line"></span> THE WORKBENCH</div><h2>Your projects<span className="heading-count">{projectList.length}</span></h2></div>
        <div className="project-tools"><label className="searchbox"><span className="sr-only">Search projects</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a project..." data-testid="input-search-projects" /><span className="search-glyph">⌕</span></label>
          <Link href="/projects/new" className="button button-dark button-small" data-testid="button-add-project"><Plus size={15} /> New project</Link>
        </div>
      </div>
      {error && <div className="inline-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      {projects.isLoading && <div className="project-grid"><SkeletonCard /><SkeletonCard /></div>}
      {projects.isError && <div className="notice-card"><div><b>Projects didn’t load.</b><p>Check your connection and give it another try.</p></div><button className="button button-outline button-small" onClick={() => projects.refetch()}>Retry</button></div>}
      {!projects.isLoading && !projects.isError && filtered.length > 0 && <div className="project-grid">
        {filtered.map((project, index) => <ProjectCard key={project.id} project={project} index={index} onDelete={removeProject} deleting={deleteProject.isPending} />)}
      </div>}
      {!projects.isLoading && !projects.isError && projectList.length === 0 && <div className="empty-projects"><div className="empty-graphic"><Blocks size={27} /><span>+</span></div><div className="eyebrow"><span className="eyebrow-line"></span> CLEAN SLATE</div><h3>Every great build starts somewhere.</h3><p>Put the hackathon details in one place. Then we’ll turn them into a plan your team can actually finish.</p><Link href="/projects/new" className="button button-accent"><Plus size={16} /> Create your first project</Link></div>}
      {!projects.isLoading && projectList.length > 0 && filtered.length === 0 && <div className="empty-search">No projects match “{search}”. <button onClick={() => setSearch('')}>Clear search</button></div>}
    </section>

    <section className="dashboard-lower">
      <div className="lower-panel deadlines-panel"><div className="panel-head"><div><div className="eyebrow">KEEP THE CLOCK HONEST</div><h3>Next deadlines</h3></div><Clock3 size={18} /></div>
        {dashboard.isLoading ? <div className="skeleton-line" /> : summary?.upcomingDeadlines?.length ? <div className="deadline-list">
          {summary.upcomingDeadlines.slice(0, 4).map(item => <Link href={`/projects/${item.projectId}`} key={item.projectId} className="deadline-row" data-testid={`deadline-${item.projectId}`}>
            <span className="deadline-marker"></span><span className="deadline-name">{item.projectName}</span><span className={`deadline-days ${item.daysRemaining <= 2 ? 'urgent' : ''}`}>{item.daysRemaining === 0 ? 'Today' : `${item.daysRemaining}d left`}</span><ArrowUpRight size={14} /></Link>)}
        </div> : <p className="muted-copy">No deadlines on the board yet. Add an end date to a project to see it here.</p>}
      </div>
      <div className="lower-panel activity-panel"><div className="panel-head"><div><div className="eyebrow">SMALL WINS ADD UP</div><h3>Recent activity</h3></div><ActivityIcon size={18} /></div>
        {activity.isLoading ? <div className="activity-skeleton"><span /><span /><span /></div> : activity.isError ? <div className="activity-error">Activity isn’t available right now.</div> : activity.data?.length ? <div className="activity-list">
          {activity.data.slice(0, 4).map((entry, index) => <div className="activity-row" key={entry.id}><span className={`activity-icon activity-${entry.action}`}><ActivityGlyph action={entry.action} /></span><div className="activity-text"><b>{entry.message}</b><span>{entry.projectName} · {relativeTime(entry.createdAt)}</span></div>{index === 0 && <span className="activity-new">LATEST</span>}</div>)}
        </div> : <p className="muted-copy">Your project milestones and task updates will show up here.</p>}
      </div>
    </section>
    <footer className="page-footer"><span>BUILDWISE / A PRACTICAL MENTOR FOR THE BUILD AHEAD</span><span>{health.data?.status === 'ok' ? 'SYSTEMS READY' : health.isError ? 'HEALTH CHECK UNAVAILABLE' : 'CHECKING SYSTEMS'}</span></footer>
  </div></AppFrame>;
}

function Stat({ label, value, loading, accent }: { label: string; value?: number; loading: boolean; accent: string }) {
  return <div className={`stat-item stat-${accent}`}><div className="stat-label">{label}</div><div className="stat-bottom"><strong>{loading ? '—' : value ?? 0}</strong><span className="stat-mark"></span></div></div>;
}

function ProjectCard({ project, index, onDelete, deleting }: { project: Project; index: number; onDelete: (p: Project) => void; deleting: boolean }) {
  const { data: tasks, isLoading } = useListTasks(project.id, { query: { queryKey: getListTasksQueryKey(project.id) } });
  const taskList = tasks ?? [];
  const complete = taskList.filter(task => task.status === 'done').length;
  const percentage = taskList.length ? Math.round(complete / taskList.length * 100) : 0;
  const days = project.endAt ? daysUntil(project.endAt) : null;
  return <article className={`project-card card-tone-${index % 3}`} data-testid={`card-project-${project.id}`}>
    <div className="card-topline"><span className={`stage-badge stage-${project.stage}`}>{stageName(project.stage)}</span><button className="icon-button card-more" aria-label={`Delete ${project.name}`} onClick={() => onDelete(project)} disabled={deleting} data-testid={`button-delete-project-${project.id}`}><MoreHorizontal size={18} /></button></div>
    <Link href={`/projects/${project.id}`} className="project-card-link" data-testid={`link-project-${project.id}`}>
      <div className="project-card-title"><h3>{project.name}</h3><ArrowUpRight size={17} /></div>
      <div className="hackathon-label">{project.hackathonName}</div>
      {project.problemStatement && <p className="project-excerpt">{project.problemStatement}</p>}
      <div className="card-meta"><span className="team-meta"><span className="avatar-stack">{(project.teamMembers ?? []).slice(0, 3).map((member, i) => <span key={`${member}-${i}`} title={member}>{initials(member)}</span>)}{!project.teamMembers?.length && <span>+</span>}</span>{project.teamSize} {project.teamSize === 1 ? 'builder' : 'builders'}</span>
        {days !== null && <span className={`card-deadline ${days <= 2 ? 'urgent' : ''}`}><Clock3 size={13} />{days < 0 ? 'Ended' : days === 0 ? 'Today' : `${days} days`}</span>}</div>
      <div className="card-progress-label"><span>{isLoading ? 'Loading tasks' : `${complete} of ${taskList.length} tasks done`}</span><span>{isLoading ? '—' : `${percentage}%`}</span></div>
      <div className="card-progress"><span style={{ width: `${percentage}%` }} /></div>
      <div className="card-footer"><span>OPEN WORKSPACE</span><span className="card-arrow"><ArrowRight size={15} /></span></div>
    </Link>
  </article>;
}

function SkeletonCard() { return <div className="skeleton-card"><div className="skeleton-line short" /><div className="skeleton-line wide" /><div className="skeleton-line medium" /><div className="skeleton-line wide" /></div>; }

function NewProjectPage() {
  const createProject = useCreateProject();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', hackathonName: '', theme: '', startAt: '', endAt: '', problemStatement: '', judgingCriteria: '', teamSize: '2', teamMembers: '', concept: '', budget: '' });
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const data: ProjectInput = {
      name: form.name.trim(), hackathonName: form.hackathonName.trim(), theme: form.theme.trim() || null,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      problemStatement: form.problemStatement.trim() || null,
      judgingCriteria: splitLines(form.judgingCriteria), teamSize: Math.max(1, Number(form.teamSize) || 1),
      teamMembers: splitLines(form.teamMembers), concept: form.concept.trim() || null,
      budget: form.budget ? Number(form.budget) : null,
    };
    createProject.mutate({ data }, { onSuccess: project => {
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey({ limit: 8 }) });
      setLocation(`/projects/${project.id}`);
    }, onError: () => setFormError('The project could not be saved. Check your connection and try again.') });
  };
  return <AppFrame><div className="page-content page-enter new-project-page">
    <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to projects</Link>
    <div className="form-intro"><div className="eyebrow"><span className="eyebrow-line"></span> START WITH THE CONSTRAINTS</div><h1>Set up your<br /><em>build room.</em></h1><p>Get the real-world details down first. A good plan starts with the rules of the game.</p></div>
    <form className="project-form" onSubmit={submit}>
      <div className="form-section"><div className="form-section-index">01</div><div className="form-section-body"><h2>The event</h2><p>Name the project and the room you’re building in.</p>
        <div className="form-grid"><Field label="Project name" required><input required maxLength={120} value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Quiet Hours" data-testid="input-project-name" /></Field>
          <Field label="Hackathon" required><input required maxLength={160} value={form.hackathonName} onChange={e => update('hackathonName', e.target.value)} placeholder="e.g. Civic Tech Weekend" data-testid="input-hackathon-name" /></Field>
          <Field label="Theme or track" wide><input value={form.theme} onChange={e => update('theme', e.target.value)} placeholder="What are the organizers asking you to build around?" data-testid="input-theme" /></Field>
        </div></div></div>
      <div className="form-section"><div className="form-section-index">02</div><div className="form-section-body"><h2>Time & team</h2><p>Deadlines aren’t suggestions. Give the plan an honest boundary.</p>
        <div className="form-grid"><Field label="Starts"><input type="datetime-local" value={form.startAt} onChange={e => update('startAt', e.target.value)} data-testid="input-start-date" /></Field>
          <Field label="Ends"><input type="datetime-local" value={form.endAt} onChange={e => update('endAt', e.target.value)} data-testid="input-end-date" /></Field>
          <Field label="Team size"><input type="number" min="1" max="20" value={form.teamSize} onChange={e => update('teamSize', e.target.value)} data-testid="input-team-size" /></Field>
          <Field label="Team members"><input value={form.teamMembers} onChange={e => update('teamMembers', e.target.value)} placeholder="Names, separated by commas" data-testid="input-team-members" /></Field>
        </div></div></div>
      <div className="form-section"><div className="form-section-index">03</div><div className="form-section-body"><h2>The problem</h2><p>Specific pain beats a broad mission statement. Start there.</p>
        <div className="form-grid"><Field label="Problem statement" wide><textarea rows={3} maxLength={5000} value={form.problemStatement} onChange={e => update('problemStatement', e.target.value)} placeholder="Who has the problem, and what makes it painful today?" data-testid="input-problem" /></Field>
          <Field label="Judging criteria" wide hint="Separate each criterion with a comma or new line"><textarea rows={2} value={form.judgingCriteria} onChange={e => update('judgingCriteria', e.target.value)} placeholder="Impact, technical execution, creativity..." data-testid="input-criteria" /></Field>
          <Field label="Early concept" wide><textarea rows={2} value={form.concept} onChange={e => update('concept', e.target.value)} placeholder="A rough sentence is enough. It can change." data-testid="input-concept" /></Field>
          <Field label="Budget (optional)"><input type="number" min="0" step="0.01" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="0.00" data-testid="input-budget" /></Field>
        </div></div></div>
      {formError && <div className="form-error" role="alert">{formError}</div>}
      <div className="form-actions"><span>Nothing is locked in. Refine details as the idea gets sharper.</span><button className="button button-accent" type="submit" disabled={createProject.isPending} data-testid="button-create-project">{createProject.isPending ? <LoaderCircle className="spin" size={16} /> : <Rocket size={16} />}{createProject.isPending ? 'Creating room…' : 'Create build room'}<ArrowRight size={16} /></button></div>
    </form>
  </div></AppFrame>;
}

function Field({ label, required, hint, wide, children }: { label: string; required?: boolean; hint?: string; wide?: boolean; children: ReactNode }) {
  return <label className={`field ${wide ? 'field-wide' : ''}`}><span className="field-label">{label}{required && <b> REQUIRED</b>}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}

function WorkspacePage() {
  const [, params] = useRoute('/projects/:id/:section?');
  const id = params?.id ?? '';
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const projectQuery = useGetProject(id, { query: { queryKey: getGetProjectQueryKey(id), enabled: !!id } });
  const tasksQuery = useListTasks(id, { query: { queryKey: getListTasksQueryKey(id), enabled: !!id } });
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const project = projectQuery.data;
  const rawSection = params?.section ?? 'overview';
  const section = sections.find(([_, slug]) => slug === rawSection)?.[1] ?? 'overview';
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListActivityQueryKey({ limit: 8 }) });
  };
  const savePatch = (patch: Record<string, unknown>) => updateProject.mutate({ id, data: patch }, { onSuccess: invalidate });
  if (projectQuery.isLoading) return <AppFrame activeId={id}><div className="workspace-loading page-enter"><div className="skeleton-line short" /><div className="skeleton-line wide" /><div className="skeleton-line medium" /><div className="skeleton-card" /></div></AppFrame>;
  if (projectQuery.isError || !project) return <AppFrame activeId={id}><div className="page-content"><div className="notice-card"><div><b>This project room is unavailable.</b><p>It may have been removed, or the connection dropped.</p></div><Link href="/" className="button button-outline button-small">Back to projects</Link></div></div></AppFrame>;
  const tasks = tasksQuery.data ?? [];
  return <AppFrame activeId={id}><div className="workspace page-enter">
    <div className="workspace-header"><div><Link href="/" className="back-link"><ArrowLeft size={14} /> All projects</Link><div className="workspace-title-row"><div><div className="eyebrow"><span className="eyebrow-line"></span> {project.hackathonName}</div><h1>{project.name}</h1></div><span className={`stage-badge stage-${project.stage}`}>{stageName(project.stage)}</span></div>
      {project.theme && <p className="workspace-theme">{project.theme}</p>}</div>
      <div className="workspace-deadline"><span className="deadline-overline">TIME LEFT</span><strong>{project.endAt ? (daysUntil(project.endAt) < 0 ? 'Finished' : daysUntil(project.endAt) === 0 ? 'Today' : `${daysUntil(project.endAt)} days`) : 'No deadline'}</strong><span>{project.endAt ? new Date(project.endAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Add a date in settings'}</span></div>
    </div>
    <div className="workspace-tabs" role="navigation" aria-label="Project workspace sections">
      {sections.map(([label, slug, Icon]) => <Link key={slug} href={`/projects/${id}/${slug}`} className={`workspace-tab ${section === slug ? 'tab-active' : ''}`} aria-current={section === slug ? 'page' : undefined} data-testid={`tab-${slug}`}><Icon size={15} /><span>{label}</span></Link>)}
    </div>
    <div className="workspace-content">
      {tasksQuery.isError && <div className="inline-error" role="alert">Tasks did not load. <button onClick={() => tasksQuery.refetch()}>Retry</button></div>}
      {section === 'overview' && <Overview project={project} tasks={tasks} tasksLoading={tasksQuery.isLoading} updateProject={savePatch} updating={updateProject.isPending} onSection={slug => setLocation(`/projects/${id}/${slug}`)} />}
      {section === 'build-plan' && <BuildPlan project={project} tasks={tasks} loading={tasksQuery.isLoading} projectId={id} />}
      {section === 'problem' && <EditableSection title="Name the real problem." label="Problem statement" value={project.problemStatement ?? ''} placeholder="Who is affected, what are they trying to do, and where does it break down?" onSave={value => savePatch({ problemStatement: value || null })} saving={updateProject.isPending} help="Keep it grounded in a person and a moment. Big themes can wait." coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.problem} />} />}
      {section === 'ideas' && <EditableSection title="Capture the concept." label="Concept" value={project.concept ?? ''} placeholder="Describe the shape of the idea. Rough is useful." onSave={value => savePatch({ concept: value || null })} saving={updateProject.isPending} help="A promising idea is a hypothesis, not a commitment." coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.ideas} />} />}
      {section === 'mvp' && <MvpSection project={project} saving={updateProject.isPending} onSave={savePatch} coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.mvp} />} />}
      {section === 'tech-stack' && <EditableSection title="Choose tools you can ship with." label="Tech stack" value={(project.techStack ?? []).join('\n')} placeholder="One tool per line. Keep it familiar." onSave={value => savePatch({ techStack: splitLines(value) })} saving={updateProject.isPending} help={`Required: ${(project.requiredTechnologies ?? []).join(', ') || 'No required technologies listed'}`} coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions['tech-stack']} />} />}
      {section === 'architecture' && <EditableSection title="Make the shape visible." label="Architecture notes" value={project.architectureNotes ?? ''} placeholder="What talks to what? Where does data live? What can you cut?" onSave={value => savePatch({ architectureNotes: value || null })} saving={updateProject.isPending} help="A few clear notes beat a diagram nobody can explain." coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.architecture} />} />}
      {(section === 'demo' || section === 'pitch') && <EditableSection title={section === 'demo' ? 'Show the thing working.' : 'Make the case in one breath.'} label={section === 'demo' ? 'Demo plan' : 'Pitch notes'} value={section === 'demo' ? project.demoPlan ?? '' : project.pitch ?? ''} placeholder={section === 'demo' ? 'What will judges see first? What is the happy path? What can go wrong?' : 'Problem. Why now. What you built. What changes next.'} onSave={value => savePatch(section === 'demo' ? { demoPlan: value || null } : { pitch: value || null })} saving={updateProject.isPending} help="Keep the story concrete. Show a working slice before a slide." coach={<CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions[section]} />} />}
      {section === 'ai-lab' && <CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions['ai-lab']} showSavedNotes />}
      {section === 'validation' && <CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.validation} />}
      {section === 'presentation' && <CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.presentation} />}
      {section === 'judge-simulator' && <CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions['judge-simulator']} />}
      {section === 'evaluation' && <CoachPanel projectId={id} projectNotes={project.coachNotes} actions={coachActions.evaluation} />}
      {section === 'settings' && <SettingsSection project={project} saving={updateProject.isPending} onSave={savePatch} onDelete={() => { if (window.confirm(`Delete “${project.name}” and all its tasks?`)) deleteProject.mutate({ id }, { onSuccess: () => { invalidate(); setLocation('/'); } }); }} deleting={deleteProject.isPending} />}
      {!['overview', 'build-plan', 'problem', 'ideas', 'mvp', 'tech-stack', 'architecture', 'demo', 'pitch', 'ai-lab', 'validation', 'presentation', 'judge-simulator', 'evaluation', 'settings'].includes(section) && <UnavailableSection name={sections.find(([, slug]) => slug === section)?.[0] ?? 'This section'} />}
    </div>
  </div></AppFrame>;
}

function Overview({ project, tasks, tasksLoading, updateProject, updating, onSection }: { project: Project; tasks: Task[]; tasksLoading: boolean; updateProject: (patch: Record<string, unknown>) => void; updating: boolean; onSection: (slug: SectionSlug) => void }) {
  const done = tasks.filter(task => task.status === 'done').length;
  const active = tasks.filter(task => task.status === 'in_progress').length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const setStage = (stage: Project['stage']) => updateProject({ stage });
  return <div className="overview-grid">
    <div className="overview-main">
      <div className="focus-card"><div className="focus-card-top"><div><div className="eyebrow">YOUR NORTH STAR</div><h2>Make it work.<br /><em>Then make it clear.</em></h2></div><div className="focus-stamp"><span>BUILD</span><strong>01</strong><span>REAL</span></div></div>
        <p>{project.problemStatement || 'A clear problem statement is the first thing worth building. Write down who needs this and why.'}</p>
        {!project.problemStatement && <button className="text-action" onClick={() => onSection('problem')}>Define the problem <ArrowRight size={14} /></button>}
      </div>
      <div className="overview-panel task-overview"><div className="panel-head"><div><div className="eyebrow">DELIVERABLES</div><h3>Build progress</h3></div><button className="text-action" onClick={() => onSection('build-plan')}>Full plan <ArrowRight size={14} /></button></div>
        {tasksLoading ? <div className="activity-skeleton"><span /><span /></div> : <><div className="progress-ring-row"><div className="progress-ring" style={{ background: `conic-gradient(hsl(var(--primary)) ${progress * 3.6}deg, hsl(var(--muted)) 0deg)` }}><div><b>{progress}%</b><span>DONE</span></div></div><div className="progress-legend"><span><i className="legend-dot done-dot"></i>{done} complete</span><span><i className="legend-dot active-dot"></i>{active} in progress</span><span><i className="legend-dot backlog-dot"></i>{tasks.length - done - active} up next</span></div></div>
          {tasks.length > 0 && <div className="overview-task-list">{tasks.filter(t => t.status !== 'done').slice(0, 3).map(task => <div className="overview-task" key={task.id}><span className={`task-priority priority-${task.priority}`}></span><span>{task.title}</span>{task.dueAt && <small>{new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>}</div>)}</div>}
          {!tasks.length && <p className="muted-copy">No tasks yet. Break the MVP into pieces small enough to finish today.</p>}
        </>}
      </div>
    </div>
    <div className="overview-rail">
      <div className="overview-panel stage-panel"><div className="eyebrow">PROJECT STAGE</div><h3>Where are you now?</h3><select value={project.stage} onChange={e => setStage(e.target.value as Project['stage'])} disabled={updating} className="stage-select" aria-label="Project stage" data-testid="select-project-stage">{['problem','ideas','mvp','build','test','deploy','demo','pitch'].map(stage => <option value={stage} key={stage}>{stageName(stage)}</option>)}</select><small>{updating ? 'Saving stage…' : 'Be honest. The next step depends on it.'}</small></div>
      <div className="overview-panel mvp-preview"><div className="panel-head"><div><div className="eyebrow">THE SMALL BET</div><h3>MVP scope</h3></div><button className="icon-arrow" aria-label="Edit MVP" onClick={() => onSection('mvp')}><ArrowUpRight size={16} /></button></div>
        {project.selectedSolution ? <p className="solution-text">{project.selectedSolution}</p> : <p className="muted-copy">Choose the smallest solution that proves your idea has legs.</p>}
        <div className="feature-count"><Blocks size={15} /><span>{project.mvpFeatures?.length ?? 0} scoped features</span></div>
        <button className="full-width-action" onClick={() => onSection('mvp')}>Review MVP scope <ArrowRight size={14} /></button></div>
      <div className="mentor-quote"><span className="quote-mark">“</span><p>Cut the feature, not the demo. One convincing moment beats five unfinished screens.</p><span className="quote-byline">A GOOD HACKATHON RULE</span></div>
    </div>
  </div>;
}

function BuildPlan({ project, tasks, loading, projectId }: { project: Project; tasks: Task[]; loading: boolean; projectId: string }) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showForm, setShowForm] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueAt: '' });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getListActivityQueryKey({ limit: 8 }) });
  };
  const submitTask = (event: FormEvent) => {
    event.preventDefault();
    setTaskError('');
    const data: TaskInput = { title: form.title.trim(), description: form.description.trim() || null, priority: form.priority as TaskInput['priority'], assignee: form.assignee.trim() || null, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null };
    createTask.mutate({ id: projectId, data }, { onSuccess: () => { invalidate(); setForm({ title: '', description: '', priority: 'medium', assignee: '', dueAt: '' }); setShowForm(false); }, onError: () => setTaskError('Task could not be added. Try again.') });
  };
  const changeStatus = (task: Task) => {
    const next = task.status === 'done' ? 'backlog' : task.status === 'backlog' ? 'in_progress' : 'done';
    updateTask.mutate({ id: task.id, data: { status: next } }, { onSuccess: invalidate, onError: () => setTaskError('Task status did not save. Try again.') });
  };
  const removeTask = (task: Task) => {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    deleteTask.mutate({ id: task.id }, { onSuccess: invalidate, onError: () => setTaskError('Task could not be deleted.') });
  };
  const groups = [
    { key: 'in_progress', title: 'In motion', hint: 'Focus here now', list: tasks.filter(t => t.status === 'in_progress') },
    { key: 'backlog', title: 'Up next', hint: 'Ready when you are', list: tasks.filter(t => t.status === 'backlog') },
    { key: 'done', title: 'Shipped', hint: 'Small wins count', list: tasks.filter(t => t.status === 'done') },
  ];
  return <div className="build-plan-page">
    <div className="content-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> EXECUTION, NOT WISHFUL THINKING</div><h2>Make the work <em>small.</em></h2><p>One owner. One next step. Keep the task list smaller than your ambition.</p></div><div className="plan-deadline"><Clock3 size={15} /><span>{project.endAt ? `${Math.max(0, daysUntil(project.endAt))} days to deadline` : 'No deadline set'}</span></div></div>
    <div className="plan-toolbar"><div className="plan-total">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}<span className="toolbar-dot"></span>{tasks.filter(t => t.status === 'done').length} shipped</div><button className="button button-dark button-small" onClick={() => { setShowForm(!showForm); setTaskError(''); }} data-testid="button-add-task"><Plus size={15} /> Add a task</button></div>
    {taskError && <div className="inline-error" role="alert">{taskError}<button aria-label="Dismiss" onClick={() => setTaskError('')}><X size={14} /></button></div>}
    {showForm && <form className="task-create-form" onSubmit={submitTask}><div className="task-form-head"><div><span className="eyebrow">NEW DELIVERABLE</span><h3>What needs to happen?</h3></div><button type="button" className="icon-button" aria-label="Close task form" onClick={() => setShowForm(false)}><X size={17} /></button></div>
      <div className="task-form-grid"><Field label="Task title" required><input autoFocus required maxLength={240} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build the sign-in flow" data-testid="input-task-title" /></Field>
        <Field label="Owner"><input value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="Who’s on it?" data-testid="input-task-assignee" /></Field>
        <Field label="Priority"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} data-testid="select-task-priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Due date"><input type="datetime-local" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} data-testid="input-task-date" /></Field>
        <Field label="Details" wide><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does done look like?" data-testid="input-task-description" /></Field></div>
      <div className="task-form-actions"><button type="button" className="button button-quiet button-small" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-accent button-small" disabled={createTask.isPending}>{createTask.isPending ? 'Adding…' : 'Add to plan'}<ArrowRight size={14} /></button></div>
    </form>}
    {loading ? <div className="task-board task-board-loading"><SkeletonCard /><SkeletonCard /></div> : tasks.length ? <div className="task-board">{groups.map(group => <section className={`task-column column-${group.key}`} key={group.key}><div className="column-head"><span className="column-status-dot"></span><h3>{group.title}</h3><span className="column-count">{group.list.length}</span><small>{group.hint}</small></div><div className="column-tasks">{group.list.map(task => <TaskCard key={task.id} task={task} onStatus={() => changeStatus(task)} onDelete={() => removeTask(task)} busy={updateTask.isPending || deleteTask.isPending} />)}</div></section>)}</div> : <div className="empty-task-plan"><div className="empty-graphic"><ListChecks size={26} /></div><h3>Nothing on the board. Good time to scope.</h3><p>Start with the one thing that must work for your demo. Add the next step, not the whole roadmap.</p><button className="button button-accent" onClick={() => setShowForm(true)}><Plus size={15} /> Add your first task</button></div>}
    <CoachPanel projectId={projectId} projectNotes={project.coachNotes} actions={coachActions['build-plan']} />
    <div className="plan-footnote"><span><Clock3 size={14} /></span><p><b>Deadline reality check</b> — leave room for integration, testing, and a demo that survives the room you present in.</p></div>
  </div>;
}

function TaskCard({ task, onStatus, onDelete, busy }: { task: Task; onStatus: () => void; onDelete: () => void; busy: boolean }) {
  return <article className={`task-card ${task.status === 'done' ? 'task-complete' : ''}`} data-testid={`task-${task.id}`}>
    <div className="task-card-top"><button className={`task-check ${task.status === 'done' ? 'checked' : ''}`} aria-label={task.status === 'done' ? `Reopen ${task.title}` : `Advance status for ${task.title}`} onClick={onStatus} disabled={busy} data-testid={`button-task-status-${task.id}`}>{task.status === 'done' ? <Check size={13} /> : task.status === 'in_progress' ? <span className="check-half" /> : null}</button>
      <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span><button className="task-delete" aria-label={`Delete ${task.title}`} onClick={onDelete} disabled={busy} data-testid={`button-delete-task-${task.id}`}><Trash2 size={14} /></button></div>
    <h4>{task.title}</h4>{task.description && <p>{task.description}</p>}
    <div className="task-card-foot">{task.assignee ? <span className="assignee-chip"><span>{initials(task.assignee)}</span>{task.assignee}</span> : <span className="unassigned">Unassigned</span>}
      {task.dueAt && <span className={`task-date ${daysUntil(task.dueAt) <= 1 && task.status !== 'done' ? 'urgent' : ''}`}><Clock3 size={12} />{new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}</div>
    <button className="task-next" onClick={onStatus} disabled={busy}>{task.status === 'backlog' ? 'Start task' : task.status === 'in_progress' ? 'Mark shipped' : 'Reopen'}<ArrowRight size={13} /></button>
  </article>;
}

function MvpSection({ project, saving, onSave, coach }: { project: Project; saving: boolean; onSave: (patch: Record<string, unknown>) => void; coach: ReactNode }) {
  const [solution, setSolution] = useState(project.selectedSolution ?? '');
  const [features, setFeatures] = useState((project.mvpFeatures ?? []).join('\n'));
  const changed = solution !== (project.selectedSolution ?? '') || features !== (project.mvpFeatures ?? []).join('\n');
  return <div className="editable-section"><div className="content-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> SCOPE IS A SUPERPOWER</div><h2>Ship a slice, <em>not a saga.</em></h2><p>Decide the one useful thing you can make real. Everything else has to earn its way in.</p></div></div>
    <div className="editor-card"><div className="editor-callout"><Blocks size={19} /><p><b>Mentor check:</b> Can you explain the demo in one sentence? If not, the MVP is still too wide.</p></div>
      <Field label="Selected solution"><textarea rows={4} value={solution} onChange={e => setSolution(e.target.value)} placeholder="What is the smallest version of your idea that demonstrates real value?" data-testid="input-selected-solution" /></Field>
      <div className="feature-editor"><Field label="MVP features" hint="One feature per line"><textarea rows={7} value={features} onChange={e => setFeatures(e.target.value)} placeholder={'A person can...\nThe system responds by...\nThe demo ends with...'} data-testid="input-mvp-features" /></Field><div className="feature-counter"><span>{splitLines(features).length}</span> scoped items <span className="feature-counter-note">Keep it to three if you can.</span></div></div>
      <div className="editor-actions">{saving && <span className="saving-state"><LoaderCircle className="spin" size={14} /> Saving…</span>}<button className="button button-accent button-small" disabled={!changed || saving} onClick={() => onSave({ selectedSolution: solution || null, mvpFeatures: splitLines(features) })}>{saving ? 'Saving…' : 'Save MVP scope'}<ArrowRight size={14} /></button></div>
    </div>{coach}
  </div>;
}

function EditableSection({ title, label, value, placeholder, onSave, saving, help, coach }: { title: string; label: string; value: string; placeholder: string; onSave: (value: string) => void; saving: boolean; help: string; coach: ReactNode }) {
  const [draft, setDraft] = useState(value);
  const changed = draft !== value;
  return <div className="editable-section"><div className="content-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> CLEAR THINKING, BETTER BUILDING</div><h2>{title}</h2><p>{help}</p></div></div>
    <div className="editor-card"><Field label={label}><textarea rows={9} value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} data-testid={`input-${label.toLowerCase().replaceAll(' ', '-')}`} /></Field>
      <div className="editor-actions">{saving && <span className="saving-state"><LoaderCircle className="spin" size={14} /> Saving…</span>}<button className="button button-accent button-small" disabled={!changed || saving} onClick={() => onSave(draft)}>{saving ? 'Saving…' : 'Save changes'}<ArrowRight size={14} /></button></div>
    </div>{coach}
  </div>;
}

type SavedCoachNote = { id: string; title: string; action: string; answer: string; generatedAt: string };

function parseCoachNote(raw: string, index: number): SavedCoachNote | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object') {
      const note = value as Partial<SavedCoachNote>;
      if (typeof note.id === 'string' && typeof note.title === 'string' && typeof note.action === 'string' &&
        typeof note.answer === 'string' && typeof note.generatedAt === 'string') {
        return { id: note.id, title: note.title, action: note.action, answer: note.answer, generatedAt: note.generatedAt };
      }
    }
  } catch {
    // Older plain-text notes remain readable and removable.
  }
  return raw.trim() ? { id: `legacy-${index}`, title: 'Older mentor note', action: 'legacy', answer: raw, generatedAt: '' } : null;
}

function CoachPanel({ projectId, projectNotes, actions, showSavedNotes = false }: { projectId: string; projectNotes?: string[]; actions: CoachAction[]; showSavedNotes?: boolean }) {
  const queryClient = useQueryClient();
  const generate = useGenerateMentorResponse();
  const updateProject = useUpdateProject();
  const [selectedAction, setSelectedAction] = useState<MentorRequestAction>(actions[0].action);
  const [context, setContext] = useState('');
  const [result, setResult] = useState<MentorResult | null>(null);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const notes = (projectNotes ?? []).map((raw, rawIndex) => ({ note: parseCoachNote(raw, rawIndex), rawIndex }))
    .filter((entry): entry is { note: SavedCoachNote; rawIndex: number } => entry.note !== null);
  const activeAction = actions.find(item => item.action === selectedAction) ?? actions[0];
  const pending = generate.isPending;

  const runCoach = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setCopyMessage('');
    setSaveMessage('');
    setResult(null);
    generate.mutate({ data: { projectId, action: activeAction.action, ...(context.trim() ? { prompt: context.trim() } : {}) } }, {
      onSuccess: answer => setResult(answer),
      onError: error => setError(error instanceof Error ? error.message : 'The mentor could not generate a response. Check your connection or try again shortly.'),
    });
  };
  const copyAnswer = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopyMessage('Answer copied.');
    } catch {
      setCopyMessage('Copy is unavailable in this browser. Select the answer text to copy it.');
    }
  };
  const saveAnswer = () => {
    if (!result) return;
    if ((projectNotes ?? []).length >= 100) {
      setError('Mentor notes are full. Remove one in AI Lab before saving another.');
      return;
    }
    setSaveMessage('');
    setError('');
    const title = actions.find(item => item.action === result.action)?.title ?? activeAction.title;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const note: SavedCoachNote = { id, title, action: result.action, answer: result.answer, generatedAt: result.generatedAt };
    updateProject.mutate({ id: projectId, data: { coachNotes: [...(projectNotes ?? []), JSON.stringify(note)] } }, {
      onSuccess: () => {
        setSaveMessage('Saved to mentor notes.');
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      },
      onError: () => setError('This answer could not be saved to mentor notes. Try again.'),
    });
  };
  const removeNote = (noteIndex: number) => {
    const note = notes.find(entry => entry.rawIndex === noteIndex)?.note;
    if (!window.confirm(`Remove “${note?.title ?? 'this mentor note'}” from saved notes? This cannot be undone.`)) return;
    const updatedNotes = (projectNotes ?? []).filter((_, index) => index !== noteIndex);
    updateProject.mutate({ id: projectId, data: { coachNotes: updatedNotes } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
      onError: () => setError('That mentor note could not be removed. Try again.'),
    });
  };

  return <section className="coach-panel" aria-labelledby="coach-panel-title">
    <div className="coach-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> PRACTICAL AI COACHING</div><h2 id="coach-panel-title">Ask your build mentor</h2><p>Get a focused next step. Treat the response as advice to evaluate, not a decision made for your team.</p></div><div className="coach-mark"><Sparkles size={17} /><span>MENTOR</span></div></div>
    <form className="coach-form" onSubmit={runCoach}>
      <fieldset className="coach-action-fieldset"><legend>What do you want help with?</legend><div className="coach-action-list">
        {actions.map(item => <button key={item.action} type="button" className={`coach-action ${item.action === activeAction.action ? 'coach-action-active' : ''}`} aria-pressed={item.action === activeAction.action} onClick={() => { setSelectedAction(item.action); setResult(null); setError(''); setSaveMessage(''); }} data-testid={`button-coach-action-${item.action}`}>{item.title}<ArrowRight size={13} /></button>)}
      </div></fieldset>
      <label className="coach-context-label" htmlFor={`coach-context-${projectId}-${activeAction.action}`}>{activeAction.action === 'judge_feedback' ? 'Judge question and your draft answer' : 'Optional context'} <span>{activeAction.action === 'judge_feedback' ? 'Paste a question and the answer you would give.' : 'Share a specific question, constraint, or error message.'}</span></label>
      <textarea id={`coach-context-${projectId}-${activeAction.action}`} className="coach-context" rows={3} maxLength={4000} value={context} onChange={event => setContext(event.target.value)} placeholder={activeAction.action === 'judge_feedback' ? 'Judge question: …\nMy draft answer: …' : 'What have you tried? What is the deadline or constraint?'} data-testid={`input-coach-context-${activeAction.action}`} />
      <div className="coach-privacy" role="note" data-testid="text-coach-privacy-warning"><ShieldAlert size={16} /><p>Project context and your prompt are sent to OpenAI using the owner’s key. OpenAI may charge for usage, and the server has usage limits. Never enter API keys, passwords, or sensitive personal data.</p></div>
      <div className="coach-submit-row"><span>Advice is AI-generated, not verified research or objective judging.</span><button className="button button-accent button-small" type="submit" disabled={pending} data-testid={`button-generate-${activeAction.action}`}>{pending ? <><LoaderCircle className="spin" size={15} /> Thinking…</> : <><Sparkles size={14} /> {activeAction.title}</>}</button></div>
    </form>
    {pending && <div className="coach-pending" role="status" aria-live="polite" data-testid="status-coach-pending"><span className="coach-pending-mark"><LoaderCircle className="spin" size={16} /></span><div><b>Working through your project context</b><p>This can take a few seconds. Your project fields will not be changed.</p></div></div>}
    {error && <div className="coach-error" role="alert" data-testid="status-coach-error">{error}</div>}
    {result && <article className="coach-result" aria-label="AI-generated mentor advice" data-testid="result-coach-answer">
      <div className="coach-result-head"><div><span className="coach-result-label"><Sparkles size={13} /> AI-GENERATED ADVICE</span><h3>{actions.find(item => item.action === result.action)?.title ?? activeAction.title}</h3></div><span className="coach-model">{result.model}</span></div>
      <div className="coach-answer">{result.answer}</div>
      <p className="coach-result-caveat" data-testid="text-coach-result-caveat">Advice only. This is not verified research or an objective assessment.</p>
      <div className="coach-result-actions"><span>{Number.isNaN(Date.parse(result.generatedAt)) ? 'Just generated' : new Date(result.generatedAt).toLocaleString()}</span><div><button type="button" className="button button-outline button-small" onClick={copyAnswer} data-testid="button-copy-coach-answer"><Copy size={13} /> Copy answer</button>{(projectNotes ?? []).length >= 100 ? <span className="coach-action-status" role="status" data-testid="status-coach-notes-limit">Mentor notes are full. Remove one in AI Lab to save another.</span> : <button type="button" className="button button-dark button-small" onClick={saveAnswer} disabled={updateProject.isPending} data-testid="button-save-coach-note">{updateProject.isPending ? 'Saving…' : 'Save to mentor notes'}</button>}</div></div>
      {copyMessage && <p className="coach-action-status" role="status" data-testid="status-coach-copy">{copyMessage}</p>}
      {saveMessage && <p className="coach-action-status" role="status" data-testid="status-coach-save">{saveMessage}</p>}
    </article>}
    {showSavedNotes && <section className="saved-coach-notes" aria-labelledby="saved-coach-notes-title">
      <div className="saved-notes-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> KEEP THE USEFUL BITS</div><h3 id="saved-coach-notes-title">Mentor notes <span>{notes.length}</span></h3></div><p>Only answers you chose to save appear here.</p></div>
      {notes.length ? <div className="saved-note-list">{notes.map(({ note, rawIndex }) => <article className="saved-note" key={`${note.id}-${rawIndex}`} data-testid={`card-coach-note-${note.id}`}>
        <div className="saved-note-top"><div><b>{note.title}</b><span>{note.generatedAt && !Number.isNaN(Date.parse(note.generatedAt)) ? new Date(note.generatedAt).toLocaleString() : 'Saved mentor advice'}</span></div><button type="button" className="button button-quiet button-small" onClick={() => removeNote(rawIndex)} disabled={updateProject.isPending} aria-label={`Remove mentor note: ${note.title}`} data-testid={`button-remove-coach-note-${note.id}`}><Trash2 size={13} /> Remove</button></div>
        <div className="saved-note-answer">{note.answer}</div>
      </article>)}</div> : <div className="saved-notes-empty" data-testid="empty-coach-notes">No mentor notes saved yet. Generate an answer and choose “Save to mentor notes” to keep it.</div>}
    </section>}
  </section>;
}

function SettingsSection({ project, saving, onSave, onDelete, deleting }: { project: Project; saving: boolean; onSave: (patch: Record<string, unknown>) => void; onDelete: () => void; deleting: boolean }) {
  const [name, setName] = useState(project.name);
  const [hackathon, setHackathon] = useState(project.hackathonName);
  const [criteria, setCriteria] = useState((project.judgingCriteria ?? []).join('\n'));
  const changed = name !== project.name || hackathon !== project.hackathonName || criteria !== (project.judgingCriteria ?? []).join('\n');
  return <div className="editable-section"><div className="content-heading"><div><div className="eyebrow"><span className="eyebrow-line"></span> ROOM CONFIGURATION</div><h2>Project settings</h2><p>Keep the project identity and judging bar up to date.</p></div></div>
    <div className="editor-card settings-editor"><Field label="Project name"><input value={name} onChange={e => setName(e.target.value)} data-testid="input-settings-name" /></Field><Field label="Hackathon"><input value={hackathon} onChange={e => setHackathon(e.target.value)} data-testid="input-settings-hackathon" /></Field><Field label="Judging criteria" hint="One criterion per line"><textarea rows={4} value={criteria} onChange={e => setCriteria(e.target.value)} data-testid="input-settings-criteria" /></Field>
      <div className="editor-actions"><span>{saving ? 'Saving changes…' : ''}</span><button className="button button-accent button-small" disabled={!changed || saving} onClick={() => onSave({ name: name.trim(), hackathonName: hackathon.trim(), judgingCriteria: splitLines(criteria) })}>Save settings</button></div>
    </div>
    <div className="danger-zone"><div><b>Delete this project</b><p>Deletes the project room and all its tasks. This cannot be undone.</p></div><button className="button button-danger button-small" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : <><Trash2 size={14} /> Delete project</>}</button></div>
  </div>;
}

function UnavailableSection({ name }: { name: string }) {
  return <div className="unavailable-section"><div className="unavailable-art"><span className="art-line"></span><span className="art-square"></span><span className="art-circle"></span><span className="art-cross">+</span></div><div className="eyebrow"><span className="eyebrow-line"></span> NOT IN THIS BUILD</div><h2>{name} is on the bench.</h2><p>This workspace is focused on the decisions that help you ship: scope, tasks, and a demo story. This section isn’t available yet, and won’t pretend there’s an AI tool behind the curtain.</p><span className="unavailable-tag"><span></span> AVAILABLE IN A FUTURE RELEASE</span></div>;
}

function ActivityGlyph({ action }: { action: string }) {
  if (action.includes('task_completed')) return <CheckCircle2 size={14} />;
  if (action.includes('task')) return <Hammer size={14} />;
  return <Rocket size={14} />;
}

function splitLines(value: string) { return value.split(/[\n,]/).map(item => item.trim()).filter(Boolean); }
function initials(value: string) { return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '•'; }
function stageName(stage: string) { return stage.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase()); }
function daysUntil(date: string) { return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000); }
function relativeTime(date: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default App;