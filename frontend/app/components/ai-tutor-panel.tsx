"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faPaperPlane,
  faRobot,
  faShieldHalved,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { fetchAiSession, sendTutorMessage, type AiSessionMessage } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Card } from "./ui";

type ChatMessage = { role: "student" | "tutor"; content: string; refused: boolean };

const STARTERS = [
  "Where should I start with this evidence?",
  "How do I know which risk is most important?",
  "Can you check my reasoning so far?",
];

/**
 * Formative, assessment-safe AI tutor. Loads any prior session for the attempt,
 * streams Socratic replies, and never writes the student's submission. Using it
 * records an AI support event server-side; `onSupportUsed` lets the workspace
 * resync its support signal + timeline.
 */
export function AiTutorPanel({
  attemptId,
  onSupportUsed,
  disabled = false,
}: {
  attemptId: number;
  onSupportUsed?: () => void;
  disabled?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchAiSession(attemptId, token)
      .then((res) => {
        if (res.messages.length) {
          setMessages(
            res.messages.map((m: AiSessionMessage) => ({
              role: m.role,
              content: m.content,
              refused: m.refused,
            })),
          );
        }
      })
      .catch(() => {
        /* no prior session — start fresh */
      });
  }, [attemptId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const token = getToken();
    if (!token) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "student", content, refused: false }]);
    setSending(true);
    try {
      const res = await sendTutorMessage(attemptId, content, token);
      setMessages((prev) => [
        ...prev,
        { role: "tutor", content: res.reply, refused: res.refused },
      ]);
      onSupportUsed?.();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          content: "I couldn't respond just now. Please try again in a moment.",
          refused: false,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
          <FontAwesomeIcon icon={faRobot} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">AI Tutor</p>
          <p className="text-xs text-muted">Formative help — it guides, it won&apos;t answer for you.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 sm:inline-flex">
          <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
          Assessment mode
        </span>
      </div>

      <div ref={scrollRef} className="max-h-[320px] min-h-[180px] flex-1 space-y-3 overflow-y-auto cipher-scroll px-5 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Stuck? Ask the tutor to help you reason through the evidence. It responds with
              questions and hints, never the final answer.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  disabled={disabled}
                  onClick={() => void send(starter)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-body transition hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, i) => {
            if (message.role === "student") {
              return (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">
                    {message.content}
                  </p>
                </div>
              );
            }
            return (
              <div key={i} className="flex gap-2.5">
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                    message.refused ? "bg-amber-100 text-amber-600" : "bg-primary-light text-primary"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={message.refused ? faTriangleExclamation : faRobot}
                    className="text-xs"
                    aria-hidden="true"
                  />
                </span>
                <p
                  className={`max-w-[80%] rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm ${
                    message.refused
                      ? "bg-amber-50 text-amber-900"
                      : "bg-slate-100 text-body"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            );
          })
        )}
        {sending && (
          <div className="flex gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
              <FontAwesomeIcon icon={faRobot} className="text-xs" aria-hidden="true" />
            </span>
            <p className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-sm text-muted">
              Thinking…
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-3">
        {disabled ? (
          <p className="flex items-center gap-2 px-1 py-1.5 text-xs text-muted">
            <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
            This attempt has been submitted — the tutor is read-only now.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the tutor a question…"
              className="h-11 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}
