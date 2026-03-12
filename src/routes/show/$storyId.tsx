import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/show/$storyId')({
  component: ShowPage,
})

function ShowPage() {
  return null
}
