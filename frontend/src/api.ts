// SAT-SA API client. Same-origin `/api/v1/*` calls only: in dev Vite proxies them to the backend,
// in the single-process build the backend serves both the UI and the API. No external hosts.

const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError("Cannot reach the SAT-SA backend. Make sure it is running (see README).", 0, null);
  }
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  // The ingestion endpoints answer 422 with a structured validation report - hand that back to the caller.
  if (!res.ok && !(res.status === 422 && body?.validation)) {
    throw new ApiError(body?.error ?? body?.detail ?? `Request failed (${res.status})`, res.status, body);
  }
  return body as T;
}

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && s.set(k, v));
  const str = s.toString();
  return str ? `?${str}` : "";
};

// ---------- response shapes (only the fields the UI reads) ----------
export type Tone = "blue" | "green" | "amber" | "red" | "slate" | "violet";

export interface DashboardRow { name: string; cse_id: string; sector: string; period: string; signals: number; status: string; tone: Tone }
export interface Dashboard {
  period: string;
  stats: { cse_assessed: number; requiring_review: number; cases_prioritized: number; pending_reviews: number };
  cse_rows: DashboardRow[];
}
export interface SubmissionSummary {
  submission_id: string; cse_id: string; period_start: string; period_end: string; source_format: string;
  processed_at: string | null; created_at: string;
  validation: { valid: boolean; errors: string[]; warnings: string[]; record_counts: Record<string, number> };
}
export interface Validation { valid: boolean; errors: string[]; warnings: string[]; record_counts: Record<string, number> }
export interface IngestResult { submission_id: string | null; validation: Validation }
export interface Metric {
  code: string; label: string; value: number | null; unit: string; status?: string;
  sample: { sufficient: boolean; sample_size: number; minimum: number; status: string };
  interpretation?: string;
}
export interface Signal {
  signal_id: string; cse_id: string; case_id: string | null; category: string; priority: string; score: number;
  title: string; rationale: string; metric_codes: string[]; evidence: string[]; baseline?: unknown; threshold?: unknown;
}
export interface Assessment {
  assessment_id: string;
  cse: { cse_id: string; cse_name: string; sector: string; operational_unit?: string };
  period: { start: string; end: string; label: string };
  metrics: Metric[];
  signals: Signal[];
  record_counts: Record<string, number>;
  supporting_metrics: Record<string, any>;
}
export interface WorklistRow {
  priority: string; priority_score: number; id: string; signal_id: string; cse: string; cse_id: string;
  type: string; signal: string; category: string; reason: string; status: string; metric_codes: string[];
}
export interface CaseDetail {
  case_id: string;
  cse: { cse_id: string; cse_name: string; sector: string };
  period: string;
  case: { case_id: string; case_type: string; opened_at: string; closed_at: string | null; status: string; disposition: string };
  alert: { alert_id?: string; alert_type?: string; severity?: string; asset_id?: string };
  metrics: { TTCP: number | null; ICS: number | null };
  signals: Signal[];
  evidence_chain: { explanation: string; evidence_ids: string[] };
  timeline: { timestamp: string; activity: string; record_id: string; type: string }[];
  checklist: { key: string; label: string; recorded: boolean }[];
  evidence: { evidence_id: string; evidence_type: string; source_system: string; event_timestamp: string; reference_id: string; availability_status: string; integrity_reference: string | null }[];
  investigation_actions: { investigation_action_id: string; action_type: string; action_timestamp: string; actor_id: string }[];
  decisions: DecisionRecord[];
  comparison_group: string;
}
export interface DecisionRecord {
  decision_id: string; signal_id: string; case_id: string; decision: string; comment: string;
  actor_id: string; actor_name?: string; created_at: string; audit_reference?: string;
}
export interface Report {
  assessment_id: string;
  cse: { cse_id: string; cse_name: string; sector: string };
  period: { label: string };
  records_analyzed: number; metrics_calculated: number; signals_generated: number; cases_reviewed: number;
  findings: { signal_id: string; title: string; priority: string; case_id: string | null; rationale: string }[];
  decisions: DecisionRecord[];
  recommendations: string[];
  audit_note: string;
}

// ---------- calls ----------
export const api = {
  dashboard: (period?: string) => request<Dashboard>(`/dashboard${q({ period })}`),
  submissions: () => request<{ submissions: SubmissionSummary[] }>("/submissions"),
  uploadJson: (raw: string) =>
    request<IngestResult>("/submissions/json", { method: "POST", headers: { "Content-Type": "application/json" }, body: raw }),
  uploadCsv: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f, f.name));
    return request<IngestResult>("/submissions/csv", { method: "POST", body: fd });
  },
  process: (submissionId: string) => request<Assessment>(`/submissions/${encodeURIComponent(submissionId)}/process`, { method: "POST" }),
  assessment: (cse: string, period?: string) => request<Assessment>(`/assessments/${encodeURIComponent(cse)}${q({ period })}`),
  worklist: (period?: string) => request<{ rows: WorklistRow[]; count: number }>(`/worklist${q({ period })}`),
  caseDetail: (id: string) => request<CaseDetail>(`/cases/${encodeURIComponent(id)}`),
  decide: (caseId: string, body: { decision: string; comment: string; actor_id: string; actor_name?: string }) =>
    request<DecisionRecord>(`/cases/${encodeURIComponent(caseId)}/decisions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
  report: (cse: string, period?: string) => request<Report>(`/reports/${encodeURIComponent(cse)}${q({ period })}`),
  exportReport: (cse: string, period?: string) => request<Report>(`/reports/${encodeURIComponent(cse)}/export${q({ period, format: "json" })}`),
  config: () => request<{ metric_thresholds: Record<string, number>; baseline: Record<string, number>; recurrence_window_days: number; _version?: string }>("/config"),
};

// ---------- formatting helpers ----------
export const periodLabelFromDate = (iso: string): string => {
  const m = Number(iso.slice(5, 7));
  return `Q${Math.floor((m - 1) / 3) + 1}-${iso.slice(0, 4)}`;
};
export const prettyPeriod = (p: string) => p.replace("-", " ");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
};
export const fmtTime = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(11, 16) : "—");
export const fmtDuration = (from?: string | null, to?: string | null) => {
  if (!from || !to) return "—";
  const mins = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
  if (isNaN(mins)) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};
export const ordinal = (n: number) => {
  const r = Math.round(n), s = ["th", "st", "nd", "rd"], v = r % 100;
  return `${r}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
export const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
export const CATEGORY_LABELS: Record<string, string> = {
  superficial_investigation: "Investigation completeness",
  monitoring_visibility_gap: "Monitoring visibility",
  post_remediation_recurrence: "Remediation recurrence",
  kpi_evidence_discrepancy: "KPI discrepancy",
  escalation_compliance_gap: "Escalation compliance",
  closure_evidence_mismatch: "Closure evidence",
};
export const catLabel = (c: string) => CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
