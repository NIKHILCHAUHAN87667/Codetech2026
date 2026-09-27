import { createElement, useState, type ReactNode } from "react";

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

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900" />
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full border border-blue-500/20 bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10">
          <Brand />
        </div>
        <div className="relative z-10 max-w-xl">
          <Badge tone="blue">NCIIPC supervisory portal</Badge>
          <div className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Evidence-led supervision for cyber operations.
          </div>
          <div className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
            Turn periodic SOC records into explainable signals, prioritized reviews, and auditable supervisory decisions.
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm text-slate-400">
            <div><span className="block font-bold text-white">Explainable</span> Every signal</div>
            <div><span className="block font-bold text-white">Evidence-led</span> Every review</div>
            <div><span className="block font-bold text-white">Human-led</span> Every decision</div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-slate-400">
          <Icon name="lock" size="sm" /> Offline processing · Secure environment
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="inline-flex rounded-xl bg-slate-900 p-3"><Brand /></div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</div>
          <div className="mt-2 text-sm text-slate-600">Sign in to continue to the supervisory workspace.</div>
          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Supervisor ID</span>
              <TextInput ariaLabel="Supervisor ID" defaultValue="SUP-2741" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <TextInput ariaLabel="Password" defaultValue="demo-access" type="password" />
            </label>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500"><Icon name="lock" size="sm" /> Authorized access only</span>
              <span className="font-semibold text-blue-700">Demo account</span>
            </div>
            <Button onClick={onLogin} className="w-full">
              Sign in securely <Icon name="arrow" size="sm" />
            </Button>
          </div>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
            This demonstration uses fictional entities and illustrative metrics. No production records are present.
          </div>
        </div>
      </section>
    </main>
  );
}

function Shell({
  screen,
  setScreen,
  onLogout,
  children,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
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
              <div className="truncate text-sm font-semibold text-white">A. Sharma</div>
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

const stats = [
  { label: "CSEs assessed", value: "24", delta: "Q3 2026", icon: "shield" as IconName, tone: "blue" },
  { label: "Requiring review", value: "6", delta: "2 new this week", icon: "warning" as IconName, tone: "amber" },
  { label: "Cases prioritized", value: "42", delta: "Across 6 CSEs", icon: "case" as IconName, tone: "violet" },
  { label: "Pending reviews", value: "18", delta: "4 high priority", icon: "clock" as IconName, tone: "red" },
];

const cseRows = [
  { name: "CSE Alpha", sector: "Energy", period: "Q3 2026", signals: 5, status: "Review required", tone: "red" as BadgeTone },
  { name: "CSE Beta", sector: "Banking", period: "Q3 2026", signals: 2, status: "Under review", tone: "amber" as BadgeTone },
  { name: "CSE Gamma", sector: "Telecom", period: "Q3 2026", signals: 0, status: "No priority signals", tone: "green" as BadgeTone },
  { name: "CSE Delta", sector: "Transport", period: "Q3 2026", signals: 4, status: "Review required", tone: "red" as BadgeTone },
];

function Dashboard({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Assessment period · Q3 2026"
        title="Supervisor dashboard"
        description="Portfolio view of submitted evidence, supervisory signals, and cases awaiting human review."
        action={<Button onClick={() => navigate("submissions")}><Icon name="upload" size="sm" /> New submission</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{stat.value}</div>
                <div className="mt-2 text-xs font-medium text-slate-500">{stat.delta}</div>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${
                stat.tone === "blue" ? "bg-blue-50 text-blue-700" :
                stat.tone === "amber" ? "bg-amber-50 text-amber-700" :
                stat.tone === "violet" ? "bg-violet-50 text-violet-700" : "bg-red-50 text-red-700"
              }`}><Icon name={stat.icon} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <div className="font-bold text-slate-900">CSE assessment overview</div>
              <div className="mt-1 text-xs text-slate-500">Signals indicate review priority, not overall resilience.</div>
            </div>
            <Button variant="ghost" onClick={() => navigate("assessment")}>View all <Icon name="arrow" size="sm" /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">CSE</th><th className="px-5 py-3 font-semibold">Period</th><th className="px-5 py-3 font-semibold">Signals</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cseRows.map((row) => (
                  <tr key={row.name} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.name}</div><div className="mt-0.5 text-xs text-slate-500">{row.sector}</div></td>
                    <td className="px-5 py-4 text-slate-600">{row.period}</td>
                    <td className="px-5 py-4"><span className="font-bold text-slate-900">{row.signals}</span></td>
                    <td className="px-5 py-4"><Badge tone={row.tone}>{row.status}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" onClick={() => navigate("assessment")} className="px-2"><Icon name="arrow" size="sm" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Supervisory signals</div>
              <div className="mt-1 text-xs text-slate-500">42 active signals by category</div>
            </div>
            <Icon name="trend" />
          </div>
          <div className="mt-6 space-y-5">
            {[
              ["Monitoring visibility", 14, "w-3/4", "bg-blue-600"],
              ["Investigation completeness", 12, "w-2/3", "bg-violet-600"],
              ["KPI discrepancy", 9, "w-1/2", "bg-amber-500"],
              ["Remediation recurrence", 7, "w-2/5", "bg-rose-500"],
            ].map(([label, value, width, color]) => (
              <div key={String(label)}>
                <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">{label}</span><span className="font-bold text-slate-900">{value}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${width} ${color}`} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
            Signals surface areas for human review. They are not findings until examined and decided by a supervisor.
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div><div className="font-bold">Assessment trend</div><div className="mt-1 text-xs text-slate-500">CSE Alpha · last four periods</div></div>
            <SelectControl ariaLabel="Metric"><option>Investigation completeness</option><option>Time to close</option></SelectControl>
          </div>
          <div className="mt-6">
            <svg className="h-44 w-full" viewBox="0 0 640 180" preserveAspectRatio="none" aria-label="Investigation completeness trend">
              <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity=".2" /><stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0" /></linearGradient></defs>
              <path d="M20 35H620M20 85H620M20 135H620" stroke="rgb(226 232 240)" strokeDasharray="5 5" />
              <path d="M20 48 L215 62 L410 92 L620 127 L620 160 L20 160 Z" fill="url(#area)" />
              <polyline points="20,48 215,62 410,92 620,127" fill="none" stroke="rgb(37 99 235)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {[["20","48"],["215","62"],["410","92"],["620","127"]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="5" fill="white" stroke="rgb(37 99 235)" strokeWidth="3" />)}
            </svg>
            <div className="grid grid-cols-4 text-center text-xs font-medium text-slate-500"><span>Q4 2025</span><span>Q1 2026</span><span>Q2 2026</span><span>Q3 2026</span></div>
          </div>
        </Card>
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 p-5"><div className="font-bold">Recent submissions</div><div className="mt-1 text-xs text-slate-500">Latest ingestion activity</div></div>
          <div className="divide-y divide-slate-100">
            {[
              ["CSE Alpha", "soc_records_q3.csv", "Ready for analysis", "green"],
              ["CSE Beta", "soc_export_q3.json", "Processing", "blue"],
              ["CSE Delta", "case_records_q3.csv", "Warning", "amber"],
            ].map(([name,file,status,tone]) => (
              <div key={name} className="flex items-center gap-3 p-4">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="document" size="sm" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{name}</div><div className="truncate text-xs text-slate-500">{file}</div></div>
                <Badge tone={tone as BadgeTone}>{status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Submissions({ navigate }: { navigate: (screen: Screen) => void }) {
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);

  const process = () => {
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      setComplete(true);
    }, 1200);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Evidence ingestion"
        title="Submission management"
        description="Upload periodic SOC records, validate data quality, and prepare an assessment dataset."
        action={<Badge tone="blue">Submission ID · SUB-2638</Badge>}
      />
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-6 xl:col-span-3">
          <div className="text-lg font-bold">Upload SOC evidence</div>
          <div className="mt-1 text-sm text-slate-500">Create a submission for a CSE and assessment period.</div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-semibold text-slate-700">Critical sector entity</span><SelectControl ariaLabel="CSE"><option>CSE Alpha · Energy</option><option>CSE Beta · Banking</option></SelectControl></label>
            <label><span className="mb-2 block text-sm font-semibold text-slate-700">Assessment period</span><SelectControl ariaLabel="Assessment period"><option>Q3 2026</option><option>Q2 2026</option></SelectControl></label>
          </div>
          <div
            className={`mt-6 rounded-xl border-2 border-dashed p-8 text-center transition ${uploaded ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}
          >
            <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${uploaded ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
              <Icon name={uploaded ? "check" : "upload"} />
            </div>
            <div className="mt-4 font-bold text-slate-900">{uploaded ? "soc_records_cse_alpha_q3.csv" : "Drop SOC records here"}</div>
            <div className="mt-1 text-sm text-slate-500">{uploaded ? "12.4 MB · 486 records · Ready to validate" : "CSV or JSON · maximum file size 100 MB"}</div>
            {!uploaded && <Button variant="secondary" onClick={() => setUploaded(true)} className="mt-5">Choose demo file</Button>}
            {uploaded && <Button variant="ghost" onClick={() => setUploaded(false)} className="mt-3">Replace file</Button>}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Icon name="lock" size="sm" /> Files remain inside the secure environment</div>
            <Button disabled={!uploaded || processing || complete} onClick={process}>
              {processing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Processing...</> : <><Icon name="trend" size="sm" /> Process submission</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between"><div className="text-lg font-bold">Processing status</div>{complete && <Badge tone="green">Complete</Badge>}</div>
          <div className="mt-7 space-y-1">
            {["File uploaded", "Schema validation", "Entity resolution", "Normalization", "Ready for analysis"].map((step, index) => {
              const active = uploaded && (complete || (processing && index < 4) || index === 0);
              return (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}>
                      {active ? <Icon name="check" size="sm" /> : index + 1}
                    </div>
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

      {(uploaded || complete) && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="font-bold">Validation summary</div><div className="mt-1 text-xs text-slate-500">Data-quality checks only · warnings are not operational findings.</div></div>
            <Badge tone="amber">2 warnings require acknowledgment</Badge>
          </div>
          <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="divide-y divide-slate-100">
              {[["File structure", "Passed"],["Required fields", "Passed"],["Entity identifiers", "Passed"]].map(([label,status]) => (
                <div key={label} className="flex items-center justify-between px-5 py-4 text-sm"><span className="font-medium">{label}</span><Badge tone="green"><Icon name="check" size="sm" /> {status}</Badge></div>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {[["Timestamp validation", "Passed", "green"],["Duplicate records", "3 detected", "amber"],["Missing evidence references", "5 detected", "amber"]].map(([label,status,tone]) => (
                <div key={label} className="flex items-center justify-between px-5 py-4 text-sm"><span className="font-medium">{label}</span><Badge tone={tone as BadgeTone}>{status}</Badge></div>
              ))}
            </div>
          </div>
          <div className="border-t border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-900">
            <strong>Important:</strong> Missing or duplicate records are data-quality warnings. They are not treated as proof of weak SOC performance.
          </div>
        </Card>
      )}
    </div>
  );
}

const metrics = [
  { code: "OSEC", label: "Observed security event coverage", value: "82%", status: "Review signal", tone: "amber" as BadgeTone, bar: "w-4/5" },
  { code: "CAMG", label: "Critical asset monitoring gap", value: "15%", status: "Review signal", tone: "red" as BadgeTone, bar: "w-1/6" },
  { code: "TTCP", label: "Time-to-close percentile", value: "20th", status: "Review signal", tone: "amber" as BadgeTone, bar: "w-1/5" },
  { code: "ICS", label: "Investigation completeness", value: "75%", status: "Review signal", tone: "amber" as BadgeTone, bar: "w-3/4" },
  { code: "ER", label: "Escalation recorded", value: "85%", status: "No signal", tone: "green" as BadgeTone, bar: "w-5/6" },
  { code: "PRR", label: "Post-remediation recurrence", value: "15%", status: "No signal", tone: "green" as BadgeTone, bar: "w-1/6" },
  { code: "CEMR", label: "Critical event miss rate", value: "5%", status: "No signal", tone: "green" as BadgeTone, bar: "w-1/12" },
  { code: "KECG", label: "KPI evidence consistency gap", value: "11 pp", status: "Review signal", tone: "amber" as BadgeTone, bar: "w-1/4" },
];

function Assessment({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="CSE assessment · Q3 2026"
        title="CSE Alpha"
        description="Energy sector · Submitted 04 Oct 2026 · Assessment ID ASM-2026-031"
        action={<div className="flex gap-2"><Badge tone="red">5 review signals</Badge><Badge tone="blue">Analysis complete</Badge></div>}
      />
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon name="shield" /></div>
            <div><div className="font-bold">Assessment context</div><div className="mt-1 text-sm text-slate-500">486 records · 132 alerts · 64 cases · 290 evidence items</div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="slate">Threshold profile: Energy v2.4</Badge>
            <Button variant="secondary" onClick={() => navigate("submissions")}><Icon name="document" size="sm" /> View submission</Button>
          </div>
        </div>
      </Card>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <div><div className="text-lg font-bold">Core metrics</div><div className="mt-1 text-sm text-slate-500">Calculated from the submitted operational records.</div></div>
          <Button variant="ghost"><Icon name="filter" size="sm" /> Configure thresholds</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.code} className="p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{metric.code}</div>
                <Badge tone={metric.tone}>{metric.status}</Badge>
              </div>
              <div className="mt-5 text-2xl font-bold tracking-tight">{metric.value}</div>
              <div className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{metric.label}</div>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${metric.bar} ${metric.tone === "green" ? "bg-emerald-500" : metric.tone === "red" ? "bg-red-500" : "bg-amber-500"}`} /></div>
            </Card>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">Illustrative values and configurable review conditions; not validated benchmarks or a composite cyber-resilience score.</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3">
          <div className="border-b border-slate-200 p-5">
            <div className="font-bold">Supervisory signals</div>
            <div className="mt-1 text-xs text-slate-500">Select a signal to follow its reason and supporting evidence.</div>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              ["Potential investigation completeness concern", "CASE-1042 · Low ICS with unusually fast closure", "High", "red"],
              ["Potential monitoring visibility gap", "CASE-1088 · Critical asset lacks observed evidence", "High", "red"],
              ["Reported KPI and observed evidence discrepancy", "CASE-1105 · Reported and observed values differ", "Medium", "amber"],
            ].map(([title,desc,priority,tone]) => (
              <div key={title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}><Icon name="warning" size="sm" /></div>
                <div className="flex-1"><div className="font-semibold text-slate-900">{title}</div><div className="mt-1 text-sm text-slate-500">{desc}</div></div>
                <Badge tone={tone as BadgeTone}>{priority}</Badge>
                <Button variant="secondary" onClick={() => navigate("worklist")}>View evidence <Icon name="arrow" size="sm" /></Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 xl:col-span-2">
          <div className="font-bold">Signal distribution</div>
          <div className="mt-1 text-xs text-slate-500">By supervisory category</div>
          <div className="mt-7 rounded-xl bg-slate-50 p-5 text-center">
            <div className="text-3xl font-bold text-slate-950">5</div>
            <div className="mt-1 text-xs text-slate-500">active supervisory signals</div>
            <div className="mt-5 flex h-3 overflow-hidden rounded-full">
              <span className="w-1/3 bg-blue-600" />
              <span className="w-1/4 bg-violet-500" />
              <span className="w-1/4 bg-amber-500" />
              <span className="w-1/6 bg-rose-500" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            {[["Monitoring","bg-blue-600"],["Investigation","bg-violet-500"],["Discrepancy","bg-amber-500"],["Recurrence","bg-rose-500"]].map(([label,color]) => <div key={label} className="flex items-center gap-2 text-slate-600"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

const worklistRows = [
  { priority: "High", id: "CASE-1042", cse: "CSE Alpha", type: "Malware", signal: "Investigation concern", reason: "Low ICS + unusually fast closure", status: "Not started" },
  { priority: "High", id: "CASE-1088", cse: "CSE Alpha", type: "Unauthorized access", signal: "Monitoring gap", reason: "Critical asset lacks observed evidence", status: "In review" },
  { priority: "Medium", id: "CASE-1105", cse: "CSE Alpha", type: "Suspicious login", signal: "KPI discrepancy", reason: "Reported and observed values differ", status: "Not started" },
  { priority: "Medium", id: "CASE-1112", cse: "CSE Beta", type: "Malware", signal: "Recurrence", reason: "Similar condition after remediation", status: "Not started" },
];

function Worklist({ navigate }: { navigate: (screen: Screen) => void }) {
  const [priority, setPriority] = useState("All priorities");
  const visible = priority === "All priorities" ? worklistRows : worklistRows.filter((row) => row.priority === priority);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Human review queue"
        title="Prioritized review worklist"
        description="Cases are ranked by configurable review conditions. Priority supports triage and is not a definitive measure of SOC quality."
        action={<Badge tone="amber">18 pending reviews</Badge>}
      />
      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1"><span className="pointer-events-none absolute left-3 top-3 text-slate-400"><Icon name="search" size="sm" /></span><div className="pl-8"><TextInput ariaLabel="Search cases" placeholder="Search case ID, CSE or signal..." /></div></div>
          <div className="flex flex-wrap gap-2">
            <SelectControl ariaLabel="CSE filter"><option>All CSEs</option><option>CSE Alpha</option><option>CSE Beta</option></SelectControl>
            <SelectControl ariaLabel="Priority filter" value={priority} onChange={setPriority}><option>All priorities</option><option>High</option><option>Medium</option></SelectControl>
            <SelectControl ariaLabel="Category filter"><option>All categories</option><option>Investigation</option><option>Monitoring</option></SelectControl>
            <SelectControl ariaLabel="Status filter"><option>All statuses</option><option>Not started</option><option>In review</option></SelectControl>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-5xl text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3 font-semibold">Priority</th><th className="px-5 py-3 font-semibold">Case</th><th className="px-5 py-3 font-semibold">CSE</th><th className="px-5 py-3 font-semibold">Signal category</th><th className="px-5 py-3 font-semibold">Reason for prioritization</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((row) => (
                <tr key={row.id} className={row.id === "CASE-1042" ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                  <td className="px-5 py-4"><Badge tone={row.priority === "High" ? "red" : "amber"}>{row.priority}</Badge></td>
                  <td className="px-5 py-4"><div className="font-bold text-blue-700">{row.id}</div><div className="mt-1 text-xs text-slate-500">{row.type}</div></td>
                  <td className="px-5 py-4 font-medium">{row.cse}</td>
                  <td className="px-5 py-4 text-slate-600">{row.signal}</td>
                  <td className="max-w-xs px-5 py-4 text-slate-600">{row.reason}</td>
                  <td className="px-5 py-4"><Badge tone={row.status === "In review" ? "blue" : "slate"}>{row.status}</Badge></td>
                  <td className="px-5 py-4"><Button variant={row.id === "CASE-1042" ? "primary" : "secondary"} onClick={() => navigate("case")}>Review case</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden border-blue-200">
        <div className="flex flex-col gap-5 bg-blue-50 p-6 lg:flex-row lg:items-center">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Icon name="evidence" /></div>
          <div className="flex-1">
            <div className="font-bold text-blue-950">Why was CASE-1042 prioritized?</div>
            <div className="mt-2 text-sm leading-6 text-blue-900">The case was closed unusually quickly compared with the selected comparison group. Its investigation completeness is also below the configured review threshold. Both signals warrant examination of the underlying records.</div>
          </div>
          <div className="min-w-40 rounded-lg border border-blue-200 bg-white p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Priority Score</div>
            <div className="mt-1 text-2xl font-bold text-blue-800">87<span className="text-sm text-slate-400">/100</span></div>
            <div className="mt-1 text-xs text-slate-500">Configurable triage aid</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CaseDetail({ navigate }: { navigate: (screen: Screen) => void }) {
  const [openEvidence, setOpenEvidence] = useState<string | null>("INV-1042-02");
  const timeline = [
    ["09:00", "Alert generated", "ALT-1042", "Alert record"],
    ["09:15", "Case opened", "CASE-1042", "Case record"],
    ["09:30", "Initial review", "ACT-1042-01", "Action record"],
    ["10:15", "Investigation note added", "INV-1042-02", "Investigation record"],
    ["11:00", "Case closed", "CLS-1042", "Closure record"],
  ];
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Button variant="ghost" onClick={() => navigate("worklist")} className="px-2">Review worklist</Button><Icon name="arrow" size="sm" /><span>CASE-1042</span></div>
      <PageHeader
        eyebrow="High priority · Investigation concern"
        title="CASE-1042"
        description="CSE Alpha · Malware · Critical severity · Closed"
        action={<Button onClick={() => navigate("decision")}>Continue to decision <Icon name="arrow" size="sm" /></Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Opened","12 Sep 2026 · 09:15"],["Closed","12 Sep 2026 · 11:00"],["Time to close","1h 45m"],["Comparison group","Critical malware · Energy"]].map(([label,value]) => (
          <Card key={label} className="p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-sm font-semibold text-slate-900">{value}</div></Card>
        ))}
      </div>

      <Card className="overflow-hidden border-amber-200">
        <div className="border-b border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700"><Icon name="warning" /></div><div><div className="text-xs font-bold uppercase tracking-wide text-amber-700">Supervisory signal</div><div className="mt-1 text-lg font-bold text-slate-950">Potential Investigation Completeness Concern</div></div></div>
        </div>
        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[["Time-to-close percentile","20th","Below comparison range"],["Investigation completeness","50%","Below 70% review threshold"],["Review conditions","2 of 2","Configured conditions satisfied"]].map(([label,value,desc]) => (
            <div key={label} className="p-5"><div className="text-sm font-medium text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div><div className="mt-1 text-xs text-slate-500">{desc}</div></div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-6 xl:col-span-3">
          <div className="font-bold">Investigation timeline</div>
          <div className="mt-1 text-xs text-slate-500">Submitted operational records in chronological order.</div>
          <div className="mt-6">
            {timeline.map(([time,activity,record,type], index) => (
              <div key={record} className="flex gap-4">
                <div className="flex flex-col items-center"><div className="grid h-8 w-8 place-items-center rounded-full border-2 border-blue-200 bg-blue-50 text-blue-700"><span className="h-2 w-2 rounded-full bg-blue-600" /></div>{index < timeline.length - 1 && <div className="h-14 w-px bg-slate-200" />}</div>
                <div className="flex flex-1 flex-col gap-1 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-sm font-semibold">{activity}</div><div className="mt-1 text-xs text-slate-500">{type} · {record}</div></div><span className="text-xs font-bold text-slate-500">{time}</span></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden xl:col-span-2">
          <div className="border-b border-slate-200 p-5"><div className="font-bold">Investigation checklist</div><div className="mt-1 text-xs text-slate-500">Applicable documentation requirements</div></div>
          <div className="divide-y divide-slate-100">
            {[
              ["Alert reviewed", true],["Evidence examined", false],["Affected asset identified", true],["Investigation actions recorded", true],["Findings documented", false],["Disposition documented", true],["Escalation decision documented", true],
            ].map(([label,recorded]) => (
              <div key={String(label)} className="flex items-center justify-between px-5 py-3.5 text-sm"><span className="text-slate-700">{label as string}</span><Badge tone={recorded ? "green" : "red"}>{recorded ? "Recorded" : "Missing"}</Badge></div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-5"><div className="font-bold">Evidence drill-down</div><div className="mt-1 text-xs text-slate-500">Select a record to inspect source metadata.</div></div>
        <div className="divide-y divide-slate-100">
          {[
            ["ALT-1042", "Alert record", "SIEM export", "12 Sep 2026 · 09:00"],
            ["INV-1042-02", "Investigation note", "Case management system", "12 Sep 2026 · 10:15"],
            ["CLS-1042", "Closure record", "Case management system", "12 Sep 2026 · 11:00"],
          ].map(([id,type,source,time]) => (
            <div key={id}>
              <Button variant="ghost" onClick={() => setOpenEvidence(openEvidence === id ? null : id)} className="w-full justify-start rounded-none px-5 py-4 text-left">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="document" size="sm" /></div>
                <div className="flex-1"><div className="font-semibold text-slate-900">{id} · {type}</div><div className="mt-0.5 text-xs font-normal text-slate-500">{source} · {time}</div></div>
                <Icon name="chevron" size="sm" />
              </Button>
              {openEvidence === id && (
                <div className="grid gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm sm:grid-cols-4">
                  <div><span className="block text-xs font-semibold text-slate-500">Source reference</span><span className="mt-1 block font-mono text-slate-800">SRC-CSEA-0926-{id.slice(-2)}</span></div>
                  <div><span className="block text-xs font-semibold text-slate-500">Integrity status</span><span className="mt-1 block text-emerald-700">Hash verified</span></div>
                  <div><span className="block text-xs font-semibold text-slate-500">Ingested</span><span className="mt-1 block text-slate-800">04 Oct 2026 · 14:32</span></div>
                  <div><span className="block text-xs font-semibold text-slate-500">Entity match</span><span className="mt-1 block text-slate-800">CASE-1042 · Confirmed</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Icon name="evidence" /></div><div><div className="font-bold text-blue-950">Analytical explanation</div><div className="mt-2 text-sm leading-6 text-blue-900">The case has an unusually low time-to-close percentile and incomplete investigation documentation. This combination generated a supervisory review signal based on the submitted case and investigation records. <strong>The signal does not establish that the investigation was inadequate.</strong></div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-blue-800"><Badge tone="blue">Metric</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Deviation</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Signal</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Evidence</Badge><Icon name="arrow" size="sm" /><Badge tone="blue">Explanation</Badge></div></div></div>
      </Card>
    </div>
  );
}

function Decision({
  navigate,
  onSubmit,
}: {
  navigate: (screen: Screen) => void;
  onSubmit: (decision: string, comment: string) => void;
}) {
  const [decision, setDecision] = useState("Request further review");
  const [comment, setComment] = useState("Additional investigation evidence is required before determining whether the case was handled appropriately.");
  const options = [
    ["Confirm concern", "Evidence supports recording a supervisory concern.", "red"],
    ["Dismiss signal", "Evidence provides a sufficient explanation for the deviation.", "green"],
    ["Request further review", "Additional evidence or expert review is required.", "blue"],
  ];
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Button variant="ghost" onClick={() => navigate("case")} className="px-2">CASE-1042</Button><Icon name="arrow" size="sm" /><span>Supervisor decision</span></div>
      <PageHeader eyebrow="Human-in-the-loop review" title="Supervisor decision" description="Record your determination for the potential investigation completeness concern." />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Card className="p-6">
            <div className="text-lg font-bold">Select a decision</div>
            <div className="mt-1 text-sm text-slate-500">SAT-SA supports this decision; it does not make it.</div>
            <div className="mt-6 grid gap-3">
              {options.map(([label,desc,tone]) => (
                <Button
                  key={label}
                  variant="ghost"
                  onClick={() => setDecision(label)}
                  className={`min-h-20 w-full justify-start border p-4 text-left ${decision === label ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
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
            <div className="border-b border-slate-200 p-5"><div className="font-bold">Supporting evidence</div><div className="mt-1 text-xs text-slate-500">CASE-1042 · CSE Alpha</div></div>
            <div className="space-y-4 p-5">
              {[["Time-to-close","1h 45m · 20th percentile"],["Investigation completeness","50% · below threshold"],["Missing requirements","Evidence examined, findings documented"],["Evidence integrity","3 source records verified"]].map(([label,value]) => (
                <div key={label} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value}</span></div>
              ))}
            </div>
            <div className="border-t border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-900">The signal indicates a need for review, not a predetermined finding.</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon name="user" size="sm" /></div><div><div className="text-sm font-bold">A. Sharma · SUP-2741</div><div className="text-xs text-slate-500">NCIIPC Supervisor</div></div></div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Submitting creates an immutable audit entry linked to the case, signal, decision, supervisor, and timestamp.</div>
          </Card>
          <Button disabled={!comment.trim()} onClick={() => onSubmit(decision, comment)} className="w-full">Submit audited decision <Icon name="arrow" size="sm" /></Button>
          <Button variant="secondary" onClick={() => navigate("case")} className="w-full">Return to evidence</Button>
        </div>
      </div>
    </div>
  );
}

function Report({
  navigate,
  decision,
  showToast,
}: {
  navigate: (screen: Screen) => void;
  decision: string;
  showToast: (message: string) => void;
}) {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Assessment report · ASM-2026-031"
        title="CSE Alpha · Q3 2026"
        description="Supervisory assessment summary generated from submitted records and completed human reviews."
        action={<div className="flex gap-2"><Button variant="secondary" onClick={() => showToast("PDF prepared for secure download")}><Icon name="download" size="sm" /> Download PDF</Button><Button onClick={() => showToast("Report export package created")}><Icon name="report" size="sm" /> Export report</Button></div>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Records analyzed","486"],["Metrics calculated","8"],["Signals generated","5"],["Cases reviewed","3 of 5"]].map(([label,value]) => <Card key={label} className="p-5"><div className="text-sm font-semibold text-slate-500">{label}</div><div className="mt-3 text-3xl font-bold">{value}</div></Card>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="border-b border-slate-200 p-5"><div className="font-bold">Findings and decisions</div><div className="mt-1 text-xs text-slate-500">Human determinations for prioritized supervisory signals.</div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Case</th><th className="px-5 py-3 font-semibold">Signal</th><th className="px-5 py-3 font-semibold">Supervisor decision</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-blue-50/50"><td className="px-5 py-4 font-bold text-blue-700">CASE-1042</td><td className="px-5 py-4">Investigation concern</td><td className="px-5 py-4 font-medium">{decision}</td><td className="px-5 py-4"><Badge tone="amber">Pending response</Badge></td></tr>
                <tr><td className="px-5 py-4 font-bold text-blue-700">CASE-1088</td><td className="px-5 py-4">Monitoring gap</td><td className="px-5 py-4 font-medium">Confirmed concern</td><td className="px-5 py-4"><Badge tone="red">Confirmed</Badge></td></tr>
                <tr><td className="px-5 py-4 font-bold text-blue-700">CASE-1105</td><td className="px-5 py-4">KPI discrepancy</td><td className="px-5 py-4 font-medium">Dismissed</td><td className="px-5 py-4"><Badge tone="green">Closed</Badge></td></tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon name="check" /></div><div><div className="font-bold">Decision recorded</div><div className="text-xs text-slate-500">Audit trail complete</div></div></div>
          <div className="mt-6 space-y-4 text-sm">
            {[["Supervisor","A. Sharma · SUP-2741"],["Decision",decision],["Timestamp","08 Oct 2026 · 16:42 IST"],["Audit reference","AUD-2026-48821"]].map(([label,value]) => <div key={label}><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-1 font-medium text-slate-900">{value}</div></div>)}
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon name="document" /></div>
          <div className="flex-1"><div className="font-bold">Recommended follow-up</div><div className="mt-2 text-sm leading-6 text-slate-600">Request the missing investigation evidence for CASE-1042 and obtain clarification on closure criteria. Review the confirmed visibility gap in CASE-1088 during the next supervisory touchpoint. No further action is required for the dismissed KPI discrepancy.</div></div>
          <div className="flex shrink-0 flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate("worklist")}>Return to worklist</Button><Button onClick={() => navigate("dashboard")}>Return to dashboard</Button></div>
        </div>
      </Card>
      <div className="text-center text-xs text-slate-500">Illustrative prototype report · Not an official NCIIPC assessment or validated benchmark.</div>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [decision, setDecision] = useState("Request further review");
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  const submitDecision = (selected: string, _comment: string) => {
    setDecision(selected);
    showToast("Decision recorded in the audit trail");
    setScreen("report");
  };

  return (
    <Shell screen={screen} setScreen={setScreen} onLogout={() => setAuthenticated(false)}>
      {screen === "dashboard" && <Dashboard navigate={setScreen} />}
      {screen === "submissions" && <Submissions navigate={setScreen} />}
      {screen === "assessment" && <Assessment navigate={setScreen} />}
      {screen === "worklist" && <Worklist navigate={setScreen} />}
      {screen === "case" && <CaseDetail navigate={setScreen} />}
      {screen === "decision" && <Decision navigate={setScreen} onSubmit={submitDecision} />}
      {screen === "report" && <Report navigate={setScreen} decision={decision} showToast={showToast} />}
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500"><Icon name="check" size="sm" /></span>{toast}
        </div>
      )}
    </Shell>
  );
}
