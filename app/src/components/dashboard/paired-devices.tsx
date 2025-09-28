
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { devices as initialDevices } from "@/lib/placeholder-data";
import { PlusCircle, Monitor, Smartphone, Apple, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import React from "react";
import type { Device } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PairDeviceModal } from "../modals/pair-device-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditDeviceModal } from "../modals/edit-device-modal";

const osIcons = {
  windows: <Monitor className="h-5 w-5 text-muted-foreground" />,
  macos: <Apple className="h-5 w-5 text-muted-foreground" />,
  linux: <Monitor className="h-5 w-5 text-muted-foreground" />,
  android: <Smartphone className="h-5 w-5 text-muted-foreground" />,
  ios: <Smartphone className="h-5 w-5 text-muted-foreground" />,
};

export function PairedDevices() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [isPairDeviceModalOpen, setIsPairDeviceModalOpen] = useState(false);
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleRenameClick = (device: Device) => {
    setSelectedDevice(device);
    setIsEditDeviceModalOpen(true);
  };

  const handleDeviceUpdate = (updatedDevice: Device) => {
    setDevices(devices.map(d => d.id === updatedDevice.id ? updatedDevice : d));
    setSelectedDevice(null);
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
  };

  return (
    <>
      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle>Paired Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {devices.map((device, index) => (
              <React.Fragment key={device.id}>
                <div className="flex items-center p-2 rounded-lg hover:bg-secondary transition-colors">
                  {osIcons[device.os]}
                  <div className="ml-4 flex-1">
                    <p className="font-semibold">{device.alias || device.name}</p>
                    <p className="text-sm text-muted-foreground">{device.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={cn(
                        "h-2 w-2 rounded-full",
                        device.status === 'online' ? "bg-green-500" : "bg-gray-400"
                      )} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRenameClick(device)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRemoveDevice(device.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {index < devices.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <PairDeviceModal open={isPairDeviceModalOpen} onOpenChange={setIsPairDeviceModalOpen}>
            <Button className="w-full" onClick={() => setIsPairDeviceModalOpen(true)}>
              <PlusCircle />
              Pair New Device
            </Button>
          </PairDeviceModal>
        </CardFooter>
      </Card>
      {selectedDevice && (
        <EditDeviceModal
          open={isEditDeviceModalOpen}
          onOpenChange={setIsEditDeviceModalOpen}
          device={selectedDevice}
          onDeviceUpdate={handleDeviceUpdate}
        />
      )}
    </>
  );
}
