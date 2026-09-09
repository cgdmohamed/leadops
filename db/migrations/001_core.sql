CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  timezone text NOT NULL DEFAULT 'UTC',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'agent')),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (workspace_id, user_id) REFERENCES memberships ON DELETE CASCADE
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('leads','opportunities','campaigns','tasks','notes','goals','saved-views','reports','assignment-rules')),
  owner_id uuid,
  data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (workspace_id, owner_id) REFERENCES memberships(workspace_id,user_id),
  UNIQUE (workspace_id, kind, id)
);
CREATE INDEX records_workspace_kind ON records(workspace_id, kind, created_at DESC, id);
CREATE INDEX records_owner ON records(workspace_id, owner_id);
CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  actor_id uuid REFERENCES users ON DELETE SET NULL,
  action text NOT NULL,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_workspace ON audit_events(workspace_id, created_at DESC);
