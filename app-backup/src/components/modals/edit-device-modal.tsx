
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Device } from "@/lib/types";

type EditDeviceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device;
  onDeviceUpdate: (device: Device) => void;
};

export function EditDeviceModal({ open, onOpenChange, device, onDeviceUpdate }: EditDeviceModalProps) {
  const { toast } = useToast();
  const [alias, setAlias] = useState(device.alias || "");

  useEffect(() => {
    if (open) {
      setAlias(device.alias || "");
    }
  }, [open, device]);
  
  const handleSave = () => {
    if (!alias) {
       toast({
        title: "Alias cannot be empty",
        description: "Please provide an alias for the device.",
        variant: "destructive"
      });
      return;
    }
    onDeviceUpdate({ ...device, alias });
    onOpenChange(false);
    toast({
      title: "Device updated",
      description: `The device name has been updated to "${alias}".`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Device</DialogTitle>
          <DialogDescription>
            Give your device a new name to easily identify it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
           <div>
            <Label>Original Name</Label>
            <p className="text-sm text-muted-foreground">{device.name}</p>
          </div>
          <div>
            <Label htmlFor="device-alias">Device Alias</Label>
            <Input 
              id="device-alias" 
              type="text" 
              value={alias} 
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g., My Work Computer" 
              className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
