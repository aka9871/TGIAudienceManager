import React, { createContext, useContext, useState, useEffect } from 'react';
import { assistantAPI } from '../services/api';
import toast from 'react-hot-toast';

const AssistantContext = createContext();

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};

export const AssistantProvider = ({ children }) => {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [loading, setLoading] = useState(false);

  // Load assistants on mount
  useEffect(() => {
    loadAssistants();
  }, []);

  // Load chat history when assistant is selected
  useEffect(() => {
    if (selectedAssistant && !chatHistory[selectedAssistant.id]) {
      loadChatHistory(selectedAssistant.id);
    }
  }, [selectedAssistant]);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const response = await assistantAPI.getAssistants();
      setAssistants(response.data);
    } catch (error) {
      console.error('Error loading assistants:', error);
      toast.error('Erreur lors du chargement des assistants');
    } finally {
      setLoading(false);
    }
  };

  const refreshAssistants = async () => {
    try {
      // Clear current state
      setAssistants([]);
      setSelectedAssistant(null);
      setChatHistory({});
      
      // Reload assistants with new API key
      await loadAssistants();
      
      toast.success('Assistants rechargés avec succès');
    } catch (error) {
      console.error('Error refreshing assistants:', error);
      toast.error('Erreur lors du rechargement des assistants');
    }
  };

  const loadChatHistory = async (assistantId) => {
    try {
      const response = await assistantAPI.getChatHistory(assistantId);
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: response.data
      }));
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't show error toast for chat history loading
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: []
      }));
    }
  };

  const createAssistant = async (assistantData, file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', assistantData.name);
      formData.append('theme', assistantData.theme);
      formData.append('file', file);

      const response = await assistantAPI.createAssistant(formData);
      
      // Reload assistants list
      await loadAssistants();
      
      toast.success(`Assistant "${assistantData.name}" créé avec succès!`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating assistant:', error);
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la création de l\'assistant';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteAssistant = async (assistantId) => {
    try {
      setLoading(true);
      await assistantAPI.deleteAssistant(assistantId);
      
      // Remove from local state
      setAssistants(prev => prev.filter(a => a.id !== assistantId));
      
      // Clear selection if deleted assistant was selected
      if (selectedAssistant?.id === assistantId) {
        setSelectedAssistant(null);
      }
      
      // Clear chat history for this assistant
      setChatHistory(prev => {
        const newHistory = { ...prev };
        delete newHistory[assistantId];
        return newHistory;
      });
      
      toast.success('Assistant supprimé avec succès');
      return { success: true };
    } catch (error) {
      console.error('Error deleting assistant:', error);
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (assistantId, message) => {
    try {
      // Add user message to chat history immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: [...(prev[assistantId] || []), userMessage]
      }));

      // Send message to API
      const response = await assistantAPI.sendMessage(assistantId, message);
      
      // Add assistant response to chat history
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: [...(prev[assistantId] || []).slice(0, -1), userMessage, assistantMessage]
      }));

      return { success: true, response: response.data.response };
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.detail || 'Erreur lors de l\'envoi du message';
      toast.error(errorMessage);
      
      // Remove the user message that was added optimistically
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: (prev[assistantId] || []).slice(0, -1)
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const clearChatHistory = async (assistantId) => {
    try {
      await assistantAPI.clearChatHistory(assistantId);
      setChatHistory(prev => ({
        ...prev,
        [assistantId]: []
      }));
      toast.success('Historique effacé');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Erreur lors de l\'effacement de l\'historique');
    }
  };

  const selectAssistant = (assistant) => {
    setSelectedAssistant(assistant);
    // Load chat history if not already loaded
    if (assistant && !chatHistory[assistant.id]) {
      loadChatHistory(assistant.id);
    }
  };

  const getChatHistory = (assistantId) => {
    return chatHistory[assistantId] || [];
  };

  const value = {
    assistants,
    selectedAssistant,
    loading,
    loadAssistants,
    refreshAssistants,
    createAssistant,
    deleteAssistant,
    sendMessage,
    clearChatHistory,
    selectAssistant,
    getChatHistory,
    loadChatHistory
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};
