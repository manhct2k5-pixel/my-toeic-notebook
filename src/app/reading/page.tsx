import { ReadingRunner } from '@/components/reading/ReadingRunner';

export const metadata = {
  title: 'Luyện đọc TOEIC Reading – My TOEIC Notebook',
  description: 'Luyện Reading Part 5, 6, 7 với lời giải chi tiết và tra cứu/lưu từ vựng trực tiếp vào sổ tay.',
};

export default function ReadingPage() {
  return (
    <div className="flex-1 bg-[#fbfbfa]">
      <ReadingRunner />
    </div>
  );
}
