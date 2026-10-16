-- ====================================================================
-- MY TOEIC NOTEBOOK - SCHEMA CƠ SỞ DỮ LIỆU & BẢO MẬT CAPABILITY TOKEN
-- CHẾ ĐỘ 2 HỒ SƠ DÙNG CHUNG SỔ TỪ VỰNG - TIẾN ĐỘ HỌC RIÊNG BIỆT
-- KHÔNG CẦN ĐĂNG NHẬP / ĐĂNG KÝ - TRUY CẬP BẰNG ĐƯỜNG LINK RIÊNG AN TOÀN
-- ====================================================================

-- 1. XÓA BẢNG CŨ NẾU CẦN NÂNG CẤP LÊN CƠ CHẾ 2 HỒ SƠ
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.profile_progress CASCADE;
DROP TABLE IF EXISTS public.vocabulary CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.notebooks CASCADE;

-- 2. BẢNG NOTEBOOKS (Quản lý Sổ tay theo mã token bí mật của 2 bạn)
CREATE TABLE public.notebooks (
    token TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'My TOEIC Notebook',
    profile_a_name TEXT NOT NULL DEFAULT 'Người A',
    profile_b_name TEXT NOT NULL DEFAULT 'Người B',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG TOPICS (Chủ đề dùng chung của sổ tay)
CREATE TABLE public.topics (
    id TEXT NOT NULL,
    notebook_token TEXT NOT NULL REFERENCES public.notebooks(token) ON DELETE CASCADE ON UPDATE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (notebook_token, id)
);

-- 4. BẢNG UNITS (Bài học / Lesson dùng chung của sổ tay)
CREATE TABLE public.units (
    id TEXT NOT NULL,
    notebook_token TEXT NOT NULL REFERENCES public.notebooks(token) ON DELETE CASCADE ON UPDATE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (notebook_token, id)
);

-- 5. BẢNG VOCABULARY (Sổ từ vựng dùng chung - Nghĩa, phiên âm, ví dụ, ghi chú chung)
CREATE TABLE public.vocabulary (
    id TEXT NOT NULL,
    notebook_token TEXT NOT NULL REFERENCES public.notebooks(token) ON DELETE CASCADE ON UPDATE CASCADE,
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
    sources JSONB DEFAULT '[]'::jsonb,
    version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (notebook_token, id)
);

-- 6. BẢNG PROFILE_PROGRESS (Tiến độ học tập RIÊNG BIỆT cho Người A và Người B)
CREATE TABLE public.profile_progress (
    notebook_token TEXT NOT NULL REFERENCES public.notebooks(token) ON DELETE CASCADE ON UPDATE CASCADE,
    profile_id TEXT NOT NULL, -- 'profile_a' hoặc 'profile_b'
    word_id TEXT NOT NULL,
    is_memorized BOOLEAN DEFAULT false NOT NULL,
    needs_review BOOLEAN DEFAULT true NOT NULL,
    review_interval_days INT DEFAULT 0 NOT NULL,
    ease_factor REAL DEFAULT 2.5 NOT NULL,
    repetitions INT DEFAULT 0 NOT NULL,
    next_review_date TEXT DEFAULT '',
    last_reviewed_at TEXT DEFAULT '',
    incorrect_count INT DEFAULT 0 NOT NULL,
    correct_count INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (notebook_token, profile_id, word_id)
);

-- 7. BẢNG QUIZ_ATTEMPTS (Lịch sử làm kiểm tra RIÊNG BIỆT cho từng người)
CREATE TABLE public.quiz_attempts (
    id TEXT NOT NULL,
    notebook_token TEXT NOT NULL REFERENCES public.notebooks(token) ON DELETE CASCADE ON UPDATE CASCADE,
    profile_id TEXT NOT NULL, -- 'profile_a' hoặc 'profile_b'
    mode TEXT NOT NULL,
    scope_type TEXT NOT NULL,
    scope_id TEXT DEFAULT '',
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    score_percentage REAL NOT NULL,
    wrong_word_ids JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (notebook_token, id)
);

-- 8. THIẾT LẬP CHỈ MỤC TỐI ƯU TRUY VẤN
CREATE INDEX idx_topics_notebook ON public.topics(notebook_token);
CREATE INDEX idx_units_notebook ON public.units(notebook_token);
CREATE INDEX idx_vocab_notebook ON public.vocabulary(notebook_token);
CREATE INDEX idx_vocab_word ON public.vocabulary(notebook_token, word);
CREATE INDEX idx_progress_profile ON public.profile_progress(notebook_token, profile_id);
CREATE INDEX idx_quiz_profile ON public.quiz_attempts(notebook_token, profile_id, completed_at DESC);

-- ====================================================================
-- PHÂN QUYỀN BẢO MẬT & THU HỒI QUYỀN TRỰC TIẾP TỪ ANONYMOUS CLIENT
-- ====================================================================

-- Kích hoạt RLS trên tất cả các bảng
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Thu hồi toàn bộ quyền đọc/ghi trực tiếp đối với anon và authenticated
-- Người dùng vãng lai hoặc không có token KHÔNG THỂ quét, đọc hay sửa bảng
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ====================================================================
-- HÀM RPC BẢO MẬT (SECURITY DEFINER) - BẢO VỆ DỮ LIỆU BẰNG TOKEN RIÊNG
-- ====================================================================

-- Hàm khởi tạo hoặc lấy dữ liệu toàn bộ sổ tay
CREATE OR REPLACE FUNCTION public.rpc_init_or_get_notebook(
    p_token TEXT,
    p_initial_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notebook public.notebooks%ROWTYPE;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mã token truy cập không hợp lệ');
    END IF;

    SELECT * INTO v_notebook FROM public.notebooks WHERE token = p_token;
    
    -- Nếu chưa có sổ tay với token này và có dữ liệu khởi tạo -> Tạo mới
    IF NOT FOUND THEN
        IF p_initial_data IS NOT NULL THEN
            INSERT INTO public.notebooks (token, name, profile_a_name, profile_b_name, created_at, updated_at)
            VALUES (
                p_token,
                COALESCE(p_initial_data->>'name', 'My TOEIC Notebook'),
                COALESCE(p_initial_data->>'profile_a_name', 'Người A'),
                COALESCE(p_initial_data->>'profile_b_name', 'Người B'),
                v_now,
                v_now
            ) RETURNING * INTO v_notebook;

            -- Nạp topics khởi tạo
            IF jsonb_typeof(p_initial_data->'topics') = 'array' THEN
                INSERT INTO public.topics (id, notebook_token, name, description, color, created_at, updated_at)
                SELECT 
                    elem->>'id',
                    p_token,
                    elem->>'name',
                    COALESCE(elem->>'description', ''),
                    COALESCE(elem->>'color', '#2563eb'),
                    v_now,
                    v_now
                FROM jsonb_array_elements(p_initial_data->'topics') AS elem
                ON CONFLICT (notebook_token, id) DO NOTHING;
            END IF;

            -- Nạp units khởi tạo
            IF jsonb_typeof(p_initial_data->'units') = 'array' THEN
                INSERT INTO public.units (id, notebook_token, title, description, category, created_at, updated_at)
                SELECT 
                    elem->>'id',
                    p_token,
                    elem->>'title',
                    COALESCE(elem->>'description', ''),
                    COALESCE(elem->>'category', 'General'),
                    v_now,
                    v_now
                FROM jsonb_array_elements(p_initial_data->'units') AS elem
                ON CONFLICT (notebook_token, id) DO NOTHING;
            END IF;

            -- Nạp vocabulary khởi tạo
            IF jsonb_typeof(p_initial_data->'vocabulary') = 'array' THEN
                INSERT INTO public.vocabulary (
                    id, notebook_token, word, pos, phonetic_uk, phonetic_us, audio_uk, audio_us,
                    meaning_vi, example_en, example_vi, collocations, notes, study_date,
                    topic_ids, unit_ids, sources, version, created_at, updated_at
                )
                SELECT 
                    elem->>'id',
                    p_token,
                    elem->>'word',
                    COALESCE(elem->>'pos', 'noun'),
                    COALESCE(elem->>'phonetic_uk', ''),
                    COALESCE(elem->>'phonetic_us', ''),
                    COALESCE(elem->>'audio_uk', ''),
                    COALESCE(elem->>'audio_us', ''),
                    elem->>'meaning_vi',
                    COALESCE(elem->>'example_en', ''),
                    COALESCE(elem->>'example_vi', ''),
                    COALESCE(elem->'collocations', '[]'::jsonb),
                    COALESCE(elem->>'notes', ''),
                    COALESCE(elem->>'study_date', ''),
                    COALESCE(elem->'topic_ids', '[]'::jsonb),
                    COALESCE(elem->'unit_ids', '[]'::jsonb),
                    COALESCE(elem->'sources', '[]'::jsonb),
                    1,
                    v_now,
                    v_now
                FROM jsonb_array_elements(p_initial_data->'vocabulary') AS elem
                ON CONFLICT (notebook_token, id) DO NOTHING;
            END IF;

            -- Nạp progress Người A & Người B nếu có trong snapshot
            IF jsonb_typeof(p_initial_data->'progress') = 'array' THEN
                INSERT INTO public.profile_progress (
                    notebook_token, profile_id, word_id, is_memorized, needs_review,
                    review_interval_days, ease_factor, repetitions, next_review_date,
                    last_reviewed_at, incorrect_count, correct_count, updated_at
                )
                SELECT 
                    p_token,
                    elem->>'profile_id',
                    elem->>'word_id',
                    COALESCE((elem->>'is_memorized')::boolean, false),
                    COALESCE((elem->>'needs_review')::boolean, true),
                    COALESCE((elem->>'review_interval_days')::int, 0),
                    COALESCE((elem->>'ease_factor')::real, 2.5),
                    COALESCE((elem->>'repetitions')::int, 0),
                    COALESCE(elem->>'next_review_date', ''),
                    COALESCE(elem->>'last_reviewed_at', ''),
                    COALESCE((elem->>'incorrect_count')::int, 0),
                    COALESCE((elem->>'correct_count')::int, 0),
                    v_now
                FROM jsonb_array_elements(p_initial_data->'progress') AS elem
                ON CONFLICT (notebook_token, profile_id, word_id) DO NOTHING;
            END IF;
        ELSE
            -- Tạo sổ tay trống với hồ sơ mặc định
            INSERT INTO public.notebooks (token, name, profile_a_name, profile_b_name, created_at, updated_at)
            VALUES (p_token, 'My TOEIC Notebook', 'Người A', 'Người B', v_now, v_now)
            RETURNING * INTO v_notebook;
        END IF;
    END IF;

    -- Trả về gói dữ liệu toàn diện
    RETURN jsonb_build_object(
        'success', true,
        'notebook', to_jsonb(v_notebook),
        'topics', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at ASC) FROM public.topics t WHERE t.notebook_token = p_token), '[]'::jsonb),
        'units', COALESCE((SELECT jsonb_agg(to_jsonb(u) ORDER BY u.created_at ASC) FROM public.units u WHERE u.notebook_token = p_token), '[]'::jsonb),
        'vocabulary', COALESCE((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.created_at DESC) FROM public.vocabulary v WHERE v.notebook_token = p_token), '[]'::jsonb),
        'progress', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM public.profile_progress p WHERE p.notebook_token = p_token), '[]'::jsonb),
        'quiz_attempts', COALESCE((SELECT jsonb_agg(to_jsonb(q)) FROM (
            SELECT * FROM public.quiz_attempts WHERE notebook_token = p_token ORDER BY completed_at DESC LIMIT 100
        ) q), '[]'::jsonb)
    );
END;
$$;

-- Hàm lưu từ vựng (Có phát hiện xung đột ghi chú)
CREATE OR REPLACE FUNCTION public.rpc_save_vocabulary(
    p_token TEXT,
    p_word JSONB,
    p_last_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_word_id TEXT := p_word->>'id';
    v_existing public.vocabulary%ROWTYPE;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_new_notes TEXT := COALESCE(p_word->>'notes', '');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.notebooks WHERE token = p_token) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Token không hợp lệ');
    END IF;

    SELECT * INTO v_existing FROM public.vocabulary WHERE notebook_token = p_token AND id = v_word_id;

    -- Kiểm tra xung đột ghi chú: nếu máy khách gửi thời điểm cũ hơn bản ghi trên server và ghi chú đã bị người kia sửa
    IF FOUND AND p_last_updated_at IS NOT NULL THEN
        IF v_existing.updated_at > p_last_updated_at AND v_existing.notes != v_new_notes THEN
            RETURN jsonb_build_object(
                'success', false,
                'conflict', true,
                'server_notes', v_existing.notes,
                'server_updated_at', v_existing.updated_at,
                'server_version', v_existing.version
            );
        END IF;
    END IF;

    INSERT INTO public.vocabulary (
        id, notebook_token, word, pos, phonetic_uk, phonetic_us, audio_uk, audio_us,
        meaning_vi, example_en, example_vi, collocations, notes, study_date,
        topic_ids, unit_ids, sources, version, created_at, updated_at
    ) VALUES (
        v_word_id,
        p_token,
        p_word->>'word',
        COALESCE(p_word->>'pos', 'noun'),
        COALESCE(p_word->>'phonetic_uk', ''),
        COALESCE(p_word->>'phonetic_us', ''),
        COALESCE(p_word->>'audio_uk', ''),
        COALESCE(p_word->>'audio_us', ''),
        p_word->>'meaning_vi',
        COALESCE(p_word->>'example_en', ''),
        COALESCE(p_word->>'example_vi', ''),
        COALESCE(p_word->'collocations', '[]'::jsonb),
        v_new_notes,
        COALESCE(p_word->>'study_date', ''),
        COALESCE(p_word->'topic_ids', '[]'::jsonb),
        COALESCE(p_word->'unit_ids', '[]'::jsonb),
        COALESCE(p_word->'sources', '[]'::jsonb),
        COALESCE(v_existing.version, 0) + 1,
        COALESCE(v_existing.created_at, v_now),
        v_now
    )
    ON CONFLICT (notebook_token, id) DO UPDATE SET
        word = EXCLUDED.word,
        pos = EXCLUDED.pos,
        phonetic_uk = EXCLUDED.phonetic_uk,
        phonetic_us = EXCLUDED.phonetic_us,
        audio_uk = EXCLUDED.audio_uk,
        audio_us = EXCLUDED.audio_us,
        meaning_vi = EXCLUDED.meaning_vi,
        example_en = EXCLUDED.example_en,
        example_vi = EXCLUDED.example_vi,
        collocations = EXCLUDED.collocations,
        notes = EXCLUDED.notes,
        study_date = EXCLUDED.study_date,
        topic_ids = EXCLUDED.topic_ids,
        unit_ids = EXCLUDED.unit_ids,
        sources = EXCLUDED.sources,
        version = public.vocabulary.version + 1,
        updated_at = v_now;

    RETURN jsonb_build_object('success', true, 'updated_at', v_now);
END;
$$;

-- Hàm xóa từ vựng
CREATE OR REPLACE FUNCTION public.rpc_delete_vocabulary(p_token TEXT, p_word_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.vocabulary WHERE notebook_token = p_token AND id = p_word_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm lưu Topic
CREATE OR REPLACE FUNCTION public.rpc_save_topic(p_token TEXT, p_topic JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    INSERT INTO public.topics (id, notebook_token, name, description, color, created_at, updated_at)
    VALUES (
        p_topic->>'id',
        p_token,
        p_topic->>'name',
        COALESCE(p_topic->>'description', ''),
        COALESCE(p_topic->>'color', '#2563eb'),
        v_now,
        v_now
    )
    ON CONFLICT (notebook_token, id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        updated_at = v_now;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm xóa Topic
CREATE OR REPLACE FUNCTION public.rpc_delete_topic(p_token TEXT, p_topic_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.topics WHERE notebook_token = p_token AND id = p_topic_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm lưu Unit
CREATE OR REPLACE FUNCTION public.rpc_save_unit(p_token TEXT, p_unit JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    INSERT INTO public.units (id, notebook_token, title, description, category, created_at, updated_at)
    VALUES (
        p_unit->>'id',
        p_token,
        p_unit->>'title',
        COALESCE(p_unit->>'description', ''),
        COALESCE(p_unit->>'category', 'General'),
        v_now,
        v_now
    )
    ON CONFLICT (notebook_token, id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        updated_at = v_now;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm xóa Unit
CREATE OR REPLACE FUNCTION public.rpc_delete_unit(p_token TEXT, p_unit_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.units WHERE notebook_token = p_token AND id = p_unit_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm lưu tiến độ học riêng cho Người A hoặc Người B
CREATE OR REPLACE FUNCTION public.rpc_update_progress(
    p_token TEXT,
    p_profile_id TEXT,
    p_word_id TEXT,
    p_progress JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF p_profile_id NOT IN ('profile_a', 'profile_b') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Hồ sơ không hợp lệ');
    END IF;

    INSERT INTO public.profile_progress (
        notebook_token, profile_id, word_id, is_memorized, needs_review,
        review_interval_days, ease_factor, repetitions, next_review_date,
        last_reviewed_at, incorrect_count, correct_count, updated_at
    ) VALUES (
        p_token,
        p_profile_id,
        p_word_id,
        COALESCE((p_progress->>'is_memorized')::boolean, false),
        COALESCE((p_progress->>'needs_review')::boolean, true),
        COALESCE((p_progress->>'review_interval_days')::int, 0),
        COALESCE((p_progress->>'ease_factor')::real, 2.5),
        COALESCE((p_progress->>'repetitions')::int, 0),
        COALESCE(p_progress->>'next_review_date', ''),
        COALESCE(p_progress->>'last_reviewed_at', ''),
        COALESCE((p_progress->>'incorrect_count')::int, 0),
        COALESCE((p_progress->>'correct_count')::int, 0),
        v_now
    )
    ON CONFLICT (notebook_token, profile_id, word_id) DO UPDATE SET
        is_memorized = EXCLUDED.is_memorized,
        needs_review = EXCLUDED.needs_review,
        review_interval_days = EXCLUDED.review_interval_days,
        ease_factor = EXCLUDED.ease_factor,
        repetitions = EXCLUDED.repetitions,
        next_review_date = EXCLUDED.next_review_date,
        last_reviewed_at = EXCLUDED.last_reviewed_at,
        incorrect_count = EXCLUDED.incorrect_count,
        correct_count = EXCLUDED.correct_count,
        updated_at = v_now;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm lưu kết quả bài kiểm tra Quiz cho từng người
CREATE OR REPLACE FUNCTION public.rpc_save_quiz_attempt(
    p_token TEXT,
    p_attempt JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.quiz_attempts (
        id, notebook_token, profile_id, mode, scope_type, scope_id,
        total_questions, correct_count, score_percentage, wrong_word_ids, completed_at
    ) VALUES (
        p_attempt->>'id',
        p_token,
        COALESCE(p_attempt->>'profile_id', 'profile_a'),
        p_attempt->>'mode',
        p_attempt->>'scope_type',
        COALESCE(p_attempt->>'scope_id', ''),
        (p_attempt->>'total_questions')::int,
        (p_attempt->>'correct_count')::int,
        (p_attempt->>'score_percentage')::real,
        COALESCE(p_attempt->'wrong_word_ids', '[]'::jsonb),
        timezone('utc'::text, now())
    )
    ON CONFLICT (notebook_token, id) DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm đổi tên 2 hồ sơ
CREATE OR REPLACE FUNCTION public.rpc_update_profiles(
    p_token TEXT,
    p_name_a TEXT,
    p_name_b TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notebooks
    SET 
        profile_a_name = trim(p_name_a),
        profile_b_name = trim(p_name_b),
        updated_at = timezone('utc'::text, now())
    WHERE token = p_token;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Hàm thu hồi và cấp lại link mới khi bị lộ link cũ (Rotate Token)
CREATE OR REPLACE FUNCTION public.rpc_rotate_token(
    p_old_token TEXT,
    p_new_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.notebooks WHERE token = p_old_token) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mã liên kết cũ không tồn tại');
    END IF;

    IF p_new_token IS NULL OR length(trim(p_new_token)) < 8 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mã liên kết mới không đủ an toàn');
    END IF;

    UPDATE public.notebooks
    SET token = p_new_token, updated_at = timezone('utc'::text, now())
    WHERE token = p_old_token;

    RETURN jsonb_build_object('success', true, 'new_token', p_new_token);
END;
$$;

-- CẤP QUYỀN THỰC THI RPC CHO CLIENT
GRANT EXECUTE ON FUNCTION public.rpc_init_or_get_notebook(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_save_vocabulary(TEXT, JSONB, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_vocabulary(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_save_topic(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_topic(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_save_unit(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_unit(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_progress(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_save_quiz_attempt(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_profiles(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_rotate_token(TEXT, TEXT) TO anon, authenticated;
