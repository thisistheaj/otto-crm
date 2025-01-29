import { forwardRef } from "react";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

interface MessageInputProps {
  className?: string;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  function MessageInput({ className }, ref) {
    return (
      <Form method="post" className={className}>
        <div className="flex items-end gap-2 p-4 border-t">
          <Textarea
            ref={ref}
            name="message"
            placeholder="Type your message..."
            className="min-h-[80px]"
          />
          <Button type="submit">Send</Button>
        </div>
      </Form>
    );
  }
); 