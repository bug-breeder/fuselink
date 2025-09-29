
"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HiQrcode, HiClipboardCopy } from "react-icons/hi";
import { useToast } from "@/hooks/use-toast";

type PairDeviceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PairDeviceModal({ open, onOpenChange }: PairDeviceModalProps) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pair a New Device</DialogTitle>
          <DialogDescription>
            Scan the QR code or use the magic link on your other device to pair.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 bg-white rounded-lg">
            <HiQrcode className="h-48 w-48 text-black" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Verify with safety words:</p>
            <p className="text-lg font-bold font-headline tracking-wider">{safetyWords}</p>
          </div>
          <div className="w-full">
            <label htmlFor="magic-link" className="text-sm font-medium">Magic Link</label>
            <div className="flex items-center gap-2 mt-1">
              <Input id="magic-link" readOnly value={magicLink} />
              <Button variant="secondary" size="icon" onClick={handleCopy} aria-label="Copy magic link">
                <HiClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
