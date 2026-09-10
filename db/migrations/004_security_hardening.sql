CREATE INDEX IF NOT EXISTS sessions_user_expiry ON sessions(user_id, expires_at DESC);
