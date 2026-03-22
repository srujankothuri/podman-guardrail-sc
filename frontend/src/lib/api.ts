const BASE_URL = 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────

export interface PromptResponse {
  job_id: string;
  status: string;
}

export type JobStatusValue =
'queued' |
'checking_compliance' |
'retrieving_knowledge' |
'generating' |
'validating' |
'completed' |
'blocked' |
'failed';

export interface JobStatus {
  job_id: string;
  status: JobStatusValue;
  answer?: string;
  insufficient_data?: boolean;
}

export interface PolicyInfo {
  version: string;
  rules_count: number;
  updated_at: string;
}

export interface AuditEvent {
  timestamp: string;
  event_type: string;
  user_id: string;
  score: number;
  prompt_preview: string;
}

export interface AuditResponse {
  events: AuditEvent[];
}

export interface ApiError {
  detail: string;
}

// ── Custom Error ───────────────────────────────────────

export class ApiRequestError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiRequestError';
    this.status = status;
    this.detail = detail;
  }
}

// ── Helpers ────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body.detail) {
        detail = body.detail;
      }
    } catch {

      // use default detail
    }throw new ApiRequestError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

// ── API Functions ──────────────────────────────────────

export async function submitPrompt(
prompt: string,
userId: string)
: Promise<PromptResponse> {
  const response = await fetch(`${BASE_URL}/api/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, user_id: userId })
  });
  return handleResponse<PromptResponse>(response);
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${BASE_URL}/api/jobs/${jobId}`);
  return handleResponse<JobStatus>(response);
}

export async function uploadPolicy(file: File): Promise<{message: string;}> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE_URL}/api/admin/policy/upload`, {
    method: 'POST',
    body: formData
  });
  return handleResponse<{message: string;}>(response);
}

export async function getCurrentPolicy(): Promise<PolicyInfo> {
  const response = await fetch(`${BASE_URL}/api/admin/policy/current`);
  return handleResponse<PolicyInfo>(response);
}

export async function getAuditEvents(): Promise<AuditResponse> {
  const response = await fetch(`${BASE_URL}/api/admin/audit/events`);
  return handleResponse<AuditResponse>(response);
}