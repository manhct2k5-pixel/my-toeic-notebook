import { ListeningRunner } from '@/components/listening/ListeningRunner';

export const metadata = {
  title: 'Luyện nghe TOEIC Listening – My TOEIC Notebook',
  description: 'Luyện Listening Part 1, 2, 3, 4 với audio player, transcript thông minh và lưu từ vựng trực tiếp vào sổ tay.',
};

export default function ListeningPage() {
  return (
    <div className="flex-1 bg-[#fbfbfa]">
      <ListeningRunner />
    </div>
  );
}
