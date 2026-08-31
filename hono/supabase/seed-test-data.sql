-- Scriptr local/API test data.
-- Run in Supabase SQL Editor after creating the test Auth user.
-- The test user must already exist in auth.users.

begin;

-- Existing test account used for authenticated API requests.
-- Change this UUID if you want to seed data for another account.
insert into public.profiles (id, username, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'username', 'scriptr_api_test'),
  coalesce(raw_user_meta_data->>'full_name', 'Scriptr API Test'),
  'moderator'
from auth.users
where id = '00000000-0000-4000-8000-000000000000'
on conflict (id) do update set
  role = 'moderator';

insert into public.professors (id, name, bio, picture_url)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Dr. Ada Lovelace',
    'Algorithms and software engineering.',
    null
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Dr. Alan Turing',
    'Computer systems and theory.',
    null
  )
on conflict (id) do update set
  name = excluded.name,
  bio = excluded.bio,
  picture_url = excluded.picture_url;

insert into public.subjects (id, name, year, exam_session, description)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'Algorithms and Data Structures',
    1,
    'June',
    'Core algorithms, complexity, and data structures.'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Computer Systems',
    1,
    'September',
    'Foundations of computer architecture and operating systems.'
  )
on conflict (id) do update set
  name = excluded.name,
  year = excluded.year,
  exam_session = excluded.exam_session,
  description = excluded.description;

insert into public.subject_professors (subject_id, professor_id)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  )
on conflict (subject_id, professor_id) do nothing;

insert into public.scripts (
  id,
  author_id,
  subject_id,
  professor_id,
  title,
  description,
  file_type,
  file_url,
  vote_score,
  download_count,
  is_flagged
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-4000-8000-000000000000',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Algorithms revision notes',
    'Placeholder notes for API testing.',
    'pdf',
    'test-data/algorithms-revision-notes.pdf',
    1,
    3,
    false
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-4000-8000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Computer systems summary',
    'Placeholder systems summary for API testing.',
    'pdf',
    'test-data/computer-systems-summary.pdf',
    0,
    1,
    false
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  file_type = excluded.file_type,
  file_url = excluded.file_url,
  vote_score = excluded.vote_score,
  download_count = excluded.download_count,
  is_flagged = excluded.is_flagged;

insert into public.comments (id, author_id, professor_id, content)
values (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-4000-8000-000000000000',
  '10000000-0000-0000-0000-000000000001',
  'These revision notes are clear and useful.'
)
on conflict (id) do update set content = excluded.content;

insert into public.votes (id, user_id, script_id, value)
values (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-4000-8000-000000000000',
  '30000000-0000-0000-0000-000000000001',
  1
)
on conflict (id) do update set value = excluded.value;

commit;

-- Useful IDs for Insomnia:
-- professor_id: 10000000-0000-0000-0000-000000000001
-- subject_id:   20000000-0000-0000-0000-000000000001
-- script_id:    30000000-0000-0000-0000-000000000001
-- user_id:      00000000-0000-4000-8000-000000000000
