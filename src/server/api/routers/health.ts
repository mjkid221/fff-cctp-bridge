import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

/**
 * Minimal health check router to ensure the tRPC setup has at least one endpoint.
 * This prevents type errors from an empty router.
 */
export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(() => {
    return { status: "ok", timestamp: Date.now() };
  }),
});
