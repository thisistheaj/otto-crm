import type { Message, SenderType } from "~/types/chat";
import { cn } from "~/lib/utils";

interface MessageListProps {
  messages: Message[];
  currentSenderType: SenderType;
}

export function MessageList({ messages, currentSenderType }: MessageListProps) {
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
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
} 