-- ====================================================================
-- MY TOEIC NOTEBOOK - SUPABASE POSTGRESQL DATABASE SCHEMA WITH RLS
-- ====================================================================

-- 1. Profiles Table (linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Auto create profile on auth signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#2563eb',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topics" 
  ON public.topics FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own topics" 
  ON public.topics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics" 
  ON public.topics FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics" 
  ON public.topics FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Units Table
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Listening', 'Reading', 'General')) DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own units" 
  ON public.units FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own units" 
  ON public.units FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own units" 
  ON public.units FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own units" 
  ON public.units FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Vocabulary Table
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  pos TEXT NOT NULL DEFAULT 'noun',
  phonetic_uk TEXT,
  phonetic_us TEXT,
  audio_uk TEXT,
  audio_us TEXT,
  meaning_vi TEXT NOT NULL,
  example_en TEXT,
  example_vi TEXT,
  collocations JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  study_date DATE DEFAULT CURRENT_DATE,
  is_memorized BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT TRUE,
  
  -- Spaced Repetition (SM-2)
  review_interval_days INTEGER DEFAULT 1,
  ease_factor NUMERIC(3,2) DEFAULT 2.50,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  incorrect_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocabulary" 
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

-- 5. Vocabulary - Topics Junction Table
CREATE TABLE IF NOT EXISTS public.vocabulary_topics (
  vocabulary_id UUID REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (vocabulary_id, topic_id)
);

ALTER TABLE public.vocabulary_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vocabulary_topics" 
  ON public.vocabulary_topics FOR SELECT 
  USING (true);

CREATE POLICY "Users can modify vocabulary_topics" 
  ON public.vocabulary_topics FOR ALL 
  USING (true);

-- 6. Vocabulary - Units Junction Table
CREATE TABLE IF NOT EXISTS public.vocabulary_units (
  vocabulary_id UUID REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (vocabulary_id, unit_id)
);

ALTER TABLE public.vocabulary_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vocabulary_units" 
  ON public.vocabulary_units FOR SELECT 
  USING (true);

CREATE POLICY "Users can modify vocabulary_units" 
  ON public.vocabulary_units FOR ALL 
  USING (true);

-- 7. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_id TEXT,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  score_percentage NUMERIC(5,2) NOT NULL,
  wrong_word_ids JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts" 
  ON public.quiz_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" 
  ON public.quiz_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 8. Lesson Attempts Table (Listening & Reading)
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  part INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  selected_answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson attempts" 
  ON public.lesson_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson attempts" 
  ON public.lesson_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON public.vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_vocabulary_study_date ON public.vocabulary(study_date);
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON public.vocabulary(next_review_date);
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON public.topics(user_id);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);
