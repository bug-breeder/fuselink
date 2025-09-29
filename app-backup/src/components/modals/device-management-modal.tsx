"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HiDesktopComputer, HiDeviceMobile, HiDotsVertical, HiPencil, HiTrash } from "react-icons/hi";
import { SiApple } from "react-icons/si";
import { Separator } from "@/components/ui/separator";
import React from "react";
import type { Device } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditDeviceModal } from "./edit-device-modal";

const osIcons = {
  windows: <HiDesktopComputer className="h-5 w-5 text-muted-foreground" />,
  macos: <SiApple className="h-5 w-5 text-muted-foreground" />,
  linux: <HiDesktopComputer className="h-5 w-5 text-muted-foreground" />,
  android: <HiDeviceMobile className="h-5 w-5 text-muted-foreground" />,
  ios: <HiDeviceMobile className="h-5 w-5 text-muted-foreground" />,
};

interface DeviceManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  onDeviceUpdate: (device: Device) => void;
  onDeviceRemove: (deviceId: string) => void;
}

export function DeviceManagementModal({
  open,
  onOpenChange,
  devices,
  onDeviceUpdate,
  onDeviceRemove
}: DeviceManagementModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleRenameClick = (device: Device) => {
    setSelectedDevice(device);
    setIsEditModalOpen(true);
  };

  const handleDeviceUpdate = (updatedDevice: Device) => {
    onDeviceUpdate(updatedDevice);
    setSelectedDevice(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HiDesktopComputer className="h-5 w-5" />
              Paired Devices ({devices.length})
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Manage and rename your devices, or remove ones you no longer use.</p>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {devices.map((device, index) => (
              <React.Fragment key={device.id}>
                <div className="flex items-center p-3 rounded-lg hover:bg-secondary transition-colors">
                  {osIcons[device.os]}
                  <div className="ml-4 flex-1">
                    <p className="font-semibold">{device.alias || device.name}</p>
                    <p className="text-sm text-muted-foreground">{device.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="sr-only">Status: {device.status}</span>
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        device.status === 'online' ? "bg-green-500" : "bg-gray-400"
                      )}
                      aria-hidden
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <HiDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRenameClick(device)}>
                          <HiPencil className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeviceRemove(device.id)}
                          className="text-destructive"
                        >
                          <HiTrash className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {index < devices.length - 1 && <Separator />}
              </React.Fragment>
            ))}
            {devices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <HiDesktopComputer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No devices paired yet</p>
                <p className="text-sm">Use the + button to pair your first device</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedDevice && (
        <EditDeviceModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          device={selectedDevice}
          onDeviceUpdate={handleDeviceUpdate}
        />
      )}
    </>
  );
}