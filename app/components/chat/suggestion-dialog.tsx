import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";

interface Citation {
  content_type: string;
  content_id: string;
  excerpt: string;
}

interface SuggestionDialogProps {
  suggestion: string;
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  onUse: (text: string) => void;
}

export function SuggestionDialog({ suggestion, citations, isOpen, onClose, onUse }: SuggestionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Suggested Response</DialogTitle>
          <DialogDescription>
            Based on your knowledge base, here's a suggested response. You can use it as is or modify it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Suggestion Text */}
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <p className="text-sm">{suggestion}</p>
          </ScrollArea>

          {/* Citations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sources</h4>
            <div className="space-y-2">
              {citations.map((citation, index) => (
                <div key={index} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {citation.content_type}:{citation.content_id}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{citation.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onUse(suggestion)}>
            Use Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 