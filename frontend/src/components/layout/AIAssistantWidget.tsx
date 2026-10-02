"use client";

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import { X, Maximize2, Minimize2, RefreshCw, Send, Lock, Sparkles, Bot } from "lucide-react";
import { marked } from "marked";
import TodoAPI, { ChatMessage } from "../../services/api";
import { useSession } from "@/lib/auth-client";

// --- 1. Context Setup ---
interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  draftText: string;
  setDraftText: (v: string) => void;
  clearDraftText: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const clearDraftText = () => setDraftText("");

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, draftText, setDraftText, clearDraftText }}>
      {children}
    </ChatContext.Provider>
  );
};

const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};

// --- 2. Main Widget Logic ---
function WidgetContent() {
  const { isOpen, setIsOpen, draftText, clearDraftText } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLarge, setIsLarge] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: sessionData, isPending } = useSession();
  const token = sessionData?.session?.token;
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !isPending && !!sessionData?.session && !!token;

  const suggestedQuestions = [
    "Rank top candidates for Senior ML Engineer.",
    "Evaluate Candidate #8492 against Python criteria.",
    "Summarize demographic bias audit logs.",
  ];

  useEffect(() => {
    if (draftText && isAuthenticated) {
      setInput(draftText);
      clearDraftText();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [draftText, clearDraftText, isAuthenticated]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, streamingReply]);

  const sendMessage = async (messageText?: string) => {
    if (!isAuthenticated || !token) return;
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading) return;

    const cleanText = messageToSend.replace(/<[^>]*>?/gm, "");
    setMessages((prev) => [...prev, { role: "user", text: cleanText }]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);
    setStreamingReply("");

    try {
      const res = await TodoAPI.streamChat([...messages, { role: "user", text: cleanText }], token);
      if (res.status === 401) throw new Error("Unauthorized: Please log in.");
      if (!res.ok) throw new Error("Server error.");
      if (!res.body) throw new Error("No response.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line.trim());
              if (parsed.chunk) {
                botReply += parsed.chunk;
                setStreamingReply(botReply);
              }
            } catch (e) { }
          }
        }
      }

      setStreamingReply("");
      setMessages((prev) => [...prev, { role: "bot", text: botReply || "⚠️ No response." }]);
      setIsLoading(false);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "bot", text: error.message }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="font-sans antialiased text-[#faf9f5]" data-lenis-prevent>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-8 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#cc785c] text-white shadow-xl transition-all hover:bg-[#a9583e]"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className={clsx(
              "fixed right-4 bottom-24 z-50 flex flex-col overflow-hidden rounded-2xl border border-[#252320] shadow-2xl bg-aura-secondary text-[#faf9f5] md:right-8",
              isLarge ? "h-[80vh] w-[90vw] md:w-[50vw]" : "h-[70vh] w-[90vw] md:w-[390px]"
            )}
            style={{ transition: "width 0.3s, height 0.3s" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#252320] bg-[#1f1e1b] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252320] border border-[#3d3d3a]/30 text-[#cc785c]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold tracking-wide text-white">AuraScreening Assistant</h2>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#a09d96]">
                    <span className={clsx("h-1.5 w-1.5 rounded-full",
                      !isAuthenticated ? "bg-[#c64545]" : (isLoading ? "bg-[#e8a55a] animate-pulse" : "bg-[#5db872]"))} />
                    {!isAuthenticated ? "LOCKED" : (isLoading ? "EVALUATING..." : "In Build Phase")}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <HeaderButton onClick={() => { setMessages([]); setShowWelcome(true); }} icon={<RefreshCw size={16} />} title="Reset Chat" />
                <div className="hidden md:block">
                  <HeaderButton onClick={() => setIsLarge(!isLarge)} icon={isLarge ? <Minimize2 size={16} /> : <Maximize2 size={16} />} title="Resize" />
                </div>
                <HeaderButton onClick={() => setIsOpen(false)} icon={<X size={18} />} isClose title="Close" />
              </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-y-auto p-4 scroll-smooth scrollbar-thin scrollbar-thumb-[#252320] scrollbar-track-transparent">
              {showWelcome && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <div className="mb-4 h-12 w-12 rounded-full bg-[#cc785c]/10 flex items-center justify-center text-[#cc785c]">
                    <Bot size={24} />
                  </div>

                  {!isAuthenticated ? (
                    <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-[#252320] bg-[#1f1e1b] w-full">
                      <Lock size={20} className="text-[#cc785c]" />
                      <h3 className="text-xs font-mono font-medium text-white">Authentication Required</h3>
                      <p className="text-[11px] text-[#a09d96]">Sign in to access AI candidate evaluation reasoning.</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-serif text-white">Autonomous Candidate Copilot</h3>
                      <p className="mb-5 text-xs text-[#a09d96] font-sans">Ask questions about candidate scores and criteria.</p>
                      <div className="flex w-full flex-col gap-2">
                        {suggestedQuestions.map((q, i) => (
                          <button key={i} onClick={() => sendMessage(q)} className="w-full rounded-md border border-[#252320] bg-[#1f1e1b] p-3 text-left font-mono text-xs text-[#a09d96] hover:border-[#cc785c]/40 hover:text-white transition-all">
                            <span className="mr-2 text-[#cc785c]">{">"}</span>{q}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={clsx("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={clsx("max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs font-sans shadow-xs",
                        msg.role === "user" ? "bg-[#cc785c] text-white" : "bg-[#1f1e1b] text-[#faf9f5] border border-[#252320]")}>
                        {msg.role === "user" ? msg.text : <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) as string }} />}
                      </div>
                    </div>
                  ))}
                  {isLoading && streamingReply && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs bg-[#1f1e1b] text-[#faf9f5] border border-[#252320]">
                        <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: marked.parse(streamingReply) as string }} />
                      </div>
                    </div>
                  )}
                  {isLoading && !streamingReply && (
                    <div className="flex justify-start">
                      <div className="flex gap-1.5 bg-[#1f1e1b] px-3.5 py-2.5 rounded-xl border border-[#252320]">
                        {[0, 1, 2].map((i) => <motion.span key={i} animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />)}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#1f1e1b] border-t border-[#252320]">
              <div className={clsx(
                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all",
                !isAuthenticated ? "border-[#252320] bg-aura-secondary opacity-50" : "border-[#3d3d3a]/40 bg-aura-secondary focus-within:border-[#cc785c]"
              )}>
                <input
                  ref={inputRef}
                  disabled={!isAuthenticated}
                  className="flex-1 bg-transparent text-xs text-[#faf9f5] placeholder-[#a09d96] outline-none disabled:cursor-not-allowed font-mono"
                  placeholder={isAuthenticated ? "Query candidate dataset..." : "Auth required..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !isAuthenticated}
                  className={clsx("flex h-7 w-7 items-center justify-center rounded-md transition-all",
                    (!isAuthenticated || isLoading) ? "bg-[#252320] text-[#a09d96]" : "bg-[#cc785c] text-white hover:bg-[#a9583e]")}
                >
                  {!isAuthenticated ? <Lock size={12} /> : <Send size={12} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIAssistantWidget() {
  return <ChatProvider><WidgetContent /></ChatProvider>;
}

const HeaderButton = ({ onClick, icon, title, isClose = false }: any) => (
  <button onClick={onClick} title={title} className={clsx("p-1.5 rounded-md text-[#a09d96] transition-colors", isClose ? "hover:bg-[#c64545]/20 hover:text-[#c64545]" : "hover:bg-[#252320] hover:text-white")}>
    {icon}
  </button>
);