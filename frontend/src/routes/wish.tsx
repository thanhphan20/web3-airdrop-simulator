import { createFileRoute } from '@tanstack/react-router';
import { WishPage } from '@/components/wish/WishPage';

export const Route = createFileRoute('/wish')({
  component: WishPage,
});