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
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            mensagem: content,
            imagem: image,
            model,
            sessionId,
            processId,
            clientId,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const err = new Error(errorData.message || errorData.error || "Erro ao processar sua solicitação.");
          err.response = { data: errorData };
          throw err;
        }

        // Add assistant message bubble as empty string first
        addMessage("assistant", "", model);
        setIsWaitingResponse(false); // Já começou a responder, as bolinhas de loading somem.

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let finalResponseData = null;
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split buffer by SSE newline double-delimiters
          const lines = buffer.split("\n");
          // Keep the last partial line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith("data: ")) continue;

            const jsonStr = cleanLine.substring(6);
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.done) {
                finalResponseData = data;
              } else if (data.text) {
                fullText += data.text;
                updateLastMessage(fullText);
              }
            } catch (e) {
              console.warn("Falha ao parsear chunk SSE:", e.message, jsonStr);
            }
          }
        }

        // Parse any remaining buffer
        if (buffer) {
          const cleanLine = buffer.trim();
          if (cleanLine.startsWith("data: ")) {
            const jsonStr = cleanLine.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.done) {
                finalResponseData = data;
              } else if (data.text) {
                fullText += data.text;
                updateLastMessage(fullText);
              }
            } catch {}
          }
        }

        // Finalize state with the final complete response
        if (finalResponseData) {
          const { resposta, ultimasConversas } = finalResponseData;
          updateLastMessage(resposta || fullText);

          // Update User History for Sidebar
          if (ultimasConversas && user) {
            setUser((prev) => ({ ...prev, ultimasConversas }));
          }

          return finalResponseData.sessionId; // Return new sessionId
        } else {
          // Fallback if no done event was parsed properly
          updateLastMessage(fullText);
        }

      } catch (error) {
        // Don't show error if request was cancelled by user
        if (
          error.name === "CanceledError" || 
          error.code === "ERR_CANCELED" || 
          error.name === "AbortError"
        ) {
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
