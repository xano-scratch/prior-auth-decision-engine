import { workspace } from "@xanots/sdk";

// Tables
import { reviewers } from "./tables/reviewers.js";
import { members } from "./tables/members.js";
import { procedures } from "./tables/procedures.js";
import { criteriaSets } from "./tables/criteria-sets.js";
import { criteria } from "./tables/criteria.js";
import { requests } from "./tables/requests.js";
import { decisions } from "./tables/decisions.js";
import { decisionLog } from "./tables/decision-log.js";

// API groups
import { authGroup, priorauthGroup } from "./api/groups.js";

// Shared logic
import { decideRequest } from "./functions/decide-request.js";

// Endpoints
import { loginQuery } from "./api/login.js";
import { meQuery } from "./api/me.js";
import { submitRequestQuery } from "./api/submit-request.js";
import { decideQuery } from "./api/decide.js";
import { getDecisionQuery } from "./api/get-decision.js";
import { auditQuery } from "./api/audit.js";
import { getCriteriaQuery } from "./api/get-criteria.js";
import { listMembersQuery } from "./api/list-members.js";
import { listProceduresQuery } from "./api/list-procedures.js";
import { listQueueQuery } from "./api/list-queue.js";

/**
 * Prior Authorization Decision Engine.
 *
 * One governed decision service a health plan's intake portal and provider
 * tools all call. Medical-necessity rules live as versioned data; a single
 * decide_request function is the only path that produces a decision, so no
 * caller can re-encode its own version. Every run appends to an append-only
 * audit trail. Access is API-layer RBAC (a clinical reviewer decides, a
 * read_only auditor may only view and audit), never row-level security.
 */
export default workspace("prior-auth-decision-engine")
  .registerTables([reviewers, members, procedures, criteriaSets, criteria, requests, decisions, decisionLog])
  .registerApiGroups([authGroup, priorauthGroup])
  .registerFunctions([decideRequest])
  .registerQueries([
    loginQuery,
    meQuery,
    submitRequestQuery,
    decideQuery,
    getDecisionQuery,
    auditQuery,
    getCriteriaQuery,
    listMembersQuery,
    listProceduresQuery,
    listQueueQuery,
  ]);
