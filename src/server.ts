import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';
import { auth } from '@/lib/auth';

const startHandler = createStartHandler(defaultStreamHandler);

export default createServerEntry({
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/auth')) {
      return auth.handler(request);
    }
    return startHandler(request);
  },
});
