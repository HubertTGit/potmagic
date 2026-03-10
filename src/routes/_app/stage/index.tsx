import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/stage/')({
  component: StagePage,
});

function StagePage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4">
      <p className="text-base-content/40 text-sm text-center max-w-xs">
        Currently there is nothing here. Select a story then choose a scene to
        enter the stage.
      </p>
      <Link
        to="/stories"
        className="btn btn-sm btn-gold font-display tracking-[0.05em]"
      >
        Go to Stories
      </Link>
    </div>
  );
}
