import React, { useState } from 'react';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  time: string;
}

interface ChatAndReactionsProps {
  onSendReaction: (reaction: string) => void;
  onSendMessage: (text: string) => void;
  messages: ChatMessage[];
  activeReactions: { id: string; playerId: string; reaction: string }[];
}

export const QUICK_REACTIONS = ['🔥', '🏆', '😱', '👏', '⚡', '💣', 'Carico!', 'Briscola!'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  onSendReaction,
  onSendMessage,
  messages,
  activeReactions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <>
      {/* Reaction Buttons Toolbar */}
      <div
        id="reactions-bar"
        className="fixed bottom-24 right-4 z-40 bg-zinc-900/95 border-2 border-zinc-800 backdrop-blur-md p-2 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw] overflow-x-auto font-sans"
      >
        <span className="text-emerald-400 text-xs px-1 flex items-center gap-1">
          <Smile className="w-4 h-4 text-emerald-400" />
        </span>
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            id={`reaction-btn-${emoji}`}
            onClick={() => onSendReaction(emoji)}
            className="hover:scale-110 active:scale-95 transition px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-black border border-zinc-700 font-mono shadow-sm"
          >
            {emoji}
          </button>
        ))}

        <button
          id="chat-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
          {messages.length > 0 && (
            <span className="bg-zinc-950 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded-full font-black font-mono border border-emerald-400">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Floating Active Reactions */}
      <div id="floating-reactions-container" className="pointer-events-none fixed inset-0 z-50">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-bounce bg-emerald-500 text-zinc-950 px-5 py-2 rounded-full shadow-2xl text-lg font-black border-2 border-emerald-400 uppercase tracking-widest font-mono"
          >
            {r.reaction}
          </div>
        ))}
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div
          id="chat-drawer"
          className="fixed bottom-20 right-4 z-50 w-80 max-w-[90vw] bg-zinc-900 border-2 border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-96 animate-in slide-in-from-bottom-5 duration-200 font-sans"
        >
          <div className="bg-zinc-950 p-3.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">Chat di Gioco</h4>
            </div>
            <button
              id="chat-close-btn"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-zinc-900">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-zinc-500 my-auto py-8 font-mono font-bold uppercase tracking-wider">
                Nessun messaggio ancora. Saluta il tavolo!
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-2xl text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-emerald-400 font-mono">{m.senderName}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{m.time}</span>
                  </div>
                  <p className="text-zinc-200 break-words font-medium">{m.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex gap-2">
            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            />
            <button
              id="chat-send-btn"
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 p-2.5 rounded-xl text-xs font-black cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
