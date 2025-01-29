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
import { Checkbox } from "~/components/ui/checkbox";
import { useState, useEffect } from "react";
import type { Citation } from "~/types/rag";

interface SuggestionDialogProps {
  suggestion: string;
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  onUse: (text: string, selectedCitations: Citation[]) => void;
}

export function SuggestionDialog({ suggestion, citations, isOpen, onClose, onUse }: SuggestionDialogProps) {
  const [selectedCitations, setSelectedCitations] = useState<Set<string>>(new Set());

  // Reset selections when dialog opens with new suggestion
  useEffect(() => {
    if (isOpen) {
      setSelectedCitations(new Set());
    }
  }, [isOpen]);

  const handleUse = () => {
    const selected = citations.filter(citation => 
      selectedCitations.has(`${citation.content_type}:${citation.content_id}`)
    );

    let finalText = suggestion;
    if (selected.length > 0) {
      finalText += "\n\nHelpful Resources:\n" + selected.map(citation => 
        `- ${citation.title}: ${citation.url}`
      ).join("\n");
    }

    onUse(finalText, selected);
  };

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
              {citations.map((citation) => {
                const id = `${citation.content_type}:${citation.content_id}`;
                return (
                  <div key={id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={id}
                        checked={selectedCitations.has(id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedCitations);
                          if (checked) {
                            newSelected.add(id);
                          } else {
                            newSelected.delete(id);
                          }
                          setSelectedCitations(newSelected);
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {citation.content_type}:{citation.content_id}
                          </Badge>
                        </div>
                        <a 
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          {citation.title}
                        </a>
                        <p className="text-muted-foreground mt-1">{citation.excerpt}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUse}>
            Use Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 