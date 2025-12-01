import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Video, ExternalLink, Plus, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { config } from '../config';
import MessageContent from '../components/MessageContent';

const ChatInterface = () => {
  const navigate = useNavigate();
  
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Get active chat's messages
  const activeChat = chatSessions.find(chat => chat.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const loadChatSessions = async () => {
    try {
      let persistentUserId = localStorage.getItem('nrityaai_user_id');
      if (!persistentUserId) {
        persistentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('nrityaai_user_id', persistentUserId);
      }
      
      const response = await fetch(config.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: persistentUserId,
          action: 'getChats'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedChats = data.chats || [];
        
        if (loadedChats.length === 0) {
          // Create initial chat if none exist
          const initialChat = {
            id: 1,
            title: 'Welcome Chat',
            messages: [{
              id: 1,
              type: 'ai',
              content: 'Namaste! Welcome to NrityaAI. I specialize in:\n\n**Classical Dance:**\n• Bharatanatyam • Kathak • Odissi • Kuchipudi • Manipuri • Mohiniyattam\n\n**Folk & Popular:**\n• Bhangra • Garba/Dandiya • Bollywood\n\nWhat would you like to learn today?',
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }]
          };
          setChatSessions([initialChat]);
          setActiveChatId(1);
          await saveChatSessions([initialChat]);
        } else {
          setChatSessions(loadedChats);
          setActiveChatId(loadedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      // Fallback to default chat
      const defaultChat = {
        id: 1,
        title: 'Welcome Chat',
        messages: [{
          id: 1,
          type: 'ai',
          content: 'Namaste! Welcome to NrityaAI. I specialize in:\n\n**Classical Dance:**\n• Bharatanatyam • Kathak • Odissi • Kuchipudi • Manipuri • Mohiniyattam\n\n**Folk & Popular:**\n• Bhangra • Garba/Dandiya • Bollywood\n\nWhat would you like to learn today?',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]
      };
      setChatSessions([defaultChat]);
      setActiveChatId(1);
    } finally {
      setIsLoadingChats(false);
    }
  };
  
  const saveChatSessions = async (sessions) => {
    try {
      const persistentUserId = localStorage.getItem('nrityaai_user_id');
      await fetch(config.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: persistentUserId,
          action: 'saveChats',
          chats: sessions
        })
      });
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update the active chat session with new message
      const updatedSessions = chatSessions.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      );
      setChatSessions(updatedSessions);
      
      const currentInput = inputValue;
      setInputValue('');
      setIsTyping(true);
      
      try {
        const workerUrl = config.workerUrl;
        
        // Get or create persistent user ID
        let persistentUserId = localStorage.getItem('nrityaai_user_id');
        if (!persistentUserId) {
          persistentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('nrityaai_user_id', persistentUserId);
        }
        
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            userId: persistentUserId // Use persistent user ID
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const aiMessage = {
            id: messages.length + 2,
            type: 'ai',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
          
          setChatSessions(prevSessions => {
            const finalSessions = prevSessions.map(chat => 
              chat.id === activeChatId 
                ? { ...chat, messages: [...chat.messages, aiMessage] }
                : chat
            );
            saveChatSessions(finalSessions);
            return finalSessions;
          });
        } else {
          throw new Error('Failed to get response');
        }
      } catch (error) {
        console.error('Error calling AI:', error);
        
        // Fallback message
        const errorMessage = {
          id: messages.length + 2,
          type: 'ai',
          content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        
        setChatSessions(prevSessions => {
          const errorSessions = prevSessions.map(chat => 
            chat.id === activeChatId 
              ? { ...chat, messages: [...chat.messages, errorMessage] }
              : chat
          );
          saveChatSessions(errorSessions);
          return errorSessions;
        });
      } finally {
        setIsTyping(false);
      }
    }
  };
  
  const handleNewChat = async () => {
    const newChatId = chatSessions.length > 0 ? Math.max(...chatSessions.map(c => c.id)) + 1 : 1;
    const newChat = {
      id: newChatId,
      title: `New Conversation ${newChatId}`,
      messages: [
        {
          id: 1,
          type: 'ai',
          content: 'Namaste! Welcome to NrityaAI. I specialize in:\n\n**Classical Dance:**\n• Bharatanatyam • Kathak • Odissi • Kuchipudi • Manipuri • Mohiniyattam\n\n**Folk & Popular:**\n• Bhangra • Garba/Dandiya • Bollywood\n\nWhat would you like to learn today?',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    const newSessions = [...chatSessions, newChat];
    setChatSessions(newSessions);
    setActiveChatId(newChatId);
    await saveChatSessions(newSessions);
  };

  return (
    <div className="flex h-screen" style={{ background: '#FBF9F4' }}>
      {/* Sidebar with Chat Sessions */}
      <div className="w-80 border-r flex flex-col" style={{
        background: 'linear-gradient(180deg, #8B4049 0%, #6B3339 100%)',
        borderColor: '#5C2E35'
      }}>
        {/* Sidebar Header */}
        <div className="p-6 border-b" style={{ borderColor: '#5C2E35' }}>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
          >
            <Sparkles className="w-8 h-8" style={{ color: '#D4AF37' }} />
            <h1 className="text-2xl font-bold" style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: '#F5E6D3'
            }}>
              NrityaAI
            </h1>
          </button>
          
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full py-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
              color: '#3D1F24',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </Button>
        </div>
        
        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingChats ? (
            <div className="text-center py-8" style={{ color: '#F5E6D3', opacity: 0.6 }}>
              Loading chats...
            </div>
          ) : chatSessions.map((chat) => (
            <motion.button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className="w-full text-left px-4 py-4 rounded-xl transition-all duration-200"
              style={{
                background: activeChatId === chat.id 
                  ? 'rgba(212, 175, 55, 0.2)' 
                  : 'rgba(245, 230, 211, 0.05)',
                border: activeChatId === chat.id 
                  ? '2px solid #D4AF37' 
                  : '2px solid transparent',
                color: '#F5E6D3'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" style={{ 
                  color: activeChatId === chat.id ? '#D4AF37' : '#F5E6D3',
                  opacity: activeChatId === chat.id ? 1 : 0.6
                }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{
                    color: activeChatId === chat.id ? '#D4AF37' : '#F5E6D3'
                  }}>
                    {chat.title}
                  </p>
                  <p className="text-xs truncate mt-1" style={{
                    color: '#F5E6D3',
                    opacity: 0.6
                  }}>
                    {chat.messages.length} messages
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b px-8 py-4 flex items-center justify-between" style={{
          background: 'linear-gradient(135deg, #8B4049 0%, #6B3339 100%)',
          borderColor: '#5C2E35'
        }}>
          <h2 className="text-xl font-semibold" style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: '#F5E6D3'
          }}>
            {activeChat?.title}
          </h2>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-2xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {message.type === 'ai' ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                          background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                        }}>
                          <Sparkles className="w-5 h-5" style={{ color: '#3D1F24' }} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                          background: 'linear-gradient(135deg, #8B4049 0%, #6B3339 100%)'
                        }}>
                          <span className="text-sm font-medium" style={{ color: '#F5E6D3' }}>You</span>
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex flex-col gap-2">
                      <div
                        className="px-5 py-3 rounded-2xl"
                        style={{
                          background: message.type === 'ai' ? '#FFFFFF' : 'linear-gradient(135deg, #8B4049 0%, #6B3339 100%)',
                          color: message.type === 'ai' ? '#3D1F24' : '#F5E6D3',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <MessageContent content={message.content} isAI={message.type === 'ai'} />
                      </div>
                      
                      {/* Resources */}
                      {message.resources && (
                        <div className="space-y-2 mt-2">
                          {message.resources.map((resource, idx) => (
                            <motion.a
                              key={idx}
                              href={resource.url}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1"
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E5D4C1',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{
                                background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                              }}>
                                {resource.type === 'video' ? (
                                  <Video className="w-5 h-5" style={{ color: '#3D1F24' }} />
                                ) : (
                                  <ExternalLink className="w-5 h-5" style={{ color: '#3D1F24' }} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium" style={{ color: '#3D1F24' }}>{resource.title}</p>
                                <p className="text-xs" style={{ color: '#8B4049', opacity: 0.7 }}>
                                  {resource.type === 'video' ? 'Video' : 'Website'}
                                </p>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <span className="text-xs px-2" style={{ color: '#8B4049', opacity: 0.6 }}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                  }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#3D1F24' }} />
                  </div>
                  <div className="px-5 py-3 rounded-2xl" style={{
                    background: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#D4AF37' }}
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#D4AF37' }}
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#D4AF37' }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t px-8 py-6" style={{ borderColor: '#E5D4C1' }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about Indian dance..."
                className="flex-1 px-5 py-6 text-base rounded-full border-2 transition-all duration-200"
                style={{
                  borderColor: '#E5D4C1',
                  background: '#FFFFFF',
                  color: '#3D1F24'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D4AF37';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5D4C1';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <Button
                onClick={handleSend}
                className="px-6 rounded-full transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                  color: '#3D1F24',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;