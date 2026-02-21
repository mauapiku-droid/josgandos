import { useState } from "react";
import { Sparkles, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Placeholder response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Fitur AI Assistant akan segera tersedia. Kamu bisa menanyakan analisis teknikal, fundamental, atau apapun tentang saham Indonesia.",
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">AI Saham Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Tanya analisis teknikal, fundamental, atau apapun tentang saham Indonesia
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed rounded-lg p-2.5 ${
              msg.role === "user"
                ? "bg-primary/10 text-foreground ml-4"
                : "bg-secondary text-secondary-foreground mr-4"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="bg-secondary text-secondary-foreground text-xs rounded-lg p-2.5 mr-4 animate-pulse">
            Memproses...
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Tanya tentang saham..."
            className="flex-1 bg-secondary text-foreground text-xs px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
