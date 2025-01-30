# Ticket Response Suggestions Feature

## Overview
Add a "Get Suggestion" feature to the ticket chat interface that uses our RAG system to generate contextually relevant response suggestions for agents.

## Implementation Plan

### 1. Backend Changes
- [ ] Create new route action in `@workspace.$id.tickets.$ticketId.chat.tsx`
  - More appropriate than new API endpoint since:
    - Already has access to workspace/ticket context
    - Can reuse existing auth checks
    - Keeps related code together
    - Simpler than adding new API route

### 2. UI Components
- [ ] Add suggestion button above message input
  ```tsx
  <Button 
    variant="outline"
    className="mb-2"
    onClick={() => getSuggestion()}
  >
    Get Suggestion
  </Button>
  ```
- [ ] Create SuggestionDialog component
  ```tsx
  // components/chat/suggestion-dialog.tsx
  interface SuggestionDialogProps {
    suggestion: string;
    citations: Citation[];
    isOpen: boolean;
    onClose: () => void;
    onUse: (text: string) => void;
  }
  ```
- [ ] Add loading state to button
- [ ] Add error handling UI

### 3. State Management
- [ ] Add suggestion state to chat page
  ```tsx
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  ```

### 4. Action Implementation
```tsx
// In @workspace.$id.tickets.$ticketId.chat.tsx
export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "get-suggestion") {
    // Get messages from database
    const messages = await getTicketMessages(params.ticketId);
    
    // Format for RAG
    const formattedMessages = messages.map(m => ({
      role: m.sender_type === "agent" ? "assistant" : "user",
      content: m.content
    }));

    // Get suggestion using RAG
    const suggestion = await getRagSuggestion(formattedMessages);
    
    return json(suggestion);
  }
}
```

### 5. Integration
- [ ] Add fetch function
  ```tsx
  async function getSuggestion() {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("intent", "get-suggestion");
    
    try {
      const response = await submit(formData, {
        method: "post"
      });
      setSuggestion(response.content);
      setCitations(response.citations);
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }
  ```
- [ ] Wire up suggestion dialog to message input
  ```tsx
  function useSuggestion(text: string) {
    // Set text in message input
    setInputValue(text);
    // Close dialog
    setSuggestion(null);
  }
  ```

### 6. Testing
- [ ] Test with various conversation lengths
- [ ] Test with different types of tickets
- [ ] Test error scenarios
- [ ] Test suggestion usage flow

## Success Criteria
1. Agent can request suggestions with one click
2. Suggestions are contextually relevant to conversation
3. Citations are provided for verification
4. Agent can easily use or modify suggestions
5. Feature works within existing auth/security model
6. Performance is acceptable (< 2s for suggestion)

## Notes
- Using route action instead of API endpoint simplifies implementation
- Reuses existing auth/security model
- Keeps related code together
- Minimal new components needed
- No changes to database required 


# TODO:
- [x] fix document rendering
- [x] fix coloration of articles
- [ ] handle links in messages
- [ ] better links in suggestions
- [ ] create ticket from knowledge base
