"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HiFolder, HiDesktopComputer, HiDeviceMobile } from "react-icons/hi";
import { Progress } from "@/components/ui/progress";
import React from "react";
import type { Device, Folder } from "@/lib/types";
import { cn } from "@/lib/utils";

const osIcons = {
  windows: <HiDesktopComputer className="h-4 w-4 text-muted-foreground" />,
  macos: <HiDesktopComputer className="h-4 w-4 text-muted-foreground" />,
  linux: <HiDesktopComputer className="h-4 w-4 text-muted-foreground" />,
  android: <HiDeviceMobile className="h-4 w-4 text-muted-foreground" />,
  ios: <HiDeviceMobile className="h-4 w-4 text-muted-foreground" />,
};

interface FolderCardProps {
  folder: Folder;
  syncedDevices: Device[];
}

export function FolderCard({ folder, syncedDevices }: FolderCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <HiFolder className="text-primary h-5 w-5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{folder.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{folder.path}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex justify-between items-center">
              <span>{folder.fileCount} files ({folder.size})</span>
              {folder.isSyncing && (
                <span className="text-xs font-medium text-primary">{folder.progress}% synced</span>
              )}
            </div>
            {folder.isSyncing && <Progress value={folder.progress} className="h-2" />}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Synced Devices</h4>
            <div className="flex flex-wrap gap-1">
              {syncedDevices.length > 0 ? (
                syncedDevices.map(device => (
                  <Badge key={device.id} variant="secondary" className="flex items-center gap-1 px-2 py-1 rounded-full">
                    {osIcons[device.os]}
                    <span className="text-xs">{device.alias || device.name}</span>
                    <span className="sr-only">Status: {device.status}</span>
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full ml-1",
                        device.status === 'online' ? "bg-green-500" : "bg-gray-400"
                      )}
                      aria-hidden
                    />
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No devices synced to this folder yet.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}