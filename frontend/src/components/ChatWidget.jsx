import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  ShoppingBag, 
  MapPin, 
  Package, 
  AlertCircle 
} from 'lucide-react';
import api from '../services/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const location = useLocation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Automatically detect orderId if on /orders/:orderId
  const orderMatch = location.pathname.match(/^\/orders\/(\d+)$/);
  const currentOrderId = orderMatch ? parseInt(orderMatch[1], 10) : null;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  // Handle rate-limit cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || loading || cooldown > 0) return;

    const userMsg = { sender: 'user', text: trimmed, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setLoading(true);

    try {
      // Build lightweight history payload for Gemini context
      const historyPayload = newHistory.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post('/chat', {
        message: trimmed,
        orderId: currentOrderId,
        history: historyPayload
      });

      const data = res.data;
      const botMsg = {
        sender: 'assistant',
        text: data.reply || 'Namaste! How can I assist you with LocalConnect today?',
        suggestedLink: data.suggestedLink || null,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.rateLimited) {
        setCooldown(45);
      }
    } catch (err) {
      console.error('Chat request failed:', err);
      const errorMsg = {
        sender: 'assistant',
        text: 'Sorry, I am having trouble connecting to the assistant. Please try again in a moment. / Maaf kijiye, abhi sampark nahi ho pa raha hai.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const getLinkDisplay = (url) => {
    if (!url) return null;
    if (url.startsWith('/cart')) return { label: 'Go to Cart & Checkout', icon: ShoppingBag };
    if (url.startsWith('/bazaar-map')) return { label: 'Explore Bazaar Map', icon: MapPin };
    if (url.startsWith('/orders')) return { label: 'View My Orders', icon: Package };
    if (url.startsWith('/community')) return { label: 'Mohalla Community', icon: Sparkles };
    if (url.startsWith('/login')) return { label: 'Log In to Account', icon: ShieldCheck };
    return { label: 'Open Page', icon: ExternalLink };
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[92vw] sm:w-[410px] h-[540px] max-h-[82vh] rounded-3xl overflow-hidden glass-indigo flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200 foil-border-indigo border border-marigold/30">
          {/* Subtle Jali Background */}
          <div className="absolute inset-0 jali-bg opacity-10 pointer-events-none"></div>

          {/* Window Header */}
          <div className="relative z-10 px-5 py-4 border-b border-white/10 bg-indigo/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-clay to-marigold flex items-center justify-center text-warmwhite shadow-warm">
                <Sparkles className="w-5 h-5 fill-warmwhite/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-warmwhite tracking-wide">
                    LocalConnect Saathi
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neem/40 text-emerald-300 font-semibold border border-neem/50">
                    AI Online
                  </span>
                </div>
                <p className="text-[11px] text-warmwhite/70">
                  Multilingual Mohalla Support • हिंदी / Hinglish / English
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-warmwhite/70">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear Conversation"
                  className="p-1.5 rounded-xl hover:bg-white/10 hover:text-warmwhite transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="p-1.5 rounded-xl hover:bg-white/10 hover:text-warmwhite transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Banner: Active Order Tracking */}
          {currentOrderId && (
            <div className="relative z-10 px-4 py-1.5 bg-marigold/15 border-b border-marigold/20 text-marigold text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Order #{currentOrderId} Context Attached
              </span>
              <span className="text-[10px] text-warmwhite/60">Auto-synced</span>
            </div>
          )}

          {/* Messages Container */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs sm:text-sm">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4 text-warmwhite/80">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-marigold shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display text-base text-warmwhite font-bold">
                    Namaste! LocalConnect Saathi
                  </h4>
                  <p className="text-xs text-warmwhite/70 max-w-xs leading-relaxed">
                    Ask me anything about local artisans, delivery OTP security, or your active orders!
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('How does OTP delivery work?');
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-warmwhite/90 transition-all flex items-center justify-between group"
                  >
                    <span>🛡️ How does OTP delivery work?</span>
                    <span className="text-marigold group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputText('mera order kaha hai');
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-warmwhite/90 transition-all flex items-center justify-between group"
                  >
                    <span>📦 Mera order kaha hai?</span>
                    <span className="text-marigold group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputText('Bazaar Map par dukaane kaise dekhe?');
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-warmwhite/90 transition-all flex items-center justify-between group"
                  >
                    <span>📍 Bazaar Map par dukaane kaise dekhe?</span>
                    <span className="text-marigold group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.sender === 'user';
                const linkInfo = m.suggestedLink ? getLinkDisplay(m.suggestedLink) : null;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                        isUser
                          ? 'bg-clay text-warmwhite rounded-tr-xs shadow-warm font-medium'
                          : 'bg-warmwhite text-indigo rounded-tl-xs shadow-md border border-clay/10'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Tappable Suggested Link Button */}
                      {!isUser && linkInfo && (
                        <div className="pt-2">
                          <Link
                            to={m.suggestedLink}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clay/10 hover:bg-clay text-clay hover:text-warmwhite font-bold text-xs transition-all border border-clay/20 shadow-xs"
                          >
                            <linkInfo.icon className="w-3.5 h-3.5" />
                            <span>{linkInfo.label}</span>
                            <span className="text-[10px]">→</span>
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-warmwhite/50 px-1">
                      {isUser ? 'You' : 'Saathi AI'}
                    </span>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-warmwhite text-indigo shadow-md border border-clay/10 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-clay animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-marigold animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-clay animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-xs text-indigo/60 font-medium">Saathi is thinking...</span>
                </div>
              </div>
            )}

            {/* Rate limit warning banner */}
            {cooldown > 0 && (
              <div className="p-2.5 rounded-xl bg-marigold/20 border border-marigold/40 text-marigold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Rate limit active. Please wait {cooldown}s before sending next query.</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="relative z-10 p-3 bg-indigo/90 border-t border-white/10 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="अपना सवाल पूछिए / Ask your question..."
              disabled={loading || cooldown > 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-warmwhite placeholder-warmwhite/50 text-xs sm:text-sm border border-white/15 focus:outline-none focus:ring-2 focus:ring-marigold/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading || cooldown > 0}
              className="p-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite transition-all shadow-warm disabled:opacity-40 disabled:hover:bg-clay cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-clay via-clay to-marigold text-warmwhite font-bold shadow-warm-lg hover:shadow-indigo transition-all duration-300 hover:scale-105 active:scale-95 border border-marigold/30"
        title="LocalConnect Saathi AI"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warmwhite opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-warmwhite"></span>
        </span>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs sm:text-sm tracking-wide">Saathi AI</span>
        </div>
      </button>
    </div>
  );
}
