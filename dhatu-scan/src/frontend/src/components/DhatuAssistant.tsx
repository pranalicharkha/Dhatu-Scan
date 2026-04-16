import React, { useState } from 'react';
import { MessageCircle, Bot, X, Send } from 'lucide-react';
import { chatWithAssistant } from '../lib/backendApi';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const SuggestionChips: React.FC<{ onSelect: (message: string) => void }> = ({ onSelect }) => {
  const suggestions = [
    "How do I use this website?",
    "I uploaded a file but I don't understand the result",
    "What should I do next?",
    "My upload is failing"
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm shadow-sm hover:bg-gray-50 transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
      message.sender === 'user'
        ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg'
        : 'bg-gray-100 text-gray-800 ring-1 ring-gray-200'
    }`}>
      {message.text}
    </div>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="flex justify-start mb-4">
    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl text-sm">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <span className="ml-2">Dhatu Assistant is typing...</span>
      </div>
    </div>
  </div>
);

const DhatuAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'I can help you navigate Dhatu Scan, explain scan results, and troubleshoot common issues.', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (textToSend && !isLoading) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: textToSend,
        sender: 'user'
      };
      setMessages([...messages, newMessage]);
      setInput('');
      setIsLoading(true);
      setShowSuggestions(false);

      try {
        const response = await chatWithAssistant(textToSend);
        const botResponse: Message = {
          id: messages.length + 2,
          text: response,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (error) {
        const errorResponse: Message = {
          id: messages.length + 2,
          text: 'Sorry, I\'m having trouble connecting. Please try again later.',
          sender: 'bot'
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-purple-500 text-white shadow-lg hover:from-teal-600 hover:to-purple-600 transition-all duration-300 animate-pulse"
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 h-[32rem] bg-slate-50 rounded-2xl shadow-lg border border-gray-200 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-500 to-purple-500 text-white rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Dhatu Assistant</h3>
                <p className="text-sm opacity-90">Simple help for scans, results, and next steps</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {showSuggestions && (
              <SuggestionChips onSelect={handleSuggestionClick} />
            )}
            {isLoading && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-full bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ask about login, upload, results, or what to do next..."
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full hover:from-teal-600 hover:to-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                Ask Dhatu Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DhatuAssistant;