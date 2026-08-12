import { createFileRoute } from '@tanstack/react-router';
import { HistoryPage } from '@/components/wish/HistoryPage';

export const Route = createFileRoute('/wish/history')({
  component: HistoryPage,
});
