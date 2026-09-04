import { apiGroup } from "@xanots/sdk";

// Two API groups with pinned canonical slugs so the public paths are stable and
// getPath() resolves in the browser bundle without a lock file. The slugs are
// prefixed with the app name to stay unique on a shared instance.

/** Authentication: sign in a seeded reviewer, read the current reviewer. */
export const authGroup = apiGroup({ name: "auth", canonical: "priorauth_authn" });

/** The prior-authorization decision surface. */
export const priorauthGroup = apiGroup({ name: "priorauth", canonical: "priorauth" });
