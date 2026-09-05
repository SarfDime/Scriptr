-- Placeholder test data for Scriptr database
-- Run this SQL in your Supabase console to populate test data

-- ============================================
-- 1. UNIVERSITIES
-- ============================================
INSERT INTO universities (id, name, created_at) VALUES
('univ-001', 'University of Technology', NOW()),
('univ-002', 'State University', NOW()),
('univ-003', 'Private Institute', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. FACULTIES
-- ============================================
INSERT INTO faculties (id, name, university_id, created_at) VALUES
('fac-001', 'Computer Science', 'univ-001', NOW()),
('fac-002', 'Engineering', 'univ-001', NOW()),
('fac-003', 'Business', 'univ-002', NOW()),
('fac-004', 'Medicine', 'univ-002', NOW()),
('fac-005', 'Arts', 'univ-003', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. PROFESSORS
-- ============================================
INSERT INTO professors (id, name, bio, picture_url, created_at) VALUES
('prof-001', 'Dr. Alice Johnson', 'Expert in Data Structures and Algorithms', 'https://example.com/alice.jpg', NOW()),
('prof-002', 'Dr. Bob Smith', 'Specializes in Web Development and JavaScript', 'https://example.com/bob.jpg', NOW()),
('prof-003', 'Prof. Carol Davis', 'Database Administration and SQL Expert', 'https://example.com/carol.jpg', NOW()),
('prof-004', 'Dr. David Wilson', 'Machine Learning and AI Researcher', 'https://example.com/david.jpg', NOW()),
('prof-005', 'Prof. Emma Brown', 'Microservices and Cloud Architecture', 'https://example.com/emma.jpg', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. PROFESSOR_FACULTIES (Assign professors to faculties)
-- ============================================
INSERT INTO professor_faculties (professor_id, faculty_id, created_at) VALUES
('prof-001', 'fac-001', NOW()),
('prof-002', 'fac-001', NOW()),
('prof-003', 'fac-001', NOW()),
('prof-004', 'fac-002', NOW()),
('prof-005', 'fac-002', NOW()),
('prof-001', 'fac-003', NOW())
ON CONFLICT (professor_id, faculty_id) DO NOTHING;

-- ============================================
-- 5. SUBJECTS
-- ============================================
INSERT INTO subjects (id, name, year, exam_session, description, faculty_id, created_at) VALUES
('subj-001', 'Data Structures', 1, 'Spring 2024', 'Fundamental data structures including arrays, linked lists, trees, and graphs', 'fac-001', NOW()),
('subj-002', 'Web Development Basics', 2, 'Spring 2024', 'Introduction to HTML, CSS, and JavaScript for web development', 'fac-001', NOW()),
('subj-003', 'Database Management Systems', 2, 'Fall 2024', 'SQL, relational databases, and database design principles', 'fac-001', NOW()),
('subj-004', 'Advanced Algorithms', 3, 'Spring 2024', 'Complex algorithms, dynamic programming, and optimization techniques', 'fac-002', NOW()),
('subj-005', 'Cloud Computing', 3, 'Fall 2024', 'AWS, Azure, and cloud architecture patterns', 'fac-002', NOW()),
('subj-006', 'Microservices Architecture', 4, 'Spring 2024', 'Designing and building microservices-based applications', 'fac-002', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. SUBJECT_PROFESSORS (Assign professors to subjects)
-- ============================================
INSERT INTO subject_professors (subject_id, professor_id, created_at) VALUES
('subj-001', 'prof-001', NOW()),
('subj-002', 'prof-002', NOW()),
('subj-003', 'prof-003', NOW()),
('subj-004', 'prof-001', NOW()),
('subj-005', 'prof-005', NOW()),
('subj-006', 'prof-005', NOW()),
('subj-001', 'prof-004', NOW())
ON CONFLICT (subject_id, professor_id) DO NOTHING;

-- ============================================
-- 7. PROFILE_FACULTIES (Link test user to faculties)
-- ============================================
-- Using the test user ID from your login: 00000000-0000-4000-8000-000000000000
INSERT INTO profile_faculties (profile_id, faculty_id, created_at) VALUES
('00000000-0000-4000-8000-000000000000', 'fac-001', NOW()),
('00000000-0000-4000-8000-000000000000', 'fac-002', NOW())
ON CONFLICT (profile_id, faculty_id) DO NOTHING;

-- ============================================
-- 8. SCRIPTS
-- ============================================
INSERT INTO scripts (id, title, description, file_url, file_type, subject_id, professor_id, faculty_id, author_id, vote_score, download_count, created_at) VALUES
('script-001', 'Data Structures Complete Notes', 'Comprehensive notes covering all DS concepts with examples', 's3://bucket/script-001.pdf', 'pdf', 'subj-001', 'prof-001', 'fac-001', '00000000-0000-4000-8000-000000000000', 45, 128, NOW()),
('script-002', 'Web Dev Cheat Sheet', 'Quick reference guide for HTML, CSS, and JavaScript', 's3://bucket/script-002.pdf', 'pdf', 'subj-002', 'prof-002', 'fac-001', '00000000-0000-4000-8000-000000000000', 32, 89, NOW()),
('script-003', 'SQL Query Examples', 'Real-world SQL queries and optimization techniques', 's3://bucket/script-003.pdf', 'pdf', 'subj-003', 'prof-003', 'fac-001', '00000000-0000-4000-8000-000000000000', 28, 76, NOW()),
('script-004', 'Algorithms Study Guide', 'Study guide with code samples in Python and Java', 's3://bucket/script-004.pdf', 'pdf', 'subj-004', 'prof-001', 'fac-002', '00000000-0000-4000-8000-000000000000', 51, 142, NOW()),
('script-005', 'Cloud Architecture Diagrams', 'Visual guide to AWS and Azure services', 's3://bucket/script-005.pdf', 'pdf', 'subj-005', 'prof-005', 'fac-002', '00000000-0000-4000-8000-000000000000', 38, 103, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. PROFILE_SUBJECTS
-- ============================================
INSERT INTO profile_subjects (profile_id, subject_id, status, updated_at) VALUES
('00000000-0000-4000-8000-000000000000', 'subj-001', 'completed', NOW() - INTERVAL '2 months'),
('00000000-0000-4000-8000-000000000000', 'subj-002', 'currently_taking', NOW() - INTERVAL '1 month')
ON CONFLICT (profile_id, subject_id) DO NOTHING;

-- ============================================
-- 10. COMMENTS (On professors)
-- ============================================
INSERT INTO comments (id, author_id, professor_id, content, edited, created_at, updated_at) VALUES
('comment-001', '00000000-0000-4000-8000-000000000000', 'prof-001', 'Excellent teacher! Very clear explanations and engaging lectures.', false, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('comment-002', '00000000-0000-4000-8000-000000000000', 'prof-002', 'Great course on web development. Practical examples were very helpful.', false, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
('comment-003', '00000000-0000-4000-8000-000000000000', 'prof-003', 'Prof. Davis made SQL fun! Highly recommended.', false, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. VOTES (On scripts - requires vote_id in votes table)
-- ============================================
-- Note: The votes table structure may vary. Adjust based on your schema:
-- INSERT INTO votes (id, script_id, user_id, vote_type, created_at) VALUES
-- ('vote-001', 'script-001', '00000000-0000-4000-8000-000000000000', 1, NOW()),
-- ('vote-002', 'script-002', '00000000-0000-4000-8000-000000000000', 1, NOW()),
-- ('vote-003', 'script-003', '00000000-0000-4000-8000-000000000000', 1, NOW())
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 12. FLAGS (For moderation)
-- ============================================
INSERT INTO flags (id, reporter_id, target_script_id, target_user_id, reason, status, created_at) VALUES
('flag-001', '00000000-0000-4000-8000-000000000000', 'script-001', NULL, 'Potential copyright violation', 'pending', NOW()),
('flag-002', '00000000-0000-4000-8000-000000000000', NULL, '00000000-0000-4000-8000-000000000000', 'Inappropriate profile content', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify data was inserted:

-- SELECT COUNT(*) as university_count FROM universities;
-- SELECT COUNT(*) as faculty_count FROM faculties;
-- SELECT COUNT(*) as professor_count FROM professors;
-- SELECT COUNT(*) as subject_count FROM subjects;
-- SELECT COUNT(*) as script_count FROM scripts;
-- SELECT COUNT(*) as comment_count FROM comments;

-- Sample retrieval query:
-- SELECT 
--   u.name as university,
--   f.name as faculty,
--   s.name as subject,
--   p.name as professor
-- FROM subjects s
-- JOIN faculties f ON s.faculty_id = f.id
-- JOIN universities u ON f.university_id = u.id
-- JOIN subject_professors sp ON s.id = sp.subject_id
-- JOIN professors p ON sp.professor_id = p.id
-- ORDER BY u.name, f.name, s.name;
