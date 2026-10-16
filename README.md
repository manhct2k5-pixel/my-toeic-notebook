# My TOEIC Notebook – Sổ tay học TOEIC cá nhân

**My TOEIC Notebook** là website học TOEIC cá nhân hoàn chỉnh, hiện đại dành cho người tự học tiếng Anh (đặc biệt là người mới bắt đầu).

Không đơn thuần là một website giải đề hay bảng từ vựng tĩnh, **My TOEIC Notebook** được thiết kế như **một cuốn sổ tay điện tử thông minh**: lấy **Sổ từ vựng làm trung tâm**, kết nối trực tiếp với các bài luyện tập **Listening** và **Reading**.

---

## 🌟 Điểm nổi bật & Triết lý thiết kế

* **Phong cách UI/UX Minimalist & Clean**: Lấy cảm hứng từ Notion và các ứng dụng ghi chú hiện đại với tông màu trắng kem nhẹ, xanh navy, xanh dương nhạt và xám trung tính; font chữ Inter rõ ràng, tối ưu hiển thị tiếng Việt.
* **Sổ từ vựng là trung tâm (Notebook-First Architecture)**:
  * Tổ chức đa chiều từ cùng một cơ sở dữ liệu (không tạo bản sao từ vựng):
    1. **Theo Chủ đề (Topics)**: Office & Work, Finance, Contracts, Marketing... Cho phép tạo mới, sửa tên, đổi màu và xóa an toàn.
    2. **Theo Unit / Lesson**: Gắn từ vào các bài học cụ thể (ví dụ: *Lesson 01 – Contracts*, *TOEIC Listening Part 2 Unit 01*).
    3. **Theo Ngày học (Study Dates)**: Hiển thị nhật ký ghi chép theo ngày kèm số lượng từ, cho phép đổi ngày học linh hoạt.
  * Bố cục 3 cột trực quan trên máy tính:
    * **Cột trái**: Bộ lọc danh mục (Tất cả từ, Chưa nhớ, Cần ôn, Chủ đề, Unit, Ngày học).
    * **Cột giữa**: Danh sách từ vựng kèm thanh tìm kiếm toàn diện (từ, nghĩa, ghi chú, chủ đề, unit) và bộ lọc/sắp xếp.
    * **Cột phải**: Chi tiết từ vựng, phát âm UK/US, ví dụ song ngữ, collocations và **khung ghi chú tự do hỗ trợ định dạng Markdown kèm tính năng tự động lưu (auto-save)**.
  * **Tối ưu trải nghiệm di động (Mobile Responsive)**: Chuyển đổi linh hoạt giữa 3 màn hình điều hướng (Danh mục → Danh sách từ → Chi tiết từ) với nút quay lại tiện lợi thay vì cố nhồi nhét 3 cột.
* **Gợi ý từ điển & Tránh trùng lặp từ**:
  * Tích hợp tra cứu từ điển trực tuyến Free Dictionary API chuẩn xác (không bịa nghĩa hay phiên âm).
  * Kiểm tra từ trùng khi nhập: cảnh báo người dùng và gợi ý mở hồ sơ từ cũ để bổ sung ghi chú/ví dụ mới thay vì tạo bản sao rác.
* **Kiểm tra từ vựng đa dạng & Lặp lại ngắt quãng (Spaced Repetition)**:
  * 5 chế độ kiểm tra:
    1. **Flashcard lật thẻ**: Mặt trước tiếng Anh + phát âm, mặt sau nghĩa + ghi chú sổ tay, chấm điểm SRS (Chưa nhớ / Khó / Nhớ tốt / Rất dễ).
    2. **Trắc nghiệm 4 đáp án**: Chọn nghĩa tiếng Việt đúng.
    3. **Gõ từ tiếng Anh (Fill-in)**: Cho nghĩa tiếng Việt, tự gõ từ tiếng Anh (có hỗ trợ gợi ý ký tự đầu).
    4. **Listening Vocabulary**: Nghe phát âm chuẩn UK/US và gõ lại từ.
    5. **Mixed Quiz (Tổng hợp)**: Kết hợp các dạng câu hỏi.
  * Tùy chọn phạm vi kiểm tra: Toàn bộ sổ, theo Chủ đề, theo Unit, theo Ngày, chỉ từ chưa nhớ, hoặc chỉ từ hay làm sai.
  * **Tính năng "Làm lại chỉ các từ sai"**: Giúp tập trung khắc phục điểm yếu ngay sau khi làm bài.
  * Thuật toán SM-2 tự động tính toán khoảng cách ôn tập tiếp theo và gắn nhãn "Cần ôn tập" cho các từ làm sai.
* **Listening & Reading liên kết trực tiếp với Sổ từ vựng**:
  * **Listening TOEIC**: Hỗ trợ Part 1, 2, 3, 4 với trình phát audio đầy đủ (Play/Pause, tua ±5s, chỉnh tốc độ 0.75x / 1.0x / 1.25x), câu hỏi trắc nghiệm, giải thích tiếng Việt và transcript.
  * **Reading TOEIC**: Hỗ trợ Part 5, 6, 7 với giao diện đọc rõ ràng, câu hỏi và giải thích tiếng Việt chi tiết.
  * **Tính năng Bôi đen lưu từ (Highlight to Save)**: Trong cả transcript bài nghe và đoạn văn bài đọc, chỉ cần bôi đen bất kỳ từ hoặc cụm từ nào, popup sẽ hiển thị để tra nghĩa và **lưu ngay vào Sổ từ vựng chỉ với 1 cú click**, tự động lưu kèm câu gốc và tên bài học làm ngữ cảnh!
* **Chế độ lưu trữ kép (Dual-Mode Storage)**:
  * **Local-First (Offline)**: Sử dụng LocalStorage/IndexedDB lưu an toàn trên trình duyệt, không cần cấu hình tài khoản phức tạp.
  * **Supabase Cloud Sync**: Hỗ trợ đầy đủ PostgreSQL, Row Level Security (RLS) để đồng bộ đa thiết bị khi cấu hình biến môi trường Supabase.
  * **Sao lưu dữ liệu**: Xuất/nhập bản sao lưu định dạng JSON và xuất danh sách từ vựng ra CSV.

---

## 🛠 Công nghệ sử dụng

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript
* **Styling**: Tailwind CSS v4, Lucide Icons
* **Audio & Speech**: Web Audio API & Web Speech Synthesis API (giọng US & UK)
* **Hiệu ứng**: Canvas Confetti
* **Database & Auth (Tùy chọn)**: Supabase (@supabase/supabase-js) + PostgreSQL + RLS

---

## 📁 Cấu trúc thư mục

```text
WebLeaenToeic/
├── .env.example                     # Mẫu biến môi trường Supabase
├── public/                          # Static assets
├── supabase/
│   ├── migrations/
│   │   └── 20261016_init_schema.sql # Schema PostgreSQL + Row Level Security
│   └── seed.sql                     # Dữ liệu mẫu PostgreSQL
├── src/
│   ├── app/
│   │   ├── globals.css              # Theme CSS và Notion-like styles
│   │   ├── layout.tsx               # Root layout với Navbar & Footer
│   │   ├── page.tsx                 # Trang chủ gọn gàng
│   │   ├── notebook/page.tsx        # My Notebook (Trung tâm ứng dụng)
│   │   ├── practice/page.tsx        # Ôn tập & Flashcard & Quiz
│   │   ├── listening/page.tsx       # Luyện nghe TOEIC Part 1 - 4
│   │   ├── reading/page.tsx         # Luyện đọc TOEIC Part 5 - 7
│   │   └── settings/page.tsx        # Cài đặt, sao lưu JSON/CSV, Supabase
│   ├── components/
│   │   ├── layout/                  # Navbar, Footer
│   │   ├── notebook/                # Sidebar, WordList, WordDetail, WordModal, TopicModal, UnitModal
│   │   ├── practice/                # FlashcardRunner, QuizMCQ, QuizFill, QuizListening, QuizResult
│   │   ├── listening/               # AudioPlayer, ListeningRunner
│   │   ├── reading/                 # ReadingRunner
│   │   └── common/                  # SaveWordModal, TextHighlighter
│   ├── lib/
│   │   ├── storage.ts               # Storage repository (Local + Cloud sync)
│   │   ├── dictionary.ts            # Tra cứu từ điển tự động
│   │   ├── speech.ts                # Phát âm UK & US (Web Speech + Audio)
│   │   ├── srs.ts                   # Thuật toán Spaced Repetition (SM-2)
│   │   ├── supabase.ts              # Client kết nối Supabase
│   │   └── seed-data.ts             # Dữ liệu mẫu khởi đầu (Chủ đề, Unit, Từ vựng, Bài tập)
│   └── types/
│       └── index.ts                 # TypeScript types & interfaces
└── package.json
```

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Yêu cầu môi trường
* Node.js v18 trở lên (Khuyến nghị Node.js v20+)
* npm hoặc yarn/pnpm

### 2. Cài đặt dependencies
Mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### 3. Khởi động môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập trình duyệt tại: [http://localhost:3000](http://localhost:3000)

### 4. Build sản phẩm (Production)
```bash
npm run build
npm run start
```

---

## ☁️ Cấu hình Supabase (Tùy chọn)

Mặc định, ứng dụng chạy hoàn hảo ở chế độ **Lưu trữ cục bộ (Local-First)** trên trình duyệt.

Nếu muốn đồng bộ dữ liệu lên Supabase Cloud:
1. Tạo một project mới tại [Supabase](https://supabase.com).
2. Vào mục **SQL Editor** trong Supabase Dashboard, copy nội dung tệp `supabase/migrations/20261016_init_schema.sql` và chạy để tạo bảng và chính sách bảo mật RLS.
3. Tạo tệp `.env.local` tại thư mục gốc với nội dung:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
4. Khởi động lại `npm run dev`. Website sẽ tự động phát hiện và chuyển sang trạng thái **Cloud Sync**.

---

## ✅ Kiểm chứng tiêu chí nghiệm thu (Acceptance Criteria)

1. **Tạo chủ đề "Office"**: Mở My Notebook → nhấn dấu `+` ở mục Chủ đề → nhập tên và chọn màu sắc.
2. **Tạo Unit "Lesson 01"**: Nhấn dấu `+` ở mục Unit / Lesson → nhập tên và mô tả.
3. **Thêm từ "appointment"**: Nhấn "Thêm từ" → nhập "appointment" → bấm "Gợi ý từ điển" để tự động điền phiên âm, loại từ; ghi chú các cụm từ liên quan và chọn gắn vào Topic Office & Unit Lesson 01.
4. **Duy trì dữ liệu**: Đóng trình duyệt hoặc reload trang (F5), toàn bộ từ vựng, chủ đề, unit và ghi chú vẫn được lưu vẹn nguyên.
5. **Đa góc nhìn (Multi-perspective)**: Chọn lọc theo chủ đề Office hoặc lọc theo Unit Lesson 01 đều thấy từ "appointment" hiển thị chính xác mà không bị nhân bản từ.
6. **Tìm kiếm & Chỉnh sửa**: Nhập "appointment" vào ô tìm kiếm → mở chi tiết từ → chỉnh sửa trực tiếp phần Ghi chú sổ tay (hệ thống tự động lưu sau mỗi lần gõ).
7. **Thêm từ thứ hai vào Unit**: Thêm từ mới thứ hai (hoặc chọn từ có sẵn) gắn vào Lesson 01.
8. **Tạo Quiz theo Unit**: Vào mục "Ôn tập & Quiz" → chọn phạm vi "Theo Unit / Lesson" → chọn "Lesson 01" → chọn số lượng câu hỏi và bắt đầu làm bài.
9. **Theo dõi từ sai**: Trả lời sai một từ trong bài kiểm tra → kết quả bài thi tự động đánh dấu từ đó và đưa vào danh sách "Từ cần ôn".
10. **Lưu từ trực tiếp từ bài Listening/Reading**: Mở bài nghe hoặc bài đọc → bôi đen một từ trong transcript hoặc đoạn văn → popup "Lưu từ vào sổ" xuất hiện với câu gốc và tên bài học được tự động điền sẵn → lưu vào sổ thành công.
11. **Xuất/Nhập dữ liệu**: Vào trang Cài đặt → nhấn "Xuất toàn bộ dữ liệu (JSON)" hoặc "Xuất từ vựng (CSV)" để tải tệp sao lưu về máy tính.
