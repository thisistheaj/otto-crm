import { Form } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Send } from "lucide-react";

export function MessageInput() {
  return (
    <div className="border-t p-4">
      <Form method="post" className="flex gap-2">
        <Input
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