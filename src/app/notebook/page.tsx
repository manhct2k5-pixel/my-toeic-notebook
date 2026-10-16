import { NotebookView } from '@/components/notebook/NotebookView';

export const metadata = {
  title: 'My Notebook – Sổ tay từ vựng TOEIC cá nhân',
  description: 'Quản lý từ vựng theo Chủ đề, Unit, Ngày học; ghi chú thông minh, tra cứu từ điển và phát âm chuẩn.',
};

export default function NotebookPage() {
  return <NotebookView />;
}
