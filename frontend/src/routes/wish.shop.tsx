import { createFileRoute } from '@tanstack/react-router';
import { ShopPage } from '@/components/wish/ShopPage';

export const Route = createFileRoute('/wish/shop')({
  component: ShopPage,
});
