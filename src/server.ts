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

    if (
      process.env.UNDER_CONSTRUCTION === 'true' &&
      url.pathname !== '/under-construction'
    ) {
      return Response.redirect(new URL('/under-construction', request.url), 302);
    }

    const response = await startHandler(request);
    const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (secret) {
      const headers = new Headers(response.headers);
      headers.set('x-vercel-protection-bypass', secret);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
});
