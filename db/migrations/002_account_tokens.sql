CREATE TABLE account_tokens (
  token_hash text PRIMARY KEY,
  purpose text NOT NULL CHECK (purpose IN ('reset','invite')),
  email text NOT NULL,
  workspace_id uuid REFERENCES workspaces ON DELETE CASCADE,
  role text CHECK (role IN ('admin','agent')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_tokens_expiry ON account_tokens(expires_at);
