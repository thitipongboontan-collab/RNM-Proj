"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AssistantReply, assistantReplyBoxClassName } from "./AssistantReply";
import {
  AssistantAttachmentPicker,
  AssistantAttachmentPreview,
  AssistantPendingAttachments,
} from "./AssistantAttachmentPicker";
import type { PendingAttachment } from "@/lib/assistant-attachments";

function parseSseBlock(block: string) {
  const lines = block.split("\n");
  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

type AiAssistantModalProps = {
  open: boolean;
  onClose: () => void;
};

type ChatTurn = {
  id: string;
  question: string;
  reply: string;
  error?: string;
  attachments?: { name: string; previewUrl?: string; kind: "image" | "text" | "document" }[];
};

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M16 2L8 10M16 2L11 16L8 10M16 2L2 7L8 10"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AiAssistantModal({ open, onClose }: AiAssistantModalProps) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTurnId, setStreamingTurnId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ignoreBackdropClickRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetConversation = useCallback(() => {
    setMessage("");
    setAttachments([]);
    setAttachmentError("");
    setTurns([]);
    setStatusMessage("");
    setIsLoading(false);
    setIsStreaming(false);
    setStreamingTurnId(null);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [turns, statusMessage, isStreaming, scrollToBottom]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  useEffect(() => {
    if (!open) return;

    ignoreBackdropClickRef.current = true;
    const unlockBackdrop = window.setTimeout(() => {
      ignoreBackdropClickRef.current = false;
    }, 0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.clearTimeout(unlockBackdrop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, handleClose]);

  function handleBackdropClick() {
    if (ignoreBackdropClickRef.current) return;
    handleClose();
  }

  useEffect(() => {
    if (!open) resetConversation();
  }, [open, resetConversation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = message.trim();
    const hasAttachments = attachments.length > 0;
    if ((!question && !hasAttachments) || isLoading) return;

    const turnAttachments = attachments.map(({ name, previewUrl, kind }) => ({
      name,
      previewUrl,
      kind,
    }));
    const payloadAttachments = attachments.map(({ name, mimeType, kind, data }) => ({
      name,
      mimeType,
      kind,
      data,
    }));

    const turnId = crypto.randomUUID();
    const history = turns.flatMap((turn) => {
      const items: { role: "user" | "assistant"; content: string }[] = [
        { role: "user", content: turn.question },
      ];
      if (turn.reply.trim()) {
        items.push({ role: "assistant", content: turn.reply });
      }
      return items;
    });

    setTurns((previous) => [
      ...previous,
      {
        id: turnId,
        question: question || "(แนบรูป/ไฟล์)",
        reply: "",
        attachments: turnAttachments,
      },
    ]);
    setMessage("");
    setAttachments([]);
    setAttachmentError("");
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingTurnId(turnId);
    setStatusMessage("กำลังเตรียมคำถาม...");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          attachments: payloadAttachments,
          history,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      }

      if (!response.body) {
        throw new Error("ไม่สามารถรับคำตอบแบบ streaming ได้");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const parsed = parseSseBlock(block);
          if (!parsed) continue;

          if (parsed.event === "status" && typeof parsed.data.message === "string") {
            setStatusMessage(parsed.data.message);
          }

          if (parsed.event === "token" && typeof parsed.data.text === "string") {
            streamedReply += parsed.data.text;
            setTurns((previous) =>
              previous.map((turn) =>
                turn.id === turnId ? { ...turn, reply: streamedReply } : turn,
              ),
            );
            setStatusMessage("");
          }

          if (parsed.event === "error" && typeof parsed.data.error === "string") {
            throw new Error(parsed.data.error);
          }
        }
      }

      if (!streamedReply.trim()) {
        throw new Error("AI ไม่ได้ส่งคำตอบกลับมา");
      }
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error
          ? submitError.message
          : "ไม่สามารถส่งคำถามได้ กรุณาลองใหม่";

      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === turnId ? { ...turn, reply: "", error: errorMessage } : turn,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingTurnId(null);
      setStatusMessage("");
    }
  }

  if (!open || !mounted) return null;

  const showGreeting = turns.length === 0 && !isLoading;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[rgba(37,50,75,0.5)] backdrop-blur-[3px]"
        onMouseDown={handleBackdropClick}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
        className="relative z-[10000] flex h-[min(560px,88vh)] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_24px_64px_rgba(37,50,75,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between bg-gradient-to-r from-[#4D5CAD] to-[#00CACC] px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
              <Image
                src="/images/logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                onError={(event) => {
                  event.currentTarget.src = "/images/ai-assistant.svg";
                }}
              />
            </div>
            <div>
              <h2
                id="ai-assistant-title"
                className="font-jakarta text-2xl font-bold leading-tight text-white"
              >
                Research Nexus AI
              </h2>
              <p className="font-sans text-sm font-normal text-white/90">ผู้ช่วยวิจัยอัจฉริยะ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="ปิดหน้าต่าง"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div
            ref={scrollRef}
            className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-6"
          >
            {showGreeting && (
              <div className="flex flex-1 items-center justify-center">
                <p className="max-w-[520px] text-center text-lg font-medium leading-relaxed text-[#778097]">
                  How can Research Nexus AI assist you today?
                </p>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {turns.map((turn) => {
                const isActiveTurn = turn.id === streamingTurnId;
                const isTurnStreaming = isActiveTurn && isStreaming;

                return (
                  <div key={turn.id} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-medium leading-relaxed text-brand-dark">
                        {turn.question}
                      </p>
                      {turn.attachments && turn.attachments.length > 0 && (
                        <AssistantAttachmentPreview attachments={turn.attachments} />
                      )}
                    </div>

                    {isActiveTurn && statusMessage && !turn.reply && !turn.error && (
                      <p className="text-sm text-[#778097]">{statusMessage}</p>
                    )}

                    {turn.error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-base leading-relaxed text-red-700">
                        {turn.error}
                      </div>
                    )}

                    {turn.reply && (
                      <div>
                        {isTurnStreaming ? (
                          <div className={assistantReplyBoxClassName}>
                            <div className="whitespace-pre-wrap leading-relaxed text-[#4A5568]">
                              {turn.reply}
                              <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-brand-primary align-middle" />
                            </div>
                          </div>
                        ) : (
                          <AssistantReply content={turn.reply} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 px-8 pb-8 pt-2">
            <AssistantPendingAttachments
              attachments={attachments}
              onRemove={(id) => setAttachments((current) => current.filter((item) => item.id !== id))}
            />
            {attachmentError && (
              <p className="mb-2 px-1 text-sm text-red-600">{attachmentError}</p>
            )}
            <div className="flex items-center gap-3 rounded-full border border-[#E0E0E0] bg-white px-4 py-2 shadow-[0px_2px_12px_rgba(37,50,75,0.06)]">
              <AssistantAttachmentPicker
                disabled={isLoading}
                attachments={attachments}
                onChange={(items) => {
                  setAttachments(items);
                  setAttachmentError("");
                }}
                onError={setAttachmentError}
              />

              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask anything"
                disabled={isLoading}
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-brand-dark outline-none placeholder:text-[#B0B8C9] disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isLoading || (!message.trim() && attachments.length === 0)}
                aria-label="ส่งคำถาม"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#4D5CAD] to-[#00CACC] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
