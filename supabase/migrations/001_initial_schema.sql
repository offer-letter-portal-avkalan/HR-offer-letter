-- =============================================================
-- Offer Letter Portal - Initial Schema
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUM TYPES
-- =============================================================

CREATE TYPE user_role AS ENUM ('hr_admin', 'candidate');
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'accepted', 'rejected');
CREATE TYPE question_type AS ENUM ('text', 'multiple_choice', 'yes_no', 'rating');
CREATE TYPE signature_type AS ENUM ('drawn', 'typed');

-- =============================================================
-- USERS TABLE
-- =============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================================
-- QUESTIONS TABLE
-- =============================================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    question_type question_type NOT NULL DEFAULT 'text',
    options JSONB,           -- For multiple_choice: ["Option A", "Option B"]
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_questions_display_order ON questions(display_order);

-- =============================================================
-- OFFER LETTERS TABLE
-- =============================================================

CREATE TABLE offer_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,           -- Path in Supabase Storage (original)
    watermarked_path TEXT,                -- Path of watermarked version
    file_size_bytes BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offer_letters_candidate_id ON offer_letters(candidate_id);
CREATE INDEX idx_offer_letters_uploaded_by ON offer_letters(uploaded_by);
CREATE UNIQUE INDEX idx_offer_letters_candidate_active ON offer_letters(candidate_id) WHERE is_active = TRUE;

-- =============================================================
-- ANSWERS TABLE
-- =============================================================

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_text TEXT,
    response_json JSONB,     -- For structured answers (multiple choice, rating)
    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(candidate_id, question_id)
);

CREATE INDEX idx_answers_candidate_id ON answers(candidate_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- =============================================================
-- SUBMISSIONS TABLE
-- =============================================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_letter_id UUID NOT NULL REFERENCES offer_letters(id) ON DELETE RESTRICT,
    signature_type signature_type NOT NULL,
    signature_data TEXT NOT NULL,        -- Base64 encoded signature image / typed text
    status submission_status NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(candidate_id, offer_letter_id)
);

CREATE INDEX idx_submissions_candidate_id ON submissions(candidate_id);
CREATE INDEX idx_submissions_offer_letter_id ON submissions(offer_letter_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- =============================================================
-- REFRESH TOKENS TABLE
-- =============================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- =============================================================
-- AUDIT LOG TABLE
-- =============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offer_letters_updated_at
    BEFORE UPDATE ON offer_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
    BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
