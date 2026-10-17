/**
 * Backend method endpoints of the pmra-api-v1 contract (ADR-011 §2.12; docs/architecture/IB4-FRAPPE-ADAPTER-DESIGN.md
 * §4): the Frappe whitelisted methods the adapter calls and the three ProSEIT backend methods.
 */
const method = (name: string): string => `/api/method/${name}`;

export const METHOD = Object.freeze({
  loggedUser: method('frappe.auth.get_logged_user'),
  logout: method('logout'),
  workflowTransitions: method('frappe.model.workflow.get_transitions'),
  /** ProSEIT backend: the identity, tenant, capabilities and CSRF token of the current session. */
  session: method('pmra.api.v1.get_session'),
  /** ProSEIT backend: the contract identifier and the supported PAEP range. */
  compatibility: method('pmra.api.v1.get_compatibility'),
  /** ProSEIT backend: checks the caller's version and applies a workflow action in one operation (ADR-011 §2.8). */
  applyTransition: method('pmra.api.v1.apply_transition'),
});

/** Reads the `message` member of a Frappe method response. */
export function methodMessage(body: unknown): unknown {
  return body && typeof body === 'object' && 'message' in body ? (body as { message: unknown }).message : undefined;
}
