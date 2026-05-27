import { buildAssistantSystemPrompt } from "@/lib/assistant-prompt";
import { intentStatusMessage, runAssistantPipeline } from "@/lib/ai/pipeline";

type AssistantRequest = {
  message?: string;
};

function sendEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: Record<string, unknown>,
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: AssistantRequest;
  try {
    body = (await request.json()) as AssistantRequest;
  } catch {
    return new Response(JSON.stringify({ error: "รูปแบบคำขอไม่ถูกต้อง" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = body.message?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "กรุณาพิมพ์คำถาม" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (message.length > 2000) {
    return new Response(JSON.stringify({ error: "คำถามยาวเกินไป" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sendEvent(controller, encoder, "status", {
          message: "กำลังวิเคราะห์คำถาม...",
        });

        const pipeline = await runAssistantPipeline(message, apiKey);

        sendEvent(controller, encoder, "status", {
          message: intentStatusMessage(pipeline.intent),
        });

        const systemPrompt = buildAssistantSystemPrompt(pipeline.platformContext);

        sendEvent(controller, encoder, "citations", {
          items: pipeline.citations,
          intent: pipeline.intent,
          tools: pipeline.toolsUsed,
        });

        sendEvent(controller, encoder, "status", {
          message: "กำลังวิเคราะห์และสรุปคำตอบ...",
        });

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.5,
            max_tokens: 1200,
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
          }),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("OpenAI API error:", response.status, errorText);
          sendEvent(controller, encoder, "error", {
            error: "ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
          });
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let hasContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload) as {
                choices?: { delta?: { content?: string | null } }[];
              };
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                hasContent = true;
                sendEvent(controller, encoder, "token", { text });
              }
            } catch {
              // Ignore malformed chunks from upstream stream.
            }
          }
        }

        if (!hasContent) {
          sendEvent(controller, encoder, "error", {
            error: "AI ไม่ได้ส่งคำตอบกลับมา",
          });
        } else {
          sendEvent(controller, encoder, "done", {});
        }
      } catch (error) {
        console.error("Assistant stream error:", error);
        sendEvent(controller, encoder, "error", {
          error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
