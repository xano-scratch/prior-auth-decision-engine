// The one contract: paths and request/response *types* are derived from the
// xanots query defs. Nothing here hand-types a URL or a request body — change a
// def in xano/ and this file (and every screen that uses it) follows.

import type { InferInput, InferResponse } from "@xanots/sdk";

import { loginQuery } from "../../../xano/api/login.js";
import { meQuery } from "../../../xano/api/me.js";
import { submitRequestQuery } from "../../../xano/api/submit-request.js";
import { decideQuery } from "../../../xano/api/decide.js";
import { getDecisionQuery } from "../../../xano/api/get-decision.js";
import { auditQuery } from "../../../xano/api/audit.js";
import { getCriteriaQuery } from "../../../xano/api/get-criteria.js";
import { listMembersQuery } from "../../../xano/api/list-members.js";
import { listProceduresQuery } from "../../../xano/api/list-procedures.js";
import { listQueueQuery } from "../../../xano/api/list-queue.js";

/**
 * The deployed Xano backend's base URL. Injected as `window.XANO_HOST` by
 * `xanots deploy --static`, or read from `VITE_XANO_HOST` in local dev.
 */
export const XANO_HOST: string =
  (typeof window !== "undefined" && (window as { XANO_HOST?: string }).XANO_HOST) ||
  import.meta.env.VITE_XANO_HOST ||
  "";

// ── Token store ──────────────────────────────────────────────────────────────
const TOKEN_KEY = "pa_token";
export const getToken = (): string | null =>
  typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
export const setToken = (token: string | null): void => {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

// ── Types derived from the defs (import type erases to nothing) ───────────────
export type LoginBody = InferInput<typeof loginQuery>;
export type LoginResponse = InferResponse<typeof loginQuery>;
export type Reviewer = InferResponse<typeof meQuery>;
export type SubmitBody = InferInput<typeof submitRequestQuery>;
export type SubmitResponse = InferResponse<typeof submitRequestQuery>;
export type DecideResponse = InferResponse<typeof decideQuery>;
export type DecisionDetail = InferResponse<typeof getDecisionQuery>;
export type AuditRow = InferResponse<typeof auditQuery>[number];
export type CriteriaView = InferResponse<typeof getCriteriaQuery>;
export type Member = InferResponse<typeof listMembersQuery>[number];
export type Procedure = InferResponse<typeof listProceduresQuery>[number];
export type QueueRequest = InferResponse<typeof listQueueQuery>[number];

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(XANO_HOST + path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text || `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.message) message = parsed.message;
    } catch {
      // keep the raw text
    }
    throw new ApiError(res.status, message);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  login: (body: LoginBody) =>
    call<LoginResponse>(loginQuery.getPath(), { method: loginQuery.verb, body: JSON.stringify(body) }),

  me: () => call<Reviewer>(meQuery.getPath(), { method: meQuery.verb }),

  submit: (body: SubmitBody) =>
    call<SubmitResponse>(submitRequestQuery.getPath(), {
      method: submitRequestQuery.verb,
      body: JSON.stringify(body),
    }),

  decide: (request_id: number) =>
    call<DecideResponse>(decideQuery.getPath(), {
      method: decideQuery.verb,
      body: JSON.stringify({ request_id }),
    }),

  decision: (request_id: number) =>
    call<DecisionDetail>(getDecisionQuery.getPath({ params: { request_id } }), {
      method: getDecisionQuery.verb,
    }),

  audit: (filters: { member_number?: string; procedure_code?: string }) =>
    call<AuditRow[]>(withQuery(auditQuery.getPath(), filters), { method: auditQuery.verb }),

  criteria: (procedure_id: number) =>
    call<CriteriaView>(getCriteriaQuery.getPath({ params: { procedure_id } }), {
      method: getCriteriaQuery.verb,
    }),

  members: () => call<Member[]>(listMembersQuery.getPath(), { method: listMembersQuery.verb }),

  procedures: () => call<Procedure[]>(listProceduresQuery.getPath(), { method: listProceduresQuery.verb }),

  queue: () => call<QueueRequest[]>(listQueueQuery.getPath(), { method: listQueueQuery.verb }),
};
