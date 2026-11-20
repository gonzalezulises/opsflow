import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseAssignmentsBar, type CaseAssigneeRow } from "../case-assignments-bar";

// Vitest has no DOM, so a hook store that survives between calls stands in for one mounted
// instance: state copied from props would go stale here just as it would in the browser.
const instance = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (init: unknown) => {
    const i = instance.cursor++;
    if (!(i in instance.slots)) instance.slots[i] = typeof init === "function" ? init() : init;
    return [instance.slots[i], (v: unknown) => (instance.slots[i] = v)];
  },
  useTransition: () => [false, (fn: () => void) => fn()],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/org-members", () => ({
  assignUserToCase: vi.fn(),
  unassignUserFromCase: vi.fn(),
}));

const ana: CaseAssigneeRow = { userId: "u1", email: "ana@example.com", fullName: "Ana" };
const luis: CaseAssigneeRow = { userId: "u2", email: "luis@example.com", fullName: "Luis" };
const eva: CaseAssigneeRow = { userId: "u3", email: "eva@example.com", fullName: "Eva" };

function render(props: ComponentProps<typeof CaseAssignmentsBar>) {
  instance.cursor = 0;
  return renderToStaticMarkup(CaseAssignmentsBar(props));
}

describe("CaseAssignmentsBar", () => {
  beforeEach(() => {
    instance.slots = [];
  });

  it("follows new props on the same instance: assign, remove, change case", () => {
    expect(render({ caseId: "c1", initialAssignees: [ana], canManage: true })).not.toContain(
      "luis@example.com"
    );

    const assigned = render({ caseId: "c1", initialAssignees: [ana, luis], canManage: true });
    expect(assigned).toContain("ana@example.com");
    expect(assigned).toContain("luis@example.com");

    const removed = render({ caseId: "c1", initialAssignees: [luis], canManage: true });
    expect(removed).not.toContain("ana@example.com");
    expect(removed).toContain("luis@example.com");

    const otherCase = render({ caseId: "c2", initialAssignees: [eva], canManage: true });
    expect(otherCase).toContain("eva@example.com");
    expect(otherCase).not.toContain("luis@example.com");
    expect(otherCase).toContain('id="assign-email-c2"');

    expect(render({ caseId: "c2", initialAssignees: [], canManage: true })).toContain(
      "Aún no hay participantes asignados a este caso."
    );
  });

  it("hides the bar once the last assignee goes and there is no manage permission", () => {
    expect(render({ caseId: "c1", initialAssignees: [ana], canManage: false })).toContain(
      "ana@example.com"
    );
    expect(render({ caseId: "c1", initialAssignees: [], canManage: false })).toBe("");
  });

  it("lists assignees read-only without manage permission", () => {
    const html = render({ caseId: "c1", initialAssignees: [ana], canManage: false });
    expect(html).toContain("ana@example.com");
    expect(html).not.toContain("Quitar");
    expect(html).not.toContain("<form");
  });
});
