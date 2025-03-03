import React, { useState, useEffect } from 'react';
import { Send, Download, BarChart2, MessageSquare, RefreshCw, Sparkles, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocation } from 'react-router-dom';

const ChatbotData = () => {
  const location = useLocation();
  
  const { campos } = location.state || {};
  console.log(campos)
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: "I've analyzed your consolidated data. The total sales for Q1 show a 23% increase compared to last quarter. Would you like to see a detailed breakdown?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);

  const sampleData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 5500 },
    { name: 'Mar', value: 4900 },
    { name: 'Apr', value: 6000 },
    { name: 'May', value: 5600 },
    { name: 'Jun', value: 7000 },
  ];

  const quickReplies = [
    { icon: "📈", text: "Show me the sales trend" },
    { icon: "🔄", text: "Compare with last quarter" },
    { icon: "⭐", text: "Top performing products" }
  ];

  const callWebhook = async () => {
    const url = "https://hook.us2.make.com/bxsxo9npvybsxwa4i27bkripfqpdoi7e"; // Reemplaza con tu webhook
    const payload = {
      query: query,
      campos: campos
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.text(); // Si la respuesta es texto
      //console.error("Listo:", data);
      return data

    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(async () => {
        

        var test = await callWebhook()
        setIsTyping(false);

        setMessages(prevMessages => [...prevMessages, {
          type: 'assistant',
          content: test,
          timestamp: new Date()
        }]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([
        ...messages,
        {
          type: 'user',
          content: inputValue,
          timestamp: new Date()
        }
      ]);
      setQuery(inputValue)
      setInputValue('');
      setIsTyping(true);
    }
  };

  const TypingIndicator = () => (
    <div className="flex space-x-2 p-3 bg-gray-800 rounded-lg max-w-[70%] items-center">
      <Bot className="w-5 h-5 text-blue-400" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between border-b border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin-slow" />
            <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-sm" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-yellow-400">Sync</span>
            <span className="text-blue-400">Harmony</span>
          </span>
        </div>
        <div className="flex space-x-4">
          <button className="p-2 hover:bg-gray-700/50 rounded-lg backdrop-blur-sm transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <button
          className={`flex items-center space-x-2 px-6 py-3 transition-all ${
            activeTab === 'chat' 
              ? 'border-b-2 border-blue-400 bg-blue-400/10' 
              : 'hover:bg-gray-700/30'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-6 py-3 transition-all ${
            activeTab === 'insights' 
              ? 'border-b-2 border-blue-400 bg-blue-400/10' 
              : 'hover:bg-gray-700/30'
          }`}
          onClick={() => setActiveTab('insights')}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Insights</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <Bot className="w-6 h-6 text-blue-400 mr-2 mt-2" />
                )}
                <div
                  className={`max-w-[70%] p-4 rounded-2xl backdrop-blur-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                      : 'bg-gray-800/70 border border-gray-700/50'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        ) : (
          <div className="bg-gray-800/50 p-6 rounded-2xl backdrop-blur-sm border border-gray-700/50">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sampleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={{ fill: '#60A5FA', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Replies and Input Area */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              className="px-4 py-2 bg-gray-700/50 rounded-full text-sm whitespace-nowrap hover:bg-gray-600/50 transition-all backdrop-blur-sm flex items-center space-x-2"
              onClick={() => setInputValue(reply.text)}
            >
              <span>{reply.icon}</span>
              <span>{reply.text}</span>
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your data..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
          />
          <button
            onClick={handleSend}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotData;