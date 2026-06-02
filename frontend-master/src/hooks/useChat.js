import { useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const abortControllerRef = useRef(null);
  const { user, setUser } = useAuth(); // for auth context if needed

  const addMessage = useCallback((role, content, mode = null) => {
    setMessages((prev) => [...prev, { role, content, mode }]);
  }, []);

  const updateLastMessage = useCallback((content) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1].content = content;
      }
      return newMessages;
    });
  }, []);

  const sendMessage = useCallback(
    async (
      content,
      image = null,
      model = "company",
      sessionId = null,
      processId = null,
      clientId = null,
    ) => {
      if (!content.trim() && !image) return;

      // Add user message
      // Create a local representation for instant UI update
      const userMessageContent = image
        ? [
            { type: "text", text: content },
            { type: "image_url", image_url: { url: image } },
          ]
        : content;

      addMessage("user", userMessageContent, model); // Also tag user message
      setIsLoading(true);
      setIsWaitingResponse(true);

      abortControllerRef.current = new AbortController();

      try {
        const response = await axios.post(
          "/api/chat",
          {
            mensagem: content,
            imagem: image,
            model,
            sessionId,
            processId,
            clientId,
          },
          {
            signal: abortControllerRef.current.signal,
          },
        );

        const { resposta, ultimasConversas } = response.data;
        // Movemos isWaitingResponse=false para o MOMENTO em que a primeira letra da IA for mostrada na tela.

        // Update User History for Sidebar
        if (ultimasConversas && user) {
          setUser((prev) => ({ ...prev, ultimasConversas }));
        }

        if (resposta) {
          // Simulate streaming (Typewriter effect)
          addMessage("assistant", "", model); // Pass model/mode here
          setIsWaitingResponse(false); // Já criou a bolha da IA, ela já começou a "digitar", as bolinhas somem.

          let i = 0;
          const speed = 15; // ms per char

          // Use a promise to keep the function running until "streaming" ends
          await new Promise((resolve) => {
            const interval = setInterval(() => {
              if (i >= resposta.length) {
                clearInterval(interval);
                resolve();
                return;
              }
              // Add a chunk of characters to speed up long responses
              const chunk = resposta.slice(0, i + 3);
              updateLastMessage(chunk);
              i += 3;
            }, speed);
          });

          // Ensure full text is set at the end
          updateLastMessage(resposta);
        } else {
          setIsWaitingResponse(false); // Desliga se por acaso vier vazio
        }

        return response.data.sessionId; // Return new sessionId
      } catch (error) {
        // Don't show error if request was cancelled by user
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          console.log("Requisição cancelada pelo usuário");
        } else if (error.response?.data?.message) {
          // Capturar mensagem amigável do backend (ex: limite de uso)
          addMessage("system", error.response.data.message);
        } else {
          console.error("Erro no chat:", error);
          addMessage(
            "system",
            "Erro ao processar sua solicitação. Verifique sua conexão ou limite de plano.",
          );
        }
      } finally {
        setIsLoading(false);
        setIsWaitingResponse(false);
        abortControllerRef.current = null;
      }
    },
    [addMessage, updateLastMessage, user, setUser],
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsWaitingResponse(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    // Optionally call API to clear history
  }, []);

  const loadConversation = useCallback(async (sessionId) => {
    setIsLoading(true);
    // NÃO SETAR isWaitingResponse AQUI. isWaitingRespons é apenas para quando o robô pensa a resposta de uma nova pergunta.
    setMessages([]);
    try {
      const res = await axios.get(`/api/chat/${sessionId}`);
      const conversation = res.data;

      let loadedMessages = [];
      if (typeof conversation.mensagens === "string") {
        loadedMessages = JSON.parse(conversation.mensagens);
      } else {
        loadedMessages = conversation.mensagens || [];
      }

      setMessages(loadedMessages);
    } catch (error) {
      console.error("Erro ao carregar conversa:", error);
    } finally {
      setIsLoading(false);
      setIsWaitingResponse(false);
    }
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    isWaitingResponse,
    stopGeneration,
    clearHistory,
    loadConversation,
    setMessages,
    addMessage,
  };
};
