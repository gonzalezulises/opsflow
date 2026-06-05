-- organization_invites: multi-tenant onboarding (run after drizzle push if needed)

CREATE TABLE IF NOT EXISTS organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'participant',
  token text NOT NULL,
  invited_by_user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_token_idx ON organization_invites (token);
CREATE INDEX IF NOT EXISTS organization_invites_org_email_idx ON organization_invites (organization_id, email);
CREATE INDEX IF NOT EXISTS organization_invites_expires_at_idx ON organization_invites (expires_at);
