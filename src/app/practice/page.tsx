import { PracticeRunner } from '@/components/practice/PracticeRunner';

export const metadata = {
  title: 'Ôn tập & Kiểm tra từ vựng – My TOEIC Notebook',
  description: 'Luyện tập Flashcard, Trắc nghiệm, Gõ từ vựng, Listening Vocabulary và Spaced Repetition.',
};

export default function PracticePage() {
  return (
    <div className="flex-1 py-6 sm:py-8 bg-[#fbfbfa]">
      <PracticeRunner />
    </div>
  );
}
