import { useState, useEffect, useRef } from "react";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { OpenAIService } from "../../services/openai-service";
import { isOpenAIConfigured } from "../../config/api-config";
import { HistoryService } from "../../services/history-service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  messages: Message[];
  title: string;
  createdAt: number;
}

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const generatingTitleIds = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations from local repo storage (with localStorage fallback)
  useEffect(() => {
    let isMounted = true;

    const loadConversations = async () => {
      const stored = await HistoryService.loadChatConversations<Conversation>();
      if (!isMounted || !stored) {
        setHasLoadedHistory(true);
        return;
      }

      setConversations(stored);
      if (stored.length > 0) {
        setCurrentConversationId(stored[0].id);
      }

      setHasLoadedHistory(true);
    };

    loadConversations().catch(() => {
      if (isMounted) {
        setHasLoadedHistory(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save conversations to local repo storage
  useEffect(() => {
    if (!hasLoadedHistory) {
      return;
    }
    HistoryService.saveChatConversations(conversations).catch((error) => {
      console.error("Failed to save chat history:", error);
    });
  }, [conversations, hasLoadedHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations, currentConversationId]);

  // Backfill titles for older conversations using OpenAI.
  useEffect(() => {
    if (!hasLoadedHistory || !isOpenAIConfigured()) {
      return;
    }

    const candidate = conversations.find(
      c =>
        c.messages.length > 0 &&
        (!c.title || c.title === "New Chat") &&
        !generatingTitleIds.current.has(c.id)
    );

    if (!candidate) {
      return;
    }

    generatingTitleIds.current.add(candidate.id);
    const sourceText = candidate.messages
      .filter(m => m.role === "user")
      .slice(0, 3)
      .map(m => m.content)
      .join("\n\n");

    const openaiService = new OpenAIService();
    openaiService
      .generateTitle(sourceText || candidate.messages[0].content, "chat")
      .then((generatedTitle) => {
        if (!generatedTitle) {
          return;
        }
        setConversations(prev =>
          prev.map(c =>
            c.id === candidate.id
              ? { ...c, title: generatedTitle }
              : c
          )
        );
      })
      .catch((error) => {
        console.error("Failed to backfill chat title:", error);
      })
      .finally(() => {
        generatingTitleIds.current.delete(candidate.id);
      });
  }, [conversations, hasLoadedHistory]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      messages: [],
      title: "New Chat",
      createdAt: Date.now(),
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
    toast.success("Conversation deleted");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      toast.error(
        "OpenAI API key not configured. Please add your API key in /src/config/api-config.ts"
      );
      return;
    }

    let convId = currentConversationId;
    let shouldGenerateTitle = false;
    const existingConversation = conversations.find(c => c.id === convId);
    if (!existingConversation || existingConversation.messages.length === 0) {
      shouldGenerateTitle = true;
    }
    
    // Create conversation if none exists
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        messages: [],
        title: input.slice(0, 50),
        createdAt: Date.now(),
      };
      setConversations(prev => [newConv, ...prev]);
      convId = newConv.id;
      setCurrentConversationId(convId);
      shouldGenerateTitle = true;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    // Update conversation title if it's the first message
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              title: c.messages.length === 0 ? input.slice(0, 50) : c.title,
            }
          : c
      )
    );

    setInput("");
    setIsLoading(true);

    try {
      const openaiService = new OpenAIService();
      
      // Get current conversation to include message history
      const conversation = conversations.find(c => c.id === convId);
      const messageHistory = conversation?.messages || [];
      
      // Prepare messages for OpenAI API
      const apiMessages = [
        ...messageHistory.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: userMessage.content,
        },
      ];

      // Call OpenAI API
      const response = await openaiService.createChatCompletion(apiMessages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.choices[0].message.content,
        timestamp: Date.now(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );

      if (shouldGenerateTitle) {
        try {
          const generatedTitle = await openaiService.generateTitle(
            userMessage.content,
            "chat"
          );
          if (generatedTitle) {
            setConversations(prev =>
              prev.map(c =>
                c.id === convId
                  ? { ...c, title: generatedTitle }
                  : c
              )
            );
          }
        } catch (titleError) {
          console.error("Failed to generate chat title:", titleError);
        }
      }
    } catch (error) {
      console.error("OpenAI API Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to get response from OpenAI"
      );
      
      // Add error message to conversation
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: Date.now(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-73px)] flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-4">
        <Button onClick={createNewConversation} className="w-full">
          New Chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {conversations.map(conv => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                  currentConversationId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.messages.length} messages
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Start a new conversation to begin chatting
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
