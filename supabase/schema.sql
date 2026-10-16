-- ====================================================================
-- MY TOEIC NOTEBOOK - SCHEMA CƠ SỞ DỮ LIỆU & ROW LEVEL SECURITY (RLS)
-- Copy toàn bộ nội dung này và dán vào Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

-- 1. BẢNG TOPICS (Chủ đề từ vựng)
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BẢNG UNITS (Bài học / Lesson)
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG VOCABULARY (Sổ từ vựng & Ghi chú cá nhân)
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    pos TEXT DEFAULT 'noun',
    phonetic_uk TEXT DEFAULT '',
    phonetic_us TEXT DEFAULT '',
    audio_uk TEXT DEFAULT '',
    audio_us TEXT DEFAULT '',
    meaning_vi TEXT NOT NULL,
    example_en TEXT DEFAULT '',
    example_vi TEXT DEFAULT '',
    collocations JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    study_date TEXT DEFAULT '',
    topic_ids JSONB DEFAULT '[]'::jsonb,
    unit_ids JSONB DEFAULT '[]'::jsonb,
    is_memorized BOOLEAN DEFAULT false,
    needs_review BOOLEAN DEFAULT false,
    review_interval_days INT DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    repetitions INT DEFAULT 0,
    next_review_date TEXT DEFAULT '',
    last_reviewed_at TEXT DEFAULT '',
    incorrect_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BẢNG QUIZ_ATTEMPTS (Lịch sử làm bài kiểm tra)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    scope_type TEXT NOT NULL,
    scope_id TEXT DEFAULT '',
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    score_percentage REAL NOT NULL,
    wrong_word_ids JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) - BẢO MẬT TUYỆT ĐỐI THEO TÀI KHOẢN
-- ====================================================================

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ nếu đã tồn tại để tránh xung đột
DROP POLICY IF EXISTS "Users can read own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can insert own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can update own topics" ON public.topics;
DROP POLICY IF EXISTS "Users can delete own topics" ON public.topics;

DROP POLICY IF EXISTS "Users can read own units" ON public.units;
DROP POLICY IF EXISTS "Users can insert own units" ON public.units;
DROP POLICY IF EXISTS "Users can update own units" ON public.units;
DROP POLICY IF EXISTS "Users can delete own units" ON public.units;

DROP POLICY IF EXISTS "Users can read own vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Users can insert own vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Users can update own vocabulary" ON public.vocabulary;
DROP POLICY IF EXISTS "Users can delete own vocabulary" ON public.vocabulary;

DROP POLICY IF EXISTS "Users can read own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can delete own quiz attempts" ON public.quiz_attempts;

-- POLICIES CHO TOPICS
CREATE POLICY "Users can read own topics"
ON public.topics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics"
ON public.topics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics"
ON public.topics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics"
ON public.topics FOR DELETE
USING (auth.uid() = user_id);

-- POLICIES CHO UNITS
CREATE POLICY "Users can read own units"
ON public.units FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own units"
ON public.units FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units"
ON public.units FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units"
ON public.units FOR DELETE
USING (auth.uid() = user_id);

-- POLICIES CHO VOCABULARY
CREATE POLICY "Users can read own vocabulary"
ON public.vocabulary FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
ON public.vocabulary FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
ON public.vocabulary FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary"
ON public.vocabulary FOR DELETE
USING (auth.uid() = user_id);

-- POLICIES CHO QUIZ ATTEMPTS
CREATE POLICY "Users can read own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz attempts"
ON public.quiz_attempts FOR DELETE
USING (auth.uid() = user_id);

-- ====================================================================
-- INDEX TĂNG TỐC ĐỘ TRUY VẤN
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_topics_user ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_units_user ON public.units(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_word ON public.vocabulary(user_id, word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_date ON public.vocabulary(user_id, study_date);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
