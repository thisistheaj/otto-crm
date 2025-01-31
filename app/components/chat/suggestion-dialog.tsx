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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState, useEffect } from "react";
import type { Citation } from "~/types/rag";

// Helper function to strip HTML tags
function stripHtml(html: string) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Helper function to find all document titles mentioned in text
function findMentionedTitles(text: string): string[] {
  const matches = text.match(/\[(.*?)\]/g) || [];
  return matches.map(match => match.slice(1, -1));
}

interface SuggestionDialogProps {
  suggestion: string;
  citations: Citation[];
  isOpen: boolean;
  onClose: () => void;
  onUse: (text: string, selectedCitations: Citation[], proposedStatus: false | "pending") => void;
  proposedStatus: false | "pending";
}

export function SuggestionDialog({ 
  suggestion, 
  citations, 
  isOpen, 
  onClose, 
  onUse,
  proposedStatus 
}: SuggestionDialogProps) {
  const [selectedCitations, setSelectedCitations] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string>(proposedStatus || "no_action");

  // Reset selections and auto-select mentioned citations when dialog opens
  useEffect(() => {
    if (isOpen) {
      const mentionedTitles = findMentionedTitles(suggestion);
      console.log('Mentioned titles:', mentionedTitles);
      
      const newSelected = new Set<string>();
      citations.forEach(citation => {
        if (mentionedTitles.includes(citation.title)) {
          newSelected.add(`${citation.content_type}:${citation.content_id}`);
        }
      });
      
      console.log('Auto-selected citations:', newSelected);
      setSelectedCitations(newSelected);
      setSelectedStatus(proposedStatus || "no_action");
    }
  }, [isOpen, proposedStatus, suggestion, citations]);

  const handleUse = () => {
    const selected = citations.filter(citation => 
      selectedCitations.has(`${citation.content_type}:${citation.content_id}`)
    );

    let finalText = suggestion;
    if (selected.length > 0) {
      finalText += "\n\nHelpful Resources:\n" + selected.map(citation => 
        `[${citation.title}](${window.location.origin}${citation.url})`
      ).join("\n");
    }

    onUse(finalText, selected, selectedStatus === "pending" ? "pending" : false);
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
              {citations.map(citation => {
                const id = `${citation.content_type}:${citation.content_id}`;
                const cleanExcerpt = stripHtml(citation.excerpt);
                
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
                        <a 
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 group"
                        >
                          <Badge 
                            variant="outline" 
                            className="group-hover:border-primary"
                          >
                            {citation.content_type}
                          </Badge>
                          <span className="text-primary hover:underline font-medium">
                            {citation.title}
                          </span>
                        </a>
                        <p className="text-muted-foreground mt-1">{cleanExcerpt}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Proposal */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Update ticket?</h4>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_action">No Action</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
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