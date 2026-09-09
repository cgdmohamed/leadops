CREATE TABLE platform_connections (
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta','google','tiktok','snapchat')),
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('connected','disconnected','error')),
  account_id text,
  external_id text,
  credentials jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  last_sync timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, platform)
);
CREATE TABLE sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta','google','tiktok','snapchat')),
  status text NOT NULL CHECK (status IN ('running','succeeded','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error text
);
CREATE INDEX sync_runs_workspace ON sync_runs(workspace_id, started_at DESC);