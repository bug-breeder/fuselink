
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { folders as initialFolders, devices as allDevices } from "@/lib/placeholder-data";
import { PlusCircle, Folder as FolderIcon, Monitor, Smartphone, Apple } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AddFolderModal } from "../modals/add-folder-modal";
import { Separator } from "@/components/ui/separator";
import React from "react";
import type { Device, Folder } from "@/lib/types";
import { cn } from "@/lib/utils";

const osIcons = {
  windows: <Monitor className="h-4 w-4 text-muted-foreground" />,
  macos: <Apple className="h-4 w-4 text-muted-foreground" />,
  linux: <Monitor className="h-4 w-4 text-muted-foreground" />,
  android: <Smartphone className="h-4 w-4 text-muted-foreground" />,
  ios: <Smartphone className="h-4 w-4 text-muted-foreground" />,
};

const getDeviceById = (id: string): Device | undefined => allDevices.find(d => d.id === id);

export function SyncedFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedFolders = window.localStorage.getItem('syncedFolders');
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      } else {
        setFolders(initialFolders);
      }
    } catch (error) {
      console.error("Failed to load folders from localStorage", error);
      setFolders(initialFolders);
    }
  }, []);

  useEffect(() => {
    try {
      if (folders.length > 0) {
        window.localStorage.setItem('syncedFolders', JSON.stringify(folders));
      }
    } catch (error) {
      console.error("Failed to save folders to localStorage", error);
    }
  }, [folders]);

  const handleAddFolder = (folderPath: string) => {
    const folderName = folderPath.split(/[\\/]/).pop() || folderPath;
    const newFolder: Folder = {
      id: `f${Date.now()}`,
      name: folderName,
      path: folderPath,
      fileCount: 0,
      size: '0 KB',
      isSyncing: false,
      progress: 0,
      files: [],
      syncedDevices: [],
    };
    setFolders(prevFolders => [...prevFolders, newFolder]);
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle>Synced Folders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {folders.map((folder, index) => {
            const syncedDevices = folder.syncedDevices.map(getDeviceById).filter((d): d is Device => !!d);
            return (
              <React.Fragment key={folder.id}>
                <div className="p-3 rounded-lg hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-4">
                    <FolderIcon className="text-primary h-6 w-6" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{folder.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{folder.path}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex justify-between items-center">
                        <span>{folder.fileCount} files ({folder.size})</span>
                        {folder.isSyncing && (
                          <span className="text-xs font-medium text-primary">{folder.progress}% synced</span>
                        )}
                      </div>
                      {folder.isSyncing && <Progress value={folder.progress} className="h-2" />}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Synced Devices</h4>
                    <div className="flex flex-col gap-2 pt-2">
                      {syncedDevices.length > 0 ? (
                        syncedDevices.map(device => (
                          <div key={device.id} className="flex items-center gap-2 text-sm">
                            {osIcons[device.os]}
                            <span className="flex-1">{device.alias || device.name}</span>
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              device.status === 'online' ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No devices synced to this folder yet.</p>
                      )}
                    </div>
                  </div>
                </div>
                {index < folders.length - 1 && <Separator />}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
      <CardFooter>
        <AddFolderModal 
          open={isAddFolderModalOpen} 
          onOpenChange={setIsAddFolderModalOpen}
          onAddFolder={handleAddFolder}
        >
          <Button className="w-full" onClick={() => setIsAddFolderModalOpen(true)}>
            <PlusCircle />
            Add Folder
          </Button>
        </AddFolderModal>
      </CardFooter>
    </Card>
  );
}
