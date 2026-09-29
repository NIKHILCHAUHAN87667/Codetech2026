import { createElement, useEffect, useState, type ReactNode } from "react";
import { api, catLabel, fmtDateTime, fmtDuration, fmtTime, ordinal, periodLabelFromDate, prettyPeriod, titleCase, type DecisionRecord, type IngestResult, type Metric, type Signal } from "./api";

type Screen =
  | "dashboard"
  | "submissions"
  | "assessment"
  | "worklist"
  | "case"
  | "decision"
  | "report";

type IconName =
  | "arrow"
  | "bell"
  | "case"
  | "check"
  | "chevron"
  | "clock"
  | "dashboard"
  | "document"
  | "download"
  | "evidence"
  | "filter"
  | "lock"
  | "logout"
  | "menu"
  | "report"
  | "search"
  | "shield"
  | "submission"
  | "trend"
  | "upload"
  | "user"
  | "warning";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  case: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M8 5V3h8v2M3 11h18M10 14h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  document: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 19h16" />
    </>
  ),
  evidence: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5M8 11l2 2 4-4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H9" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  report: (
    <>
      <path d="M5 3h14v18H5z" />
      <path d="M9 17v-3m3 3V9m3 8v-5M9 6h6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  submission: (
    <>
      <path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" />
      <path d="M8 4V2m8 2V2" />
    </>
  ),
  trend: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 4-5 3 3 5-7" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M4 16v4h16v-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2 21h20z" />
      <path d="M12 9v5m0 3v.01" />
    </>
  ),
};

function Icon({ name, size = "md" }: { name: IconName; size?: "sm" | "md" | "lg" }) {
  return (
    <svg
      aria-hidden="true"
      className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return createElement(
    "button",
    {
      type,
      onClick,
      disabled,
      className: `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`,
    },
    children,
  );
}

function TextInput({
  defaultValue,
  placeholder,
  type = "text",
  ariaLabel,
  onChange,
}: {
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  ariaLabel: string;
  onChange?: (value: string) => void;
}) {
  return createElement("input", {
    "aria-label": ariaLabel,
    defaultValue,
    placeholder,
    type,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value),
    className:
      "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
  });
}

function SelectControl({
  ariaLabel,
  children,
  value,
  onChange,
}: {
  ariaLabel: string;
  children: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return createElement(
    "select",
    {
      "aria-label": ariaLabel,
      value,
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange?.(event.target.value),
      className:
        "min-h-10 rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
    },
    children,
  );
}

function TextArea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return createElement("textarea", {
    "aria-label": "Supervisor comments",
    value,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    rows: 5,
    placeholder: "Document your assessment and any evidence required...",
    className:
      "w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
  });
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

type BadgeTone = "blue" | "green" | "amber" | "red" | "slate" | "violet";

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: BadgeTone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
        <Icon name="shield" />
      </div>
      {!compact && (
        <div>
          <div className="text-lg font-bold tracking-tight text-white">SAT-SA</div>
          <div className="text-xs font-medium text-slate-400">Supervisory Assessment</div>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">{eyebrow}</div>}
        <div className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{title}</div>
        <div className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</div>
      </div>
      {action}
    </div>
  );
}

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "submissions", label: "Submissions", icon: "submission" },
  { id: "assessment", label: "CSE Assessments", icon: "trend" },
  { id: "worklist", label: "Review Worklist", icon: "case" },
  { id: "report", label: "Reports", icon: "report" },
];

type Session = { id: string; name: string };

function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [id, setId] = useState("SUP-2741");
  const [pw, setPw] = useState("demo-access");
  const [error, setError] = useState("");
  // Prototype-only credential check (the backend intentionally has no auth layer; a real deployment
  // would sit behind the organisation's own identity provider / OS-level access control).
  const submit = () => {
    if (id.trim() === "SUP-2741" && pw === "demo-access") onLogin({ id: "SUP-2741", name: "A. Sharma" });
    else setError("Invalid demo credentials. Use SUP-2741 / demo-access.");
  };
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900" />
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full border border-blue-500/20 bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10"><Brand /></div>
        <div className="relative z-10 max-w-xl">
          <Badge tone="blue">NCIIPC supervisory portal</Badge>
          <div className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">Evidence-led supervision for cyber operations.</div>
          <div className="mt-5 max-w-lg text-lg leading-8 text-slate-300">Turn periodic SOC records into explainable signals, prioritized reviews, and auditable supervisory decisions.</div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
            <div><span className="block font-bold text-white">Explainable</span> Every signal</div>
            <div><span className="block font-bold text-white">Evidence-led</span> Every review</div>
            <div><span className="block font-bold text-white">Human-led</span> Every decision</div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-slate-400"><Icon name="lock" size="sm" /> Offline processing · Secure environment</div>
      </section>
      <section className="flex items-center justify-center bg-slate-50 p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><div className="inline-flex rounded-xl bg-slate-900 p-3"><Brand /></div></div>
          <div className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</div>
          <div className="mt-2 text-sm text-slate-600">Sign in to continue to the supervisory workspace.</div>
          <div className="mt-8 space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Supervisor ID</span><TextInput ariaLabel="Supervisor ID" defaultValue="SUP-2741" onChange={setId} /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><TextInput ariaLabel="Password" defaultValue="demo-access" type="password" onChange={setPw} /></label>
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500"><Icon name="lock" size="sm" /> Authorized access only</span>
              <span className="font-semibold text-blue-700">Demo account</span>
            </div>
            <Button onClick={submit} className="w-full">Sign in securely <Icon name="arrow" size="sm" /></Button>
          </div>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">This demonstration uses fictional entities and illustrative metrics. No production records are present.</div>
        </div>
      </section>
    </main>
  );
}

function Shell({
  screen,
  setScreen,
  onLogout,
  user,
  children,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
  user: Session;
  children: ReactNode;
}) {
  const activeRoot = screen === "case" || screen === "decision" ? "worklist" : screen;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 lg:flex">
        <div className="px-6 py-6"><Brand /></div>
        <nav className="mt-3 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setScreen(item.id)}
              className={`w-full justify-start border-0 px-3 ${
                activeRoot === item.id
                  ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={item.icon} /> {item.label}
              {item.id === "worklist" && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">18</span>
              )}
            </Button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-slate-200"><Icon name="user" size="sm" /></div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="truncate text-xs text-slate-500">NCIIPC Supervisor</div>
            </div>
          </div>
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white">
            <Icon name="logout" size="sm" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white"><Icon name="shield" size="sm" /></div>
            <span className="font-bold">SAT-SA</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <span>Supervisory workspace</span><span>/</span>
            <span className="font-semibold text-slate-800">{navItems.find((item) => item.id === activeRoot)?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="green"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" /> Secure · Offline</Badge>
            <Button variant="ghost" className="relative px-2.5" onClick={() => undefined}>
              <Icon name="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-amber-500" />
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setScreen(item.id)}
              className={activeRoot === item.id ? "shrink-0 bg-blue-50 text-blue-700" : "shrink-0"}
            >
              <Icon name={item.icon} size="sm" /> {item.label}
            </Button>
          ))}
        </nav>

        <main className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

// ---------- data loading helpers ----------
function useFetch<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: "", loading: true });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn().then(
      (data) => live && setState({ data, error: "", loading: false }),
      (e: Error) => live && setState({ data: null, error: e.message, loading: false }),
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function Loading({ label = "Loading" }: { label?: string }) {
  return <Card className="p-8 text-center text-sm text-slate-500"><span className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 align-middle" />{label}…</Card>;
}
function ErrorCard({ message }: { message: string }) {
  return <Card className="border-red-200 bg-red-50 p-6 text-sm text-red-800"><div className="font-bold">Something went wrong</div><div className="mt-1">{message}</div></Card>;
}
function Gate<T>({ state, children }: { state: { data: T | null; error: string; loading: boolean }; children: (data: T) => ReactNode }) {
  if (state.loading) return <Loading />;
  if (state.error || !state.data) return <ErrorCard message={state.error || "No data returned."} />;
  return <>{children(state.data)}</>;
}

const PRIORITY_TONE = (p: string): BadgeTone => (p.toUpperCase() === "HIGH" ? "red" : p.toUpperCase() === "MEDIUM" ? "amber" : "slate");
const STATUS_TONE = (s: string): BadgeTone => (s === "Confirmed" ? "red" : s === "Dismissed" ? "green" : s === "In review" ? "blue" : "slate");
const CAT_COLORS = ["bg-blue-600", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-slate-500"];

type Ctx = { cseId: string; period: string; caseId: string };

// Tone / bar logic for the 8 metric cards, driven by the backend's own review thresholds.
const HIGHER_IS_WORSE = new Set(["CAMG", "PRR", "CEMR", "KECG"]);
function metricTone(m: Metric, cfg: Record<string, number> | undefined): { tone: BadgeTone; status: string } {
  if (m.value === null || !m.sample.sufficient) return { tone: "slate", status: "Insufficient data" };
  const key = m.code === "TTCP" ? "TTCP_fast_percentile" : HIGHER_IS_WORSE.has(m.code) ? `${m.code}_high` : `${m.code}_low`;
  const thr = cfg?.[key];
  if (thr === undefined) return { tone: "green", status: "No signal" };
  const breach = m.code === "TTCP" ? m.value <= thr : HIGHER_IS_WORSE.has(m.code) ? m.value > thr : m.value < thr;
  return breach ? { tone: "amber", status: "Review signal" } : { tone: "green", status: "No signal" };
}
function metricDisplay(m: Metric): string {
  if (m.value === null) return "n/a";
  if (m.code === "TTCP") return ordinal(m.value);
  if (m.code === "KECG") return `${m.value.toFixed(1)} pp`;
  return `${Math.round(m.value)}%`;
}

const STAT_ICONS: IconName[] = ["shield", "warning", "case", "clock"];
const STAT_TONES = ["blue", "amber", "violet", "red"];

function Dashboard({ navigate, ctx, setCtx, periods }: { navigate: (s: Screen) => void; ctx: Ctx; setCtx: (c: Partial<Ctx>) => void; periods: string[] }) {
  const dash = useFetch(() => api.dashboard(ctx.period), [ctx.period]);
  const wl = useFetch(() => api.worklist(ctx.period), [ctx.period]);
  const subs = useFetch(() => api.submissions(), []);
  const trend = useFetch(async () => {
    const out: { period: string; ics: number | null }[] = [];
    for (const p of [...periods].sort()) {
      try {
        const a = await api.assessment(ctx.cseId, p);
        out.push({ period: p, ics: a.metrics.find((m) => m.code === "ICS")?.value ?? null });
      } catch { out.push({ period: p, ics: null }); }
    }
    return out;
  }, [ctx.cseId, periods.join(",")]);

  const open = (cse_id: string) => { setCtx({ cseId: cse_id }); navigate("assessment"); };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Assessment period · ${prettyPeriod(ctx.period)}`}
        title="Supervisor dashboard"
        description="Portfolio view of submitted evidence, supervisory signals, and cases awaiting human review."
        action={<div className="flex items-center gap-2"><SelectControl ariaLabel="Assessment period" value={ctx.period} onChange={(p) => setCtx({ period: p })}>{periods.map((p) => <option key={p} value={p}>{prettyPeriod(p)}</option>)}</SelectControl><Button onClick={() => navigate("submissions")}><Icon name="upload" size="sm" /> New submission</Button></div>}
      />
      <Gate state={dash}>{(d) => {
        const s = d.stats;
        const stats = [
          { label: "CSEs assessed", value: s.cse_assessed, delta: prettyPeriod(d.period) },
          { label: "Requiring review", value: s.requiring_review, delta: `${s.pending_reviews} active signals` },
          { label: "Cases prioritized", value: s.cases_prioritized, delta: `Across ${s.requiring_review} CSEs` },
          { label: "Pending reviews", value: s.pending_reviews, delta: "Awaiting supervisor decision" },
        ];
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, i) => (
                <Card key={stat.label} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
                      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{stat.value}</div>
                      <div className="mt-2 text-xs font-medium text-slate-500">{stat.delta}</div>
                    </div>
                    <div className={`grid h-10 w-10 place-items-center rounded-lg ${STAT_TONES[i] === "blue" ? "bg-blue-50 text-blue-700" : STAT_TONES[i] === "amber" ? "bg-amber-50 text-amber-700" : STAT_TONES[i] === "violet" ? "bg-violet-50 text-violet-700" : "bg-red-50 text-red-700"}`}><Icon name={STAT_ICONS[i]} /></div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="overflow-hidden xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-200 p-5">
                  <div><div className="font-bold text-slate-900">CSE assessment overview</div><div className="mt-1 text-xs text-slate-500">Signals indicate review priority, not overall resilience.</div></div>
                  <Button variant="ghost" onClick={() => navigate("assessment")}>View all <Icon name="arrow" size="sm" /></Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-2xl text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">CSE</th><th className="px-5 py-3 font-semibold">Period</th><th className="px-5 py-3 font-semibold">Signals</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.cse_rows.map((row) => (
                        <tr key={row.cse_id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => open(row.cse_id)}>
                          <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.name}</div><div className="mt-0.5 text-xs text-slate-500">{row.sector?.replace(/_/g, " ")}</div></td>
                          <td className="px-5 py-4 text-slate-600">{prettyPeriod(row.period)}</td>
                          <td className="px-5 py-4"><span className="font-bold text-slate-900">{row.signals}</span></td>
                          <td className="px-5 py-4"><Badge tone={row.tone}>{row.status}</Badge></td>
                          <td className="px-5 py-4 text-right"><Button variant="ghost" onClick={() => open(row.cse_id)} className="px-2"><Icon name="arrow" size="sm" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div><div className="font-bold text-slate-900">Supervisory signals</div><div className="mt-1 text-xs text-slate-500">{wl.data?.count ?? 0} active signals by category</div></div>
                  <Icon name="trend" />
                </div>
                <div className="mt-6 space-y-5">
                  {(() => {
                    const counts: Record<string, number> = {};
                    (wl.data?.rows ?? []).forEach((r) => { counts[r.category] = (counts[r.category] ?? 0) + 1; });
                    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    const max = Math.max(1, ...entries.map((e) => e[1]));
                    if (!entries.length) return <div className="text-sm text-slate-500">No active signals for this period.</div>;
                    return entries.map(([cat, n], i) => (
                      <div key={cat}>
                        <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">{catLabel(cat)}</span><span className="font-bold text-slate-900">{n}</span></div>
                        <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${CAT_COLORS[i % CAT_COLORS.length]}`} style={{ width: `${(n / max) * 100}%` }} /></div>
                      </div>
                    ));
                  })()}
                </div>
                <div className="mt-6 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">Signals surface areas for human review. They are not findings until examined and decided by a supervisor.</div>
              </Card>
            </div>
          </>
        );
      }}</Gate>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div><div className="font-bold">Assessment trend</div><div className="mt-1 text-xs text-slate-500">{ctx.cseId} · investigation completeness (ICS) by period</div></div>
          </div>
          <div className="mt-6">
            {trend.loading ? <div className="h-44 text-sm text-slate-500">Loading trend…</div> : (() => {
              const pts = (trend.data ?? []).filter((p) => p.ics !== null) as { period: string; ics: number }[];
              if (pts.length < 2) return <div className="grid h-44 place-items-center text-sm text-slate-500">Not enough periods submitted to draw a trend.</div>;
              const x = (i: number) => 20 + (600 * i) / (pts.length - 1);
              const y = (v: number) => 160 - (Math.max(0, Math.min(100, v)) / 100) * 130;
              const line = pts.map((p, i) => `${x(i)},${y(p.ics)}`).join(" ");
              return (
                <>
                  <svg className="h-44 w-full" viewBox="0 0 640 180" preserveAspectRatio="none" aria-label="Investigation completeness trend">
                    <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity=".2" /><stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0" /></linearGradient></defs>
                    <path d="M20 35H620M20 85H620M20 135H620" stroke="rgb(226 232 240)" strokeDasharray="5 5" />
                    <path d={`M${line.split(" ").join(" L")} L${x(pts.length - 1)},160 L20,160 Z`} fill="url(#area)" />
                    <polyline points={line} fill="none" stroke="rgb(37 99 235)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((p, i) => <circle key={p.period} cx={x(i)} cy={y(p.ics)} r="5" fill="white" stroke="rgb(37 99 235)" strokeWidth="3" />)}
                  </svg>
                  <div className="grid text-center text-xs font-medium text-slate-500" style={{ gridTemplateColumns: `repeat(${pts.length}, 1fr)` }}>{pts.map((p) => <span key={p.period}>{prettyPeriod(p.period)}<br />{p.ics.toFixed(0)}%</span>)}</div>
                </>
              );
            })()}
          </div>
        </Card>
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 p-5"><div className="font-bold">Recent submissions</div><div className="mt-1 text-xs text-slate-500">Latest ingestion activity</div></div>
          <div className="divide-y divide-slate-100">
            <Gate state={subs}>{(d) => <>{d.submissions.slice(0, 5).map((s) => {
              const warn = s.validation.warnings.length, err = s.validation.errors.length;
              const [status, tone]: [string, BadgeTone] = err ? ["Errors", "red"] : warn ? [`${warn} warning${warn > 1 ? "s" : ""}`, "amber"] : s.processed_at ? ["Processed", "green"] : ["Ready for analysis", "blue"];
              return (
                <div key={s.submission_id} className="flex items-center gap-3 p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="document" size="sm" /></div>
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{s.cse_id}</div><div className="truncate text-xs text-slate-500">{s.submission_id} · {s.source_format}</div></div>
                  <Badge tone={tone}>{status}</Badge>
                </div>
              );
            })}</>}</Gate>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Submissions({ navigate, ctx, setCtx, refreshPeriods }: { navigate: (s: Screen) => void; ctx: Ctx; setCtx: (c: Partial<Ctx>) => void; refreshPeriods: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<"" | "upload" | "process">("");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [meta, setMeta] = useState<{ cse: string; period: string } | null>(null);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const history = useFetch(() => api.submissions(), [result?.submission_id, complete]);

  const choose = async (list: FileList | null) => {
    setError(""); setResult(null); setComplete(false); setMeta(null);
    const picked = Array.from(list ?? []);
    setFiles(picked);
    if (!picked.length) return;
    setBusy("upload");
    try {
      let r: IngestResult;
      if (picked.length === 1 && picked[0].name.toLowerCase().endsWith(".json")) {
        const raw = await picked[0].text();
        try { const j = JSON.parse(raw); setMeta({ cse: j.cse?.cse_id ?? j.submission_metadata?.cse_id, period: periodLabelFromDate(j.submission_metadata?.assessment_period_start ?? "") }); } catch { /* server reports it */ }
        r = await api.uploadJson(raw);
      } else if (picked.every((f) => f.name.toLowerCase().endsWith(".csv"))) {
        r = await api.uploadCsv(picked);
      } else {
        throw new Error("Choose one .json envelope, or the per-entity .csv files (submission_metadata, cse, assets, alerts, cases, ...).");
      }
      setResult(r);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  };

  const process = async () => {
    if (!result?.submission_id) return;
    setBusy("process"); setError("");
    try {
      const a = await api.process(result.submission_id);
      setCtx({ cseId: a.cse.cse_id, period: a.period.label });
      setComplete(true);
      refreshPeriods();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  };

  const v = result?.validation;
  const uploaded = !!result;
  const canProcess = !!v?.valid && !!result?.submission_id && busy === "" && !complete;
  const steps = ["File uploaded", "Schema validation", "Entity resolution", "Normalization", "Ready for analysis"];
  const stepDone = (i: number) => (complete ? true : uploaded ? (v?.valid ? i <= 3 : i <= 1) : false);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Evidence ingestion" title="Submission management" description="Upload periodic SOC records, validate data quality, and prepare an assessment dataset." action={<Badge tone="blue">{result?.submission_id ? `Submission ID · ${result.submission_id}` : "No file selected"}</Badge>} />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-6 xl:col-span-3">
          <div className="text-lg font-bold">Upload SOC evidence</div>
          <div className="mt-1 text-sm text-slate-500">The critical sector entity and assessment period are read from the submission metadata.</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><span className="mb-2 block text-sm font-semibold text-slate-700">Critical sector entity</span><div className="min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">{meta?.cse ?? "Detected from file"}</div></div>
            <div><span className="mb-2 block text-sm font-semibold text-slate-700">Assessment period</span><div className="min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">{meta?.period ? prettyPeriod(meta.period) : "Detected from file"}</div></div>
          </div>
          <div className={`mt-6 rounded-xl border-2 border-dashed p-8 text-center transition ${uploaded && v?.valid ? "border-emerald-300 bg-emerald-50" : uploaded ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50"}`}>
            <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${uploaded && v?.valid ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}><Icon name={uploaded && v?.valid ? "check" : "upload"} /></div>
            <div className="mt-4 font-bold text-slate-900">{files.length ? (files.length === 1 ? files[0].name : `${files.length} CSV files`) : "Choose SOC records"}</div>
            <div className="mt-1 text-sm text-slate-500">{busy === "upload" ? "Uploading and validating…" : v ? `${Object.values(v.record_counts).reduce((a, b) => a + b, 0).toLocaleString()} records · ${v.valid ? "Ready to process" : "Validation failed"}` : "One JSON envelope, or the per-entity CSV files · stays on this machine"}</div>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {files.length ? "Replace file(s)" : "Select file(s)"}
              <input type="file" multiple accept=".json,.csv" className="sr-only" aria-label="Select submission files" onChange={(e) => { void choose(e.target.files); e.target.value = ""; }} />
            </label>
          </div>
          {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Icon name="lock" size="sm" /> Files remain inside the secure environment</div>
            <Button disabled={!canProcess} onClick={process}>
              {busy === "process" ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Processing...</> : <><Icon name="trend" size="sm" /> Process submission</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between"><div className="text-lg font-bold">Processing status</div>{complete && <Badge tone="green">Complete</Badge>}</div>
          <div className="mt-7 space-y-1">
            {steps.map((step, index) => {
              const active = stepDone(index);
              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}>{active ? <Icon name="check" size="sm" /> : index + 1}</div>
                    {index < 4 && <div className={`h-9 w-px ${active ? "bg-blue-300" : "bg-slate-200"}`} />}
                  </div>
                  <div className={`pt-1 text-sm font-semibold ${active ? "text-slate-900" : "text-slate-400"}`}>{step}</div>
                </div>
              );
            })}
          </div>
          {complete && <Button onClick={() => navigate("assessment")} className="mt-5 w-full">Open CSE assessment <Icon name="arrow" size="sm" /></Button>}
        </Card>
      </div>

      {v && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="font-bold">Validation summary</div><div className="mt-1 text-xs text-slate-500">Data-quality checks only · warnings are not operational findings.</div></div>
            <div className="flex gap-2"><Badge tone={v.errors.length ? "red" : "green"}>{v.errors.length} error{v.errors.length === 1 ? "" : "s"}</Badge><Badge tone={v.warnings.length ? "amber" : "green"}>{v.warnings.length} warning{v.warnings.length === 1 ? "" : "s"}</Badge></div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {Object.entries(v.record_counts).map(([k, n]) => <div key={k} className="bg-white px-5 py-3"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.replace(/_/g, " ")}</div><div className="mt-1 text-lg font-bold">{n.toLocaleString()}</div></div>)}
          </div>
          {(v.errors.length > 0 || v.warnings.length > 0) && (
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 text-sm">
              {v.errors.slice(0, 50).map((m, i) => <div key={`e${i}`} className="flex gap-3 px-5 py-3"><Badge tone="red">Error</Badge><span className="text-slate-700">{m}</span></div>)}
              {v.warnings.slice(0, 50).map((m, i) => <div key={`w${i}`} className="flex gap-3 px-5 py-3"><Badge tone="amber">Warning</Badge><span className="text-slate-700">{m}</span></div>)}
            </div>
          )}
          <div className="border-t border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-900"><strong>Important:</strong> Missing or duplicate records are data-quality warnings. They are not treated as proof of weak SOC performance.</div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5"><div className="font-bold">Submission history</div><div className="mt-1 text-xs text-slate-500">All submissions stored in the local database.</div></div>
        <Gate state={history}>{(h) => (
          <div className="overflow-x-auto"><table className="w-full min-w-2xl text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Submission</th><th className="px-5 py-3 font-semibold">CSE</th><th className="px-5 py-3 font-semibold">Period</th><th className="px-5 py-3 font-semibold">Format</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{h.submissions.slice(0, 12).map((s) => (
              <tr key={s.submission_id} className="hover:bg-slate-50"><td className="px-5 py-3 font-mono text-xs">{s.submission_id}</td><td className="px-5 py-3">{s.cse_id}</td><td className="px-5 py-3">{prettyPeriod(periodLabelFromDate(s.period_start))}</td><td className="px-5 py-3">{s.source_format}</td><td className="px-5 py-3"><Badge tone={s.processed_at ? "green" : "blue"}>{s.processed_at ? "Processed" : "Ingested"}</Badge></td></tr>
            ))}</tbody></table></div>
        )}</Gate>
      </Card>
    </div>
  );
}

function Assessment({ navigate, ctx, setCtx }: { navigate: (s: Screen) => void; ctx: Ctx; setCtx: (c: Partial<Ctx>) => void }) {
  const a = useFetch(() => api.assessment(ctx.cseId, ctx.period), [ctx.cseId, ctx.period]);
  const cfg = useFetch(() => api.config(), []);
  const dash = useFetch(() => api.dashboard(ctx.period), [ctx.period]);
  const [showCfg, setShowCfg] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const openSignal = (s: Signal) => {
    if (s.case_id) { setCtx({ caseId: s.case_id }); navigate("case"); } else navigate("worklist");
  };
  const cseSelect = (
    <SelectControl ariaLabel="CSE" value={ctx.cseId} onChange={(id) => setCtx({ cseId: id })}>
      {(dash.data?.cse_rows ?? [{ cse_id: ctx.cseId, name: ctx.cseId }]).map((r) => <option key={r.cse_id} value={r.cse_id}>{r.name}</option>)}
    </SelectControl>
  );

  return (
    <div className="space-y-7">
      <Gate state={a}>{(d) => {
        const prio = [...d.signals].sort((x, y) => (x.priority === y.priority ? y.score - x.score : x.priority === "HIGH" ? -1 : 1));
        const shown = showAll ? prio : prio.slice(0, 8);
        const dist: Record<string, number> = {};
        d.signals.forEach((s) => { dist[s.category] = (dist[s.category] ?? 0) + 1; });
        const distEntries = Object.entries(dist).sort((p, q) => q[1] - p[1]);
        const rc = d.record_counts;
        const total = Object.values(rc).reduce((p, q) => p + q, 0);
        return (
          <>
            <PageHeader
              eyebrow={`CSE assessment · ${prettyPeriod(d.period.label)}`}
              title={d.cse.cse_name}
              description={`${d.cse.sector?.replace(/_/g, " ")} · ${d.cse.operational_unit ?? ""} · Assessment ID ${d.assessment_id}`}
              action={<div className="flex flex-wrap items-center gap-2">{cseSelect}<Badge tone={d.signals.length ? "red" : "green"}>{d.signals.length} review signals</Badge><Badge tone="blue">Analysis complete</Badge></div>}
            />
            <Card className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon name="shield" /></div>
                  <div><div className="font-bold">Assessment context</div><div className="mt-1 text-sm text-slate-500">{total.toLocaleString()} records · {rc.alerts} alerts · {rc.cases} cases · {rc.evidence} evidence items</div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="slate">Threshold profile v{cfg.data?._version ?? "1"}</Badge>
                  <Button variant="secondary" onClick={() => navigate("submissions")}><Icon name="document" size="sm" /> View submission</Button>
                </div>
              </div>
            </Card>

            <div>
              <div className="mb-4 flex items-end justify-between">
                <div><div className="text-lg font-bold">Core metrics</div><div className="mt-1 text-sm text-slate-500">Calculated from the submitted operational records.</div></div>
                <Button variant="ghost" onClick={() => setShowCfg((s) => !s)}><Icon name="filter" size="sm" /> {showCfg ? "Hide thresholds" : "Configure thresholds"}</Button>
              </div>
              {showCfg && cfg.data && (
                <Card className="mb-4 p-5">
                  <div className="text-sm font-bold">Active review thresholds (config v{cfg.data._version ?? "1"})</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{Object.entries(cfg.data.metric_thresholds).map(([k, v]) => <div key={k} className="rounded-lg bg-slate-50 px-3 py-2"><div className="text-xs font-semibold text-slate-500">{k.replace(/_/g, " ")}</div><div className="font-bold">{v}</div></div>)}</div>
                  <div className="mt-3 text-xs text-slate-500">Thresholds are stored as versioned configuration in the backend (PUT /api/v1/config); every signal records the config version that produced it.</div>
                </Card>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {d.metrics.map((metric) => {
                  const { tone, status } = metricTone(metric, cfg.data?.metric_thresholds);
                  const pct = metric.value === null ? 0 : Math.max(2, Math.min(100, metric.code === "KECG" ? metric.value * 5 : metric.value));
                  return (
                    <Card key={metric.code} className="p-5">
                      <div className="flex items-start justify-between"><div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{metric.code}</div><Badge tone={tone}>{status}</Badge></div>
                      <div className="mt-5 text-2xl font-bold tracking-tight">{metricDisplay(metric)}</div>
                      <div className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{metric.label}</div>
                      <div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${tone === "green" ? "bg-emerald-500" : tone === "red" ? "bg-red-500" : tone === "slate" ? "bg-slate-300" : "bg-amber-500"}`} style={{ width: `${pct}%` }} /></div>
                      <div className="mt-2 text-xs text-slate-400">{metric.sample.sufficient ? `Sample ${metric.sample.sample_size}` : `Sample ${metric.sample.sample_size} < minimum ${metric.sample.minimum}`}</div>
                    </Card>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate-500">Computed by the offline SAT-SA analytics engine from submitted records; review conditions are configurable and this is not a composite cyber-resilience score.</div>
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <Card className="overflow-hidden xl:col-span-3">
                <div className="border-b border-slate-200 p-5"><div className="font-bold">Supervisory signals</div><div className="mt-1 text-xs text-slate-500">Select a signal to follow its reason and supporting evidence.</div></div>
                <div className="divide-y divide-slate-100">
                  {shown.length === 0 && <div className="p-5 text-sm text-slate-500">No supervisory signals were generated for this CSE and period.</div>}
                  {shown.map((s) => {
                    const tone = PRIORITY_TONE(s.priority);
                    return (
                      <div key={s.signal_id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}><Icon name="warning" size="sm" /></div>
                        <div className="min-w-0 flex-1"><div className="font-semibold text-slate-900">{s.title}</div><div className="mt-1 line-clamp-2 text-sm text-slate-500">{s.case_id ? `${s.case_id} · ` : ""}{s.rationale}</div></div>
                        <Badge tone={tone}>{titleCase(s.priority)}</Badge>
                        <Button variant="secondary" onClick={() => openSignal(s)}>View evidence <Icon name="arrow" size="sm" /></Button>
                      </div>
                    );
                  })}
                </div>
                {prio.length > 8 && <div className="border-t border-slate-100 p-3 text-center"><Button variant="ghost" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show top 8 only" : `Show all ${prio.length} signals`}</Button></div>}
              </Card>
              <Card className="p-5 xl:col-span-2">
                <div className="font-bold">Signal distribution</div><div className="mt-1 text-xs text-slate-500">By supervisory category</div>
                <div className="mt-7 rounded-xl bg-slate-50 p-5 text-center">
                  <div className="text-3xl font-bold text-slate-950">{d.signals.length}</div>
                  <div className="mt-1 text-xs text-slate-500">active supervisory signals</div>
                  <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-200">{distEntries.map(([c, n], i) => <span key={c} className={CAT_COLORS[i % CAT_COLORS.length]} style={{ width: `${(n / Math.max(1, d.signals.length)) * 100}%` }} />)}</div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3 text-xs">{distEntries.map(([c, n], i) => <div key={c} className="flex items-center justify-between text-slate-600"><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${CAT_COLORS[i % CAT_COLORS.length]}`} />{catLabel(c)}</span><span className="font-bold">{n}</span></div>)}</div>
              </Card>
            </div>
          </>
        );
      }}</Gate>
    </div>
  );
}

function Worklist({ navigate, ctx, setCtx }: { navigate: (s: Screen) => void; ctx: Ctx; setCtx: (c: Partial<Ctx>) => void }) {
  const wl = useFetch(() => api.worklist(ctx.period), [ctx.period]);
  const [priority, setPriority] = useState("All priorities");
  const [cse, setCse] = useState("All CSEs");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <Gate state={wl}>{(d) => {
        const rows = d.rows;
        const cses = Array.from(new Set(rows.map((r) => r.cse)));
        const cats = Array.from(new Set(rows.map((r) => r.category)));
        const visible = rows.filter((r) =>
          (priority === "All priorities" || titleCase(r.priority) === priority) &&
          (cse === "All CSEs" || r.cse === cse) &&
          (category === "All categories" || r.category === category) &&
          (status === "All statuses" || r.status === status) &&
          (!query || `${r.id} ${r.cse} ${r.signal} ${r.type}`.toLowerCase().includes(query.toLowerCase())));
        const why = visible.find((r) => r.signal_id === focus) ?? visible[0];
        const pending = rows.filter((r) => r.status === "Not started" || r.status === "In review").length;
        return (
          <>
            <PageHeader eyebrow="Human review queue" title="Prioritized review worklist" description="Cases are ranked by configurable review conditions. Priority supports triage and is not a definitive measure of SOC quality." action={<Badge tone="amber">{pending} pending reviews</Badge>} />
            <Card className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1"><span className="pointer-events-none absolute left-3 top-3 text-slate-400"><Icon name="search" size="sm" /></span><div className="pl-8"><TextInput ariaLabel="Search cases" placeholder="Search case ID, CSE or signal..." onChange={setQuery} /></div></div>
                <div className="flex flex-wrap gap-2">
                  <SelectControl ariaLabel="CSE filter" value={cse} onChange={setCse}><option>All CSEs</option>{cses.map((c) => <option key={c}>{c}</option>)}</SelectControl>
                  <SelectControl ariaLabel="Priority filter" value={priority} onChange={setPriority}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></SelectControl>
                  <SelectControl ariaLabel="Category filter" value={category} onChange={setCategory}><option value="All categories">All categories</option>{cats.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}</SelectControl>
                  <SelectControl ariaLabel="Status filter" value={status} onChange={setStatus}><option>All statuses</option><option>Not started</option><option>In review</option><option>Confirmed</option><option>Dismissed</option></SelectControl>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-5xl text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 font-semibold">Case</th><th className="px-5 py-3 font-semibold">CSE</th><th className="px-5 py-3 font-semibold">Signal category</th><th className="px-5 py-3 font-semibold">Reason for prioritization</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">No signals match the current filters.</td></tr>}
                    {visible.slice(0, 100).map((row) => {
                      const isCase = !row.id.startsWith("SIG-");
                      return (
                        <tr key={row.signal_id} onClick={() => setFocus(row.signal_id)} className={`cursor-pointer ${row.id === "CASE-1042" ? "bg-blue-50/50" : "hover:bg-slate-50"} ${why?.signal_id === row.signal_id ? "outline outline-1 -outline-offset-1 outline-blue-300" : ""}`}>
                          <td className="px-5 py-4"><Badge tone={PRIORITY_TONE(row.priority)}>{titleCase(row.priority)}</Badge></td>
                          <td className="px-5 py-4"><div className="font-bold text-blue-700">{isCase ? row.id : "CSE-level signal"}</div><div className="mt-1 text-xs text-slate-500">{row.type}</div></td>
                          <td className="px-5 py-4 font-medium">{row.cse}</td>
                          <td className="px-5 py-4 text-slate-600">{catLabel(row.category)}</td>
                          <td className="max-w-md px-5 py-4 text-slate-600"><div className="line-clamp-2">{row.reason}</div></td>
                          <td className="px-5 py-4"><Badge tone={STATUS_TONE(row.status)}>{row.status}</Badge></td>
                          <td className="px-5 py-4"><Button variant={row.id === "CASE-1042" ? "primary" : "secondary"} onClick={() => { if (isCase) { setCtx({ caseId: row.id, cseId: row.cse_id }); navigate("case"); } else { setCtx({ cseId: row.cse_id }); navigate("assessment"); } }}>{isCase ? "Review case" : "View assessment"}</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {visible.length > 100 && <div className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">Showing the top 100 of {visible.length} signals — narrow the filters to see the rest.</div>}
            </Card>

            {why && (
              <Card className="overflow-hidden border-blue-200">
                <div className="flex flex-col gap-5 bg-blue-50 p-6 lg:flex-row lg:items-center">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Icon name="evidence" /></div>
                  <div className="flex-1">
                    <div className="font-bold text-blue-950">Why was {why.id.startsWith("SIG-") ? `this ${catLabel(why.category).toLowerCase()} signal` : why.id} prioritized?</div>
                    <div className="mt-2 text-sm leading-6 text-blue-900">{why.reason}</div>
                  </div>
                  <div className="min-w-40 rounded-lg border border-blue-200 bg-white p-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Priority Score</div>
                    <div className="mt-1 text-2xl font-bold text-blue-800">{Math.round(why.priority_score)}<span className="text-sm text-slate-400">/100</span></div>
                    <div className="mt-1 text-xs text-slate-500">Configurable triage aid</div>
                  </div>
                </div>
              </Card>
            )}
          </>
        );
      }}</Gate>
    </div>
  );
}

function CaseDetailScreen({ navigate, ctx }: { navigate: (s: Screen) => void; ctx: Ctx }) {
  const c = useFetch(() => api.caseDetail(ctx.caseId), [ctx.caseId]);
  const cfg = useFetch(() => api.config(), []);
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Button variant="ghost" onClick={() => navigate("worklist")} className="px-2">Review worklist</Button><Icon name="arrow" size="sm" /><span>{ctx.caseId}</span></div>
      <Gate state={c}>{(d) => {
        const sig = d.signals[0];
        const th = cfg.data?.metric_thresholds;
        const records = [
          ...d.evidence.map((e) => ({ id: e.evidence_id, type: e.evidence_type, source: e.source_system, time: e.event_timestamp, ref: e.reference_id, integrity: e.integrity_reference ?? e.availability_status })),
          ...d.investigation_actions.map((a) => ({ id: a.investigation_action_id, type: `Investigation action · ${a.action_type}`, source: `Analyst ${a.actor_id}`, time: a.action_timestamp, ref: a.investigation_action_id, integrity: "Recorded in case management" })),
        ].sort((x, y) => (x.time ?? "").localeCompare(y.time ?? ""));
        const open = openEvidence ?? records[0]?.id ?? null;
        const ttcp = d.metrics.TTCP, ics = d.metrics.ICS;
        return (
          <>
            <PageHeader
              eyebrow={sig ? `${titleCase(sig.priority)} priority · ${catLabel(sig.category)}` : "No active supervisory signal"}
              title={d.case_id}
              description={`${d.cse.cse_name} · ${d.alert.alert_type ?? d.case.case_type} · ${titleCase(d.alert.severity ?? "n/a")} severity · ${titleCase(d.case.status)}`}
              action={<Button disabled={!sig} onClick={() => navigate("decision")}>Continue to decision <Icon name="arrow" size="sm" /></Button>}
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[["Opened", fmtDateTime(d.case.opened_at)], ["Closed", fmtDateTime(d.case.closed_at)], ["Time to close", fmtDuration(d.case.opened_at, d.case.closed_at)], ["Comparison group", `${d.alert.alert_type ?? "—"} · ${titleCase(d.alert.severity ?? "")}`]].map(([label, value]) => (
                <Card key={label} className="p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>{label === "Comparison group" && <div className="mt-1 text-xs text-slate-500">{d.comparison_group}</div>}</Card>
              ))}
            </div>

            {sig && (
              <Card className="overflow-hidden border-amber-200">
                <div className="border-b border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700"><Icon name="warning" /></div><div><div className="text-xs font-bold uppercase tracking-wide text-amber-700">Supervisory signal</div><div className="mt-1 text-lg font-bold text-slate-950">{sig.title}</div></div></div></div>
                <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    ["Time-to-close percentile", ttcp === null ? "n/a" : ordinal(ttcp), th ? `Review condition: at or below ${ordinal(th.TTCP_fast_percentile)}` : "Within comparison group"],
                    ["Investigation completeness", ics === null ? "n/a" : `${Math.round(ics)}%`, th ? `Review condition: below ${th.ICS_low}%` : ""],
                    ["Review priority score", `${Math.round(sig.score)}/100`, "Configurable triage aid"],
                  ].map(([label, value, desc]) => (
                    <div key={label} className="p-5"><div className="text-sm font-medium text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div><div className="mt-1 text-xs text-slate-500">{desc}</div></div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid gap-6 xl:grid-cols-5">
              <Card className="p-6 xl:col-span-3">
                <div className="font-bold">Investigation timeline</div><div className="mt-1 text-xs text-slate-500">Submitted operational records in chronological order.</div>
                <div className="mt-6">
                  {d.timeline.map((t, index) => (
                    <div key={`${t.record_id}-${index}`} className="flex gap-4">
                      <div className="flex flex-col items-center"><div className="grid h-8 w-8 place-items-center rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700"><span className="h-2 w-2 rounded-full bg-blue-600" /></div>{index < d.timeline.length - 1 && <div className="h-14 w-px bg-slate-200" />}</div>
                      <div className="flex flex-1 flex-col gap-1 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-sm font-semibold">{t.activity}</div><div className="mt-1 text-xs text-slate-500">{t.type} · {t.record_id}</div></div><span className="text-xs font-bold text-slate-500">{fmtTime(t.timestamp)}</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden xl:col-span-2">
                <div className="border-b border-slate-200 p-5"><div className="font-bold">Investigation checklist</div><div className="mt-1 text-xs text-slate-500">Applicable documentation requirements</div></div>
                <div className="divide-y divide-slate-100">
                  {d.checklist.map((it) => (
                    <div key={it.key} className="flex items-center justify-between px-5 py-3.5 text-sm"><span className="text-slate-700">{it.label}</span><Badge tone={it.recorded ? "green" : "red"}>{it.recorded ? "Recorded" : "Missing"}</Badge></div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 p-5"><div className="font-bold">Evidence drill-down</div><div className="mt-1 text-xs text-slate-500">Select a record to inspect source metadata.</div></div>
              <div className="divide-y divide-slate-100">
                {records.length === 0 && <div className="p-5 text-sm text-slate-500">No supporting evidence was found in the submitted dataset for this case.</div>}
                {records.map((r) => (
                  <div key={r.id}>
                    <Button variant="ghost" onClick={() => setOpenEvidence(open === r.id ? "" : r.id)} className="w-full justify-start rounded-none px-5 py-4 text-left">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="document" size="sm" /></div>
                      <div className="flex-1"><div className="font-semibold text-slate-900">{r.id} · {r.type}</div><div className="mt-0.5 text-xs font-normal text-slate-500">{r.source} · {fmtDateTime(r.time)}</div></div>
                      <Icon name="chevron" size="sm" />
                    </Button>
                    {open === r.id && (
                      <div className="grid gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm sm:grid-cols-3">
                        <div><span className="block text-xs font-semibold text-slate-500">Source reference</span><span className="mt-1 block font-mono text-slate-800">{r.ref}</span></div>
                        <div><span className="block text-xs font-semibold text-slate-500">Integrity / availability</span><span className="mt-1 block text-slate-800">{r.integrity}</span></div>
                        <div><span className="block text-xs font-semibold text-slate-500">Entity match</span><span className="mt-1 block text-slate-800">{d.case_id} · {d.cse.cse_id}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-blue-200 bg-blue-50 p-6">
              <div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Icon name="evidence" /></div>
                <div>
                  <div className="font-bold text-blue-950">Analytical explanation</div>
                  <div className="mt-2 text-sm leading-6 text-blue-900">{d.evidence_chain.explanation} {sig && <strong>The signal does not establish that the investigation was inadequate.</strong>}</div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-blue-800"><Badge tone="blue">Metric</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Deviation</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Signal</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Evidence</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Explanation</Badge></div>
                  {d.decisions.length > 0 && <div className="mt-4 text-xs text-blue-900">Previously recorded decisions for this case: {d.decisions.map((x) => `${x.decision} (${fmtDateTime(x.created_at)})`).join("; ")}</div>}
                </div>
              </div>
            </Card>
          </>
        );
      }}</Gate>
    </div>
  );
}

function Decision({ navigate, ctx, user, onDone }: { navigate: (s: Screen) => void; ctx: Ctx; user: Session; onDone: (d: DecisionRecord) => void }) {
  const c = useFetch(() => api.caseDetail(ctx.caseId), [ctx.caseId]);
  const [decision, setDecision] = useState("Request further review");
  const [comment, setComment] = useState("Additional investigation evidence is required before determining whether the case was handled appropriately.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = [
    ["Confirm concern", "Evidence supports recording a supervisory concern.", "red"],
    ["Dismiss signal", "Evidence provides a sufficient explanation for the deviation.", "green"],
    ["Request further review", "Additional evidence or expert review is required.", "blue"],
  ];
  const submit = async () => {
    setBusy(true); setError("");
    try { onDone(await api.decide(ctx.caseId, { decision, comment: comment.trim(), actor_id: user.id, actor_name: user.name })); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Button variant="ghost" onClick={() => navigate("case")} className="px-2">{ctx.caseId}</Button><Icon name="arrow" size="sm" /><span>Supervisor decision</span></div>
      <PageHeader eyebrow="Human-in-the-loop review" title="Supervisor decision" description="Record your determination for the supervisory signal on this case." />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card className="p-6">
            <div className="text-lg font-bold">Select a decision</div><div className="mt-1 text-sm text-slate-500">SAT-SA supports this decision; it does not make it.</div>
            <div className="mt-6 grid gap-3">
              {options.map(([label, desc, tone]) => (
                <Button key={label} variant="ghost" onClick={() => setDecision(label)} className={`min-h-20 w-full justify-start border p-4 text-left ${decision === label ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone === "red" ? "bg-red-100 text-red-700" : tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}><Icon name={label === "Dismiss signal" ? "check" : label === "Confirm concern" ? "warning" : "search"} /></span>
                  <span className="flex-1"><span className="block font-bold text-slate-900">{label}</span><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{desc}</span></span>
                  <span className={`h-5 w-5 rounded-full border-2 ${decision === label ? "border-blue-600 bg-blue-600 ring-4 ring-blue-100" : "border-slate-300"}`} />
                </Button>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <label className="block"><span className="text-lg font-bold">Supervisor comments</span><span className="mt-1 block text-sm text-slate-500">Explain the evidence and reasoning supporting your decision.</span><div className="mt-4"><TextArea value={comment} onChange={setComment} /></div></label>
            <div className="mt-2 text-right text-xs text-slate-400">{comment.length} characters</div>
          </Card>
        </div>
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5"><div className="font-bold">Supporting evidence</div><div className="mt-1 text-xs text-slate-500">{ctx.caseId}{c.data ? ` · ${c.data.cse.cse_name}` : ""}</div></div>
            <div className="space-y-4 p-5">
              {c.loading && <div className="text-sm text-slate-500">Loading…</div>}
              {c.error && <div className="text-sm text-red-700">{c.error}</div>}
              {c.data && [
                ["Time-to-close", `${fmtDuration(c.data.case.opened_at, c.data.case.closed_at)}${c.data.metrics.TTCP === null ? "" : ` · ${ordinal(c.data.metrics.TTCP)} percentile`}`],
                ["Investigation completeness", c.data.metrics.ICS === null ? "n/a" : `${Math.round(c.data.metrics.ICS)}%`],
                ["Missing requirements", c.data.checklist.filter((i) => !i.recorded).map((i) => i.label).join(", ") || "None"],
                ["Evidence records", `${c.data.evidence.filter((e) => e.availability_status === "AVAILABLE").length} available of ${c.data.evidence.length}`],
              ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value}</span></div>)}
            </div>
            <div className="border-t border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-900">The signal indicates a need for review, not a predetermined finding.</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="user" size="sm" /></div><div><div className="text-sm font-bold">{user.name} · {user.id}</div><div className="text-xs text-slate-500">NCIIPC Supervisor</div></div></div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Submitting creates an immutable audit entry linked to the case, signal, decision, supervisor, and timestamp.</div>
          </Card>
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Button disabled={!comment.trim() || busy} onClick={submit} className="w-full">{busy ? "Recording…" : <>Submit audited decision <Icon name="arrow" size="sm" /></>}</Button>
          <Button variant="secondary" onClick={() => navigate("case")} className="w-full">Return to evidence</Button>
        </div>
      </div>
    </div>
  );
}

function ReportScreen({ navigate, ctx, last, showToast }: { navigate: (s: Screen) => void; ctx: Ctx; last: DecisionRecord | null; showToast: (m: string) => void }) {
  const r = useFetch(() => api.report(ctx.cseId, ctx.period), [ctx.cseId, ctx.period, last?.decision_id]);
  const exportJson = async () => {
    try {
      const rep = await api.exportReport(ctx.cseId, ctx.period);
      const url = URL.createObjectURL(new Blob([JSON.stringify(rep, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${rep.assessment_id}.json`; a.click();
      URL.revokeObjectURL(url);
      showToast("Report export package created");
    } catch (e) { showToast((e as Error).message); }
  };
  return (
    <div className="space-y-7">
      <Gate state={r}>{(d) => {
        const decisionFor = (caseId: string | null) => (caseId ? [...d.decisions].reverse().find((x) => x.case_id === caseId) : undefined);
        const findings = d.findings.filter((f) => f.case_id);
        const ordered = [...findings].sort((a, b) => Number(!!decisionFor(b.case_id)) - Number(!!decisionFor(a.case_id)));
        const latest = last ?? [...d.decisions].sort((a, b) => a.created_at.localeCompare(b.created_at)).pop() ?? null;
        const statusOf = (x?: DecisionRecord): [string, BadgeTone] => !x ? ["Pending response", "amber"] : x.decision === "Confirm concern" ? ["Confirmed", "red"] : x.decision === "Dismiss signal" ? ["Closed", "green"] : ["In review", "blue"];
        return (
          <>
            <PageHeader eyebrow={`Assessment report · ${d.assessment_id}`} title={`${d.cse.cse_name} · ${prettyPeriod(d.period.label)}`} description="Supervisory assessment summary generated from submitted records and completed human reviews."
              action={<div className="flex gap-2"><Button variant="secondary" onClick={() => window.print()}><Icon name="download" size="sm" /> Print / save PDF</Button><Button onClick={exportJson}><Icon name="report" size="sm" /> Export report</Button></div>} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[["Records analyzed", d.records_analyzed.toLocaleString()], ["Metrics calculated", String(d.metrics_calculated)], ["Signals generated", String(d.signals_generated)], ["Cases reviewed", `${d.cases_reviewed} of ${findings.length}`]].map(([label, value]) => <Card key={label} className="p-5"><div className="text-sm font-semibold text-slate-500">{label}</div><div className="mt-3 text-3xl font-bold">{value}</div></Card>)}
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="overflow-hidden xl:col-span-2">
                <div className="border-b border-slate-200 p-5"><div className="font-bold">Findings and decisions</div><div className="mt-1 text-xs text-slate-500">Human determinations for prioritized supervisory signals (reviewed cases first).</div></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-2xl text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Case</th><th className="px-5 py-3 font-semibold">Signal</th><th className="px-5 py-3 font-semibold">Supervisor decision</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordered.slice(0, 12).map((f) => { const dec = decisionFor(f.case_id); const [label, tone] = statusOf(dec); return (
                        <tr key={f.signal_id} className={dec ? "bg-blue-50/50" : ""}><td className="px-5 py-4 font-bold text-blue-700">{f.case_id}</td><td className="px-5 py-4">{f.title}</td><td className="px-5 py-4 font-medium">{dec ? dec.decision : "—"}</td><td className="px-5 py-4"><Badge tone={tone}>{label}</Badge></td></tr>
                      ); })}
                      {ordered.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No case-level signals for this assessment.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {ordered.length > 12 && <div className="border-t border-slate-100 p-3 text-center text-xs text-slate-500">Showing 12 of {ordered.length} case-level findings. The full list is in the exported report.</div>}
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-lg ${latest ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><Icon name="check" /></div><div><div className="font-bold">{latest ? "Decision recorded" : "No decision recorded yet"}</div><div className="text-xs text-slate-500">{latest ? "Audit trail complete" : "Review a case to record one"}</div></div></div>
                {latest && <div className="mt-6 space-y-4 text-sm">{[["Supervisor", `${latest.actor_name ?? latest.actor_id} · ${latest.actor_id}`], ["Case", latest.case_id], ["Decision", latest.decision], ["Timestamp", fmtDateTime(latest.created_at)], ["Audit reference", latest.audit_reference ?? latest.decision_id]].map(([label, value]) => <div key={label}><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-1 break-words font-medium text-slate-900">{value}</div></div>)}</div>}
              </Card>
            </div>
            <Card className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name="document" /></div>
                <div className="flex-1"><div className="font-bold">Recommended follow-up</div><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{d.recommendations.map((x) => <li key={x}>{x}</li>)}</ul><div className="mt-3 text-xs text-slate-500">{d.audit_note}</div></div>
                <div className="flex shrink-0 flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate("worklist")}>Return to worklist</Button><Button onClick={() => navigate("dashboard")}>Return to dashboard</Button></div>
              </div>
            </Card>
            <div className="text-center text-xs text-slate-500">Illustrative prototype report · Not an official NCIIPC assessment or validated benchmark.</div>
          </>
        );
      }}</Gate>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [ctx, setCtxState] = useState<Ctx>({ cseId: "CSE-ALPHA", period: "Q3-2026", caseId: "CASE-1042" });
  const [last, setLast] = useState<DecisionRecord | null>(null);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const subs = useFetch(() => api.submissions(), [tick, session?.id]);

  const setCtx = (c: Partial<Ctx>) => setCtxState((prev) => ({ ...prev, ...c }));
  const periods = Array.from(new Set((subs.data?.submissions ?? []).map((s) => periodLabelFromDate(s.period_start)))).sort();
  // If the selected period isn't in the database, fall back to the latest one available.
  useEffect(() => {
    if (periods.length && !periods.includes(ctx.period)) setCtxState((p) => ({ ...p, period: periods[periods.length - 1] }));
  }, [periods.join(",")]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  if (!session) return <Login onLogin={setSession} />;

  return (
    <Shell screen={screen} setScreen={setScreen} onLogout={() => setSession(null)} user={session}>
      {subs.error && <div className="mb-6"><ErrorCard message={subs.error} /></div>}
      {screen === "dashboard" && <Dashboard navigate={setScreen} ctx={ctx} setCtx={setCtx} periods={periods.length ? periods : [ctx.period]} />}
      {screen === "submissions" && <Submissions navigate={setScreen} ctx={ctx} setCtx={setCtx} refreshPeriods={() => setTick((t) => t + 1)} />}
      {screen === "assessment" && <Assessment navigate={setScreen} ctx={ctx} setCtx={setCtx} />}
      {screen === "worklist" && <Worklist navigate={setScreen} ctx={ctx} setCtx={setCtx} />}
      {screen === "case" && <CaseDetailScreen navigate={setScreen} ctx={ctx} />}
      {screen === "decision" && <Decision navigate={setScreen} ctx={ctx} user={session} onDone={(d) => { setLast(d); showToast("Decision recorded in the audit trail"); setScreen("report"); }} />}
      {screen === "report" && <ReportScreen navigate={setScreen} ctx={ctx} last={last} showToast={showToast} />}
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500"><Icon name="check" size="sm" /></span>{toast}
        </div>
      )}
    </Shell>
  );
}
