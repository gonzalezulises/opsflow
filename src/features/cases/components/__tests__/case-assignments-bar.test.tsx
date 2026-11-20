import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseAssignmentsBar, type CaseAssigneeRow } from "../case-assignments-bar";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/server/actions/org-members", () => ({
  assignUserToCase: vi.fn(),
  unassignUserFromCase: vi.fn(),
}));

const ana: CaseAssigneeRow = { userId: "u1", email: "ana@example.com", fullName: "Ana" };
const luis: CaseAssigneeRow = { userId: "u2", email: "luis@example.com", fullName: "Luis" };
const eva: CaseAssigneeRow = { userId: "u3", email: "eva@example.com", fullName: "Eva" };

// Vitest runs in node without a DOM, so each prop set is a fresh server render.
function render(caseId: string, initialAssignees: CaseAssigneeRow[], canManage = true) {
  return renderToStaticMarkup(
    <CaseAssignmentsBar caseId={caseId} initialAssignees={initialAssignees} canManage={canManage} />
  );
}

describe("CaseAssignmentsBar", () => {
  it("shows the assignee the server returns after assigning", () => {
    expect(render("c1", [ana])).not.toContain("luis@example.com");
    const html = render("c1", [ana, luis]);
    expect(html).toContain("ana@example.com");
    expect(html).toContain("luis@example.com");
  });

  it("drops the assignee the server no longer returns after removing", () => {
    const html = render("c1", [ana]);
    expect(html).toContain("ana@example.com");
    expect(html).not.toContain("luis@example.com");
    expect(render("c1", [])).toContain("Aún no hay participantes asignados a este caso.");
  });

  it("shows the other case's list when the case changes", () => {
    const html = render("c2", [eva]);
    expect(html).toContain("eva@example.com");
    expect(html).not.toContain("ana@example.com");
    expect(html).toContain('id="assign-email-c2"');
  });

  it("renders nothing without manage permission and no assignees", () => {
    expect(render("c1", [], false)).toBe("");
  });

  it("lists assignees read-only without manage permission", () => {
    const html = render("c1", [ana], false);
    expect(html).toContain("ana@example.com");
    expect(html).not.toContain("Quitar");
    expect(html).not.toContain("<form");
  });
});
