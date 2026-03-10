import { createFileRoute } from '@tanstack/react-router';
import { StageComponent } from '../components/stage.component';
import bearPng from '../assets/bear.png';
import crocodilePng from '../assets/crocodile.png';
import { requireAuth } from '@/lib/auth-guard';

export const Route = createFileRoute('/stage')({
  beforeLoad: () => requireAuth(),
  component: StagePage,
});

function StagePage() {
  return <StageComponent images={[bearPng, crocodilePng]} />;
}
