import { Form, useSubmit } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Send } from "lucide-react";
import { useRef } from "react";

export function MessageInput() {
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget, { method: "post" });
    formRef.current?.reset();
    inputRef.current?.focus();
  };

  return (
    <div className="border-t p-4">
      <Form ref={formRef} onSubmit={handleSubmit} method="post" className="flex gap-2">
        <Input
          ref={inputRef}
          name="message"
          placeholder="Type your message..."
          className="flex-1"
          required
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </Form>
    </div>
  );
} 