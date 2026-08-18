export interface Env {
  ASSETS: Fetcher;
  BACKEND_ORIGIN: string;
}

const isApiRequest = (pathname: string) => pathname === "/api" || pathname.startsWith("/api/");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isApiRequest(url.pathname)) {
      if (!env.BACKEND_ORIGIN) {
        return Response.json({ error: "Slicer backend is not configured." }, { status: 503 });
      }

      const backend = new URL(env.BACKEND_ORIGIN);
      backend.pathname = url.pathname;
      backend.search = url.search;

      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.delete("origin");

      try {
        const response = await fetch(new Request(backend.toString(), {
          method: request.method,
          headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
          redirect: "manual",
        }));

        const output = new Response(response.body, response);
        output.headers.set("Cache-Control", "no-store");
        return output;
      } catch {
        return Response.json({ error: "Slicer backend is unavailable." }, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
