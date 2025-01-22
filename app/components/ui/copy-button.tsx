import * as React from "react";
import { Button } from "~/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {label && <span className="mr-2">{label}</span>}
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
} 