import { createFileRoute } from '@tanstack/react-router';
import { InventoryPage } from '@/components/wish/InventoryPage';

export const Route = createFileRoute('/wish/inventory')({
  component: InventoryPage,
});
