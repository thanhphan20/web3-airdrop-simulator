import { createFileRoute, Link } from "@tanstack/react-router";
import { PointsCard } from "@/components/PointsCard";

export const Route = createFileRoute("/points")({
  component: PointsPage,
});

function PointsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <PointsCard />
        <Link to="/" className="text-sm text-center underline">
          Back to airdrop claim
        </Link>
      </div>
    </div>
  );
}
