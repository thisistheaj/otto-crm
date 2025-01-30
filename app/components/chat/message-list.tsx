import type { Message, SenderType } from "~/types/chat";
import { cn } from "~/lib/utils";
import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentSenderType: SenderType;
}

// Regex to match markdown links: [title](url)
const LINK_REGEX = /^\[(.*?)\]\((.*?)\)$/;

export function MessageList({ messages, currentSenderType }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessageContent = (content: string) => {
    const match = content.match(LINK_REGEX);
    if (match) {
      const [_, title, url] = match;
      return (
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-inherit hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {title}
        </a>
      );
    }
    return <p className="text-sm">{content}</p>;
  };

  return (
    <div className="h-[500px] overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isCurrentSender = message.sender_type === currentSenderType;
        const isSystem = message.sender_type === 'system';

        return (
          <div
            key={message.id}
            className={cn(
              "flex",
              isSystem ? "justify-center" : isCurrentSender ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%]",
                isSystem ? "bg-accent text-accent-foreground text-center" : 
                isCurrentSender ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {isSystem && (
                <p className="text-sm font-medium mb-1">Initial Request</p>
              )}
              {renderMessageContent(message.content)}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 