import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './middleware/auth'

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [authMiddleware],
  }
})
