import { createFileRoute } from '@tanstack/react-router'
import { StageComponent } from '@/components/stage.component'
import bearPng from '@/assets/bear.png'
import crocodilePng from '@/assets/crocodile.png'

export const Route = createFileRoute('/_app/stage/')({
  component: StagePage,
})

function StagePage() {
  return (
    <StageComponent
      casts={[
        { userId: 'bear', path: bearPng },
        { userId: 'crocodile', path: crocodilePng },
      ]}
    />
  )
}
