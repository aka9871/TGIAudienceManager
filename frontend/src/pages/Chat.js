import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Send as SendIcon, 
  Bot as RobotIcon, 
  User as UserIcon, 
  Trash as TrashIcon,
  ArrowLeft as ArrowLeftIcon,
  MessageCircle as MessageCircleIcon
} from 'lucide-react';
import { useAssistant } from '../contexts/AssistantContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const Chat = () => {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  const { 
    assistants, 
    selectedAssistant, 
    selectAssistant, 
    sendMessage, 
    getChatHistory, 
    clearChatHistory 
  } = useAssistant();
  
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [getChatHistory(selectedAssistant?.id)]);

  // Select assistant based on URL parameter
  useEffect(() => {
    if (assistantId && assistants.length > 0) {
      const assistant = assistants.find(a => a.id === assistantId);
      if (assistant) {
        selectAssistant(assistant);
      }
    } else if (!selectedAssistant && assistants.length > 0) {
      selectAssistant(assistants[0]);
    }
  }, [assistantId, assistants, selectedAssistant, selectAssistant]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedAssistant || sending) {
      return;
    }

    setSending(true);
    const messageText = message.trim();
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(selectedAssistant.id, messageText);
      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const chatHistory = getChatHistory(selectedAssistant?.id);

  const AssistantSidebar = () => (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-ddb-black mb-4">Mes Assistants</h2>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {assistants.map((assistant) => (
            <div
              key={assistant.id}
              onClick={() => {
                selectAssistant(assistant);
                navigate(`/chat/${assistant.id}`);
              }}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedAssistant?.id === assistant.id
                  ? 'bg-ddb-yellow bg-opacity-10 border border-ddb-yellow'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-ddb-yellow bg-opacity-10 rounded-lg">
                  <RobotIcon className="w-5 h-5 text-ddb-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {assistant.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {assistant.theme}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedAssistant && (
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Assistant Actuel</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-ddb-yellow bg-opacity-10 rounded-lg">
                <RobotIcon className="w-6 h-6 text-ddb-yellow" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedAssistant.name}</p>
                <p className="text-sm text-gray-500">{selectedAssistant.theme}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Messages:</span>
                <span>{chatHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Créé:</span>
                <span>
                  {selectedAssistant.created_at ? 
                    formatDistanceToNow(new Date(selectedAssistant.created_at), { addSuffix: true, locale: fr }) :
                    'récemment'
                  }
                </span>
              </div>
            </div>
            
            {chatHistory.length > 0 && (
              <button
                onClick={() => clearChatHistory(selectedAssistant.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Effacer l'historique
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const MessageBubble = ({ message, isUser }) => (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 message-animate`}>
      <div className={`flex items-start gap-3 w-full ${isUser ? 'flex-row-reverse max-w-3xl ml-auto' : 'flex-row max-w-full'}`}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
          isUser ? 'bg-ddb-yellow' : 'bg-gray-200'
        }`}>
          {isUser ? (
            <UserIcon className="w-4 h-4 text-ddb-black" />
          ) : (
            <RobotIcon className="w-4 h-4 text-gray-600" />
          )}
        </div>
        
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-ddb-yellow text-ddb-black rounded-br-md' 
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        } ${isUser ? 'max-w-2xl' : 'flex-1'}`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-gray">
              <ReactMarkdown
                components={{
                  // Gestion des tableaux avec détection automatique
                  p: ({ children, ...props }) => {
                    const content = String(children);
                    // Détecter si c'est un tableau formaté avec des pipes
                    if (content.includes('|') && content.includes('---')) {
                      const lines = content.split('\n').filter(line => line.trim());
                      if (lines.length >= 2 && lines[1].includes('---')) {
                        // C'est un tableau markdown
                        const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
                        const rows = lines.slice(2).map(row => 
                          row.split('|').map(cell => cell.trim()).filter(cell => cell)
                        );
                        
                        return (
                          <div className="overflow-x-auto my-4 bg-white rounded-lg shadow-sm border max-w-full">
                            <table className="min-w-full border-collapse">
                              <thead className="bg-gray-50">
                                <tr>
                                  {headers.map((header, i) => (
                                    <th key={i} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900 text-xs">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    {row.map((cell, j) => (
                                      <td key={j} className="border border-gray-200 px-3 py-2 text-gray-700 text-xs break-words">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }
                    return <p className="mb-2 last:mb-0 text-gray-800 break-words">{children}</p>;
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 bg-white rounded-lg shadow-sm border max-w-full">
                      <table className="min-w-full border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody>{children}</tbody>
                  ),
                  tr: ({ children, ...props }) => (
                    <tr className="even:bg-gray-50 odd:bg-white">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900 text-xs">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-200 px-3 py-2 text-gray-700 text-xs break-words">
                      {children}
                    </td>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 text-sm break-words">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800">{children}</em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 break-words">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-3">
                      {children}
                    </pre>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-200 pb-1">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2 text-gray-900">{children}</h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-ddb-yellow pl-4 my-3 italic text-gray-700">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          <p className={`text-xs mt-2 ${isUser ? 'text-ddb-black opacity-70' : 'text-gray-500'}`}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </div>
    </div>
  );

  if (assistants.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-screen">
        <div className="text-center">
          <div className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6">
            <MessageCircleIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun assistant disponible</h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier assistant pour commencer à discuter.
          </p>
          <button
            onClick={() => navigate('/assistants')}
            className="btn-primary"
          >
            Créer un assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AssistantSidebar />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedAssistant ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-ddb-yellow bg-opacity-10 rounded-lg">
                    <RobotIcon className="w-5 h-5 text-ddb-yellow" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-ddb-black">
                      {selectedAssistant.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                      Assistant d'analyse • {selectedAssistant.theme}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 chat-container"
              style={{ 
                height: 'calc(100vh - 140px)',
                minHeight: '0',
                scrollBehavior: 'smooth'
              }}
            >
              {chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="flex items-center justify-center w-16 h-16 bg-ddb-yellow bg-opacity-10 rounded-full mx-auto mb-4">
                      <RobotIcon className="w-8 h-8 text-ddb-yellow" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Bonjour ! Je suis {selectedAssistant.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Je suis spécialisé dans l'analyse de données {selectedAssistant.theme}. 
                      Posez-moi vos questions sur le document que j'ai analysé !
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <p className="text-sm text-gray-600 mb-2">Exemples de questions :</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• "Quels sont les segments les plus représentés ?"</li>
                        <li>• "Analyse les profils avec un indice supérieur à 120"</li>
                        <li>• "Compare les données entre différents groupes"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {chatHistory.map((msg, index) => (
                    <MessageBubble
                      key={index}
                      message={msg}
                      isUser={msg.role === 'user'}
                    />
                  ))}
                  
                  {sending && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start gap-3 max-w-3xl">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                          <RobotIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                          <div className="loading-dots text-gray-600"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder={`Posez votre question à ${selectedAssistant.name}...`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-ddb-yellow focus:border-transparent resize-none transition-all duration-200"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sélectionnez un assistant
              </h3>
              <p className="text-gray-600">
                Choisissez un assistant dans la liste pour commencer une conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
