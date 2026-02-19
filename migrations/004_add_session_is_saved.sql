-- 004_add_session_is_saved.sql
ALTER TABLE analysis_sessions ADD COLUMN is_saved BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark all existing sessions as saved (they were explicitly saved by users)
UPDATE analysis_sessions SET is_saved = TRUE;
