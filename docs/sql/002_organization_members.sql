-- ADR-004: organization_members + case_assignments
-- Run after `drizzle-kit push` if tables were not created automatically.
-- Idempotent inserts for legacy rows that only had users.organization_id.

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role user_role NOT NULL,
  CONSTRAINT organization_members_org_user_key UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members (user_id);
CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx ON organization_members (organization_id);

CREATE TABLE IF NOT EXISTS case_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  case_id uuid NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT case_assignments_case_user_key UNIQUE (case_id, user_id)
);

CREATE INDEX IF NOT EXISTS case_assignments_user_id_idx ON case_assignments (user_id);
CREATE INDEX IF NOT EXISTS case_assignments_case_id_idx ON case_assignments (case_id);

INSERT INTO organization_members (organization_id, user_id, role)
SELECT u.organization_id, u.id, u.role
FROM users u
WHERE u.organization_id IS NOT NULL
  AND u.deleted_at IS NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;
