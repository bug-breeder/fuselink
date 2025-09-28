
"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PairDeviceModalProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PairDeviceModal({ children, open, onOpenChange }: PairDeviceModalProps) {
  const { toast } = useToast();
  const safetyWords = "Nebula Vortex Quantum Link";
  const magicLink = "https://fuselink.app/pair?token=a1b2c3d4e5f6";

  const handleCopy = () => {
    navigator.clipboard.writeText(magicLink);
    toast({
      title: "Copied to clipboard!",
      description: "You can now share the magic link.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair a New Device</DialogTitle>
          <DialogDescription>
            Scan the QR code or use the magic link on your other device to pair.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 bg-white rounded-lg">
            <QrCode className="h-48 w-48 text-black" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Verify with safety words:</p>
            <p className="text-lg font-bold font-headline tracking-wider">{safetyWords}</p>
          </div>
          <div className="w-full">
            <label htmlFor="magic-link" className="text-sm font-medium">Magic Link</label>
            <div className="flex items-center gap-2 mt-1">
              <input id="magic-link" type="text" readOnly value={magicLink} className="flex-1 bg-secondary border rounded-md h-9 px-3 text-sm" />
              <button onClick={handleCopy} className="p-2 rounded-md hover:bg-secondary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
