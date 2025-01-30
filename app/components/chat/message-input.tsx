import { forwardRef } from "react";
import { Form, useSubmit } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

interface MessageInputProps {
  className?: string;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
  function MessageInput({ className }, ref) {
    const submit = useSubmit();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const message = formData.get("message") as string;
      
      if (message?.trim()) {
        submit(formData, { method: "post" });
        form.reset();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const form = e.currentTarget.form;
        if (form) {
          const formData = new FormData(form);
          const message = formData.get("message") as string;
          
          if (message?.trim()) {
            submit(formData, { method: "post" });
            form.reset();
          }
        }
      }
    };

    return (
      <Form method="post" className={className} onSubmit={handleSubmit}>
        <div className="flex items-end gap-2 p-4 border-t">
          <Textarea
            ref={ref}
            name="message"
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[80px]"
            onKeyDown={handleKeyDown}
          />
          <Button type="submit">Send</Button>
        </div>
      </Form>
    );
  }
); 