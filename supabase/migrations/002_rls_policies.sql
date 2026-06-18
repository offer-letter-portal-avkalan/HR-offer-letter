-- =============================================================
-- Offer Letter Portal - Row Level Security Policies
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Helper function to get current user role
-- =============================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- USERS TABLE POLICIES
-- =============================================================

-- HR Admin can view all users
CREATE POLICY "hr_admin_can_view_all_users"
    ON users FOR SELECT
    USING (get_current_user_role() = 'hr_admin');

-- Candidates can view their own record only
CREATE POLICY "candidates_can_view_own_record"
    ON users FOR SELECT
    USING (id = auth.uid());

-- HR Admin can insert new users (candidate creation)
CREATE POLICY "hr_admin_can_insert_users"
    ON users FOR INSERT
    WITH CHECK (get_current_user_role() = 'hr_admin');

-- Users can update their own non-sensitive fields
CREATE POLICY "users_can_update_own_profile"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- HR Admin can update any user
CREATE POLICY "hr_admin_can_update_any_user"
    ON users FOR UPDATE
    USING (get_current_user_role() = 'hr_admin');

-- =============================================================
-- QUESTIONS TABLE POLICIES
-- =============================================================

-- HR Admin has full access to questions
CREATE POLICY "hr_admin_full_access_questions"
    ON questions FOR ALL
    USING (get_current_user_role() = 'hr_admin')
    WITH CHECK (get_current_user_role() = 'hr_admin');

-- Candidates can read active questions only
CREATE POLICY "candidates_can_read_active_questions"
    ON questions FOR SELECT
    USING (
        get_current_user_role() = 'candidate'
        AND is_active = TRUE
    );

-- =============================================================
-- OFFER LETTERS TABLE POLICIES
-- =============================================================

-- HR Admin has full access to offer letters
CREATE POLICY "hr_admin_full_access_offer_letters"
    ON offer_letters FOR ALL
    USING (get_current_user_role() = 'hr_admin')
    WITH CHECK (get_current_user_role() = 'hr_admin');

-- Candidates can only read their own offer letters
CREATE POLICY "candidates_can_read_own_offer_letters"
    ON offer_letters FOR SELECT
    USING (
        get_current_user_role() = 'candidate'
        AND candidate_id = auth.uid()
        AND is_active = TRUE
    );

-- =============================================================
-- ANSWERS TABLE POLICIES
-- =============================================================

-- Candidates can manage their own answers
CREATE POLICY "candidates_can_manage_own_answers"
    ON answers FOR ALL
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

-- HR Admin can read all answers
CREATE POLICY "hr_admin_can_read_all_answers"
    ON answers FOR SELECT
    USING (get_current_user_role() = 'hr_admin');

-- =============================================================
-- SUBMISSIONS TABLE POLICIES
-- =============================================================

-- Candidates can manage their own submissions
CREATE POLICY "candidates_can_manage_own_submissions"
    ON submissions FOR ALL
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

-- HR Admin can read all submissions
CREATE POLICY "hr_admin_can_read_all_submissions"
    ON submissions FOR SELECT
    USING (get_current_user_role() = 'hr_admin');

-- HR Admin can update submission status
CREATE POLICY "hr_admin_can_update_submission_status"
    ON submissions FOR UPDATE
    USING (get_current_user_role() = 'hr_admin');

-- =============================================================
-- REFRESH TOKENS POLICIES
-- =============================================================

CREATE POLICY "users_can_manage_own_refresh_tokens"
    ON refresh_tokens FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================
-- AUDIT LOGS POLICIES
-- =============================================================

-- HR Admin can read all audit logs
CREATE POLICY "hr_admin_can_read_audit_logs"
    ON audit_logs FOR SELECT
    USING (get_current_user_role() = 'hr_admin');

-- Service role inserts audit logs (no user restriction needed)
CREATE POLICY "service_can_insert_audit_logs"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- =============================================================
-- STORAGE BUCKET SETUP
-- =============================================================

-- Create private bucket for offer letters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'offer-letters',
    'offer-letters',
    FALSE,
    52428800,  -- 50MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- HR Admin can upload to offer-letters bucket
CREATE POLICY "hr_admin_can_upload_offer_letters"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'offer-letters'
        AND get_current_user_role() = 'hr_admin'
    );

-- HR Admin can read all offer letters from storage
CREATE POLICY "hr_admin_can_read_offer_letters"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'offer-letters'
        AND get_current_user_role() = 'hr_admin'
    );

-- Candidates can read only their own offer letter files
CREATE POLICY "candidates_can_read_own_offer_letter_files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'offer-letters'
        AND get_current_user_role() = 'candidate'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- HR Admin can delete from storage
CREATE POLICY "hr_admin_can_delete_offer_letters"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'offer-letters'
        AND get_current_user_role() = 'hr_admin'
    );
