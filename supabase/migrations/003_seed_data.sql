-- =============================================================
-- Offer Letter Portal - Seed Data (Development Only)
-- =============================================================

-- Insert default HR Admin user (password: Admin@123)
-- Hash generated with bcrypt rounds=12
INSERT INTO users (id, email, hashed_password, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5e8wSzZuMqS3G',
    'HR Admin',
    'hr_admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample questions
INSERT INTO questions (created_by, title, description, question_type, is_required, display_order)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Do you accept the offered salary package?',
    'Please confirm whether you accept the compensation package as outlined in the offer letter.',
    'yes_no',
    TRUE,
    1
),
(
    '00000000-0000-0000-0000-000000000001',
    'Expected joining date',
    'Please provide your expected joining date.',
    'text',
    TRUE,
    2
),
(
    '00000000-0000-0000-0000-000000000001',
    'Do you have any pending commitments with your current employer?',
    'Let us know if you have a notice period or other obligations.',
    'yes_no',
    TRUE,
    3
),
(
    '00000000-0000-0000-0000-000000000001',
    'How did you hear about this role?',
    NULL,
    'multiple_choice',
    FALSE,
    4
)
ON CONFLICT DO NOTHING;

-- Update multiple choice options
UPDATE questions
SET options = '["LinkedIn", "Job Portal", "Employee Referral", "Company Website", "Other"]'::JSONB
WHERE title = 'How did you hear about this role?';
