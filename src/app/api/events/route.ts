import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/server/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "global";
  const userId = searchParams.get("userId") || "anonymous";

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const writer = controller as unknown as WritableStreamDefaultWriter<Uint8Array>;

      addClient(businessId, userId, writer);

      const connectMsg = `event: connected\ndata: ${JSON.stringify({ userId, businessId, timestamp: new Date().toISOString() })}\n\n`;
      writer.write(encoder.encode(connectMsg));

      const heartbeat = setInterval(() => {
        try {
          writer.write(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(businessId, userId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
