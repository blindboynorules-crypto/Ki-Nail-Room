import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { getAiConsultation, isAiAvailable } from '../services/geminiService';

const AiConsultant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Chào nàng! Mình là trợ lý của Ki Nail Room đây. Nàng đang tìm mẫu nail xinh xắn style Hàn hay Nhật cho dịp nào nè? 💅🌸',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getAiConsultation(messages, userMsg.text);
      
      const aiMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      // Fallback handled in service
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageText = (text: string) => {
    // Basic Markdown Link Parser for [Title](Url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a 
          key={match.index} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 font-bold underline hover:text-blue-800 break-words"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (parts.length === 0) return text;
    return <>{parts}</>;
  };

  if (!isAiAvailable()) {
    return (
      <section id="ai-consult" className="py-20 bg-vanilla-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-6">AI Tư Vấn</h2>
            <p className="text-gray-600">Hệ thống AI đang bảo trì.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="ai-consult" className="py-16 md:py-20 bg-gradient-to-b from-vanilla-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-chestnut-100 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-chestnut-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
            Trợ Lý AI Ki Nail Room
          </h2>
          <p className="text-gray-600">
            Tư vấn mẫu nail xinh chuẩn style Hàn - Nhật.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-chestnut-100 overflow-hidden flex flex-col h-[60vh] md:h-[500px]">
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-vanilla-50/30">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-chestnut-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-base leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-chestnut-600 text-white rounded-tr-none'
                      : 'bg-white border border-vanilla-200 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {renderMessageText(msg.text)}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-vanilla-200 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-chestnut-700" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-full bg-chestnut-500 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-white border border-vanilla-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="h-5 w-5 text-chestnut-400 animate-spin" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi AI: Mẫu nail blush má hồng có hợp đi làm không?"
                // text-base to prevent iOS zoom
                className="flex-1 border border-gray-300 rounded-full px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-chestnut-500 focus:border-transparent text-base bg-gray-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-3.5 rounded-full transition-all duration-200 ${
                  isLoading || !input.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-chestnut-500 text-white hover:bg-chestnut-600 shadow-lg active:scale-95'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Gemini AI hỗ trợ tư vấn phong cách 24/7.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiConsultant;