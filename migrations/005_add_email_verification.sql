-- Add email verification fields to users table.
-- Existing users default to verified (TRUE) so they are not locked out.
-- New registrations set email_verified = FALSE in application code.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified    BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS verification_token TEXT        DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ DEFAULT NULL;
