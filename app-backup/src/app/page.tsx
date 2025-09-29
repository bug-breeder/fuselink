"use client";

import { Header } from "@/components/layout/header";
import { FolderCard } from "@/components/dashboard/folder-card";
import { ExpandableFab } from "@/components/ui/expandable-fab";
import { DeviceManagementModal } from "@/components/modals/device-management-modal";
import { AddFolderModal } from "@/components/modals/add-folder-modal";
import { PairDeviceModal } from "@/components/modals/pair-device-modal";
import { folders as initialFolders, devices as allDevices } from "@/lib/placeholder-data";
import { useState, useEffect, useCallback } from "react";
import type { Device, Folder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { HiDesktopComputer } from "react-icons/hi";

const getDeviceById = (id: string): Device | undefined => allDevices.find(d => d.id === id);

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [devices, setDevices] = useState<Device[]>(allDevices);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isPairDeviceModalOpen, setIsPairDeviceModalOpen] = useState(false);
  const [isDeviceManagementOpen, setIsDeviceManagementOpen] = useState(false);

  const openDeviceManagement = useCallback(() => {
    setIsDeviceManagementOpen(true);
  }, []);

  const openAddFolder = useCallback(() => {
    setIsAddFolderModalOpen(true);
  }, []);

  const openPairDevice = useCallback(() => {
    setIsPairDeviceModalOpen(true);
  }, []);

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
    const folderName = folderPath.split(/[\/\\]/).pop() || folderPath;
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

  const handleDeviceUpdate = (updatedDevice: Device) => {
    setDevices(devices.map(d => d.id === updatedDevice.id ? updatedDevice : d));
  };

  const handleDeviceRemove = (deviceId: string) => {
    setDevices(devices.filter(d => d.id !== deviceId));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header>
        <Button
          variant="outline"
          size="sm"
          onClick={openDeviceManagement}
          className="ml-auto"
        >
          <HiDesktopComputer className="h-4 w-4 mr-2" />
          Devices ({devices.length})
        </Button>
      </Header>
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Synced Folders</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your synchronized folders across devices.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => {
              const syncedDevices = folder.syncedDevices.map(getDeviceById).filter((d): d is Device => !!d);
              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  syncedDevices={syncedDevices}
                />
              );
            })}
          </div>

          {folders.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="bg-secondary/30 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <HiDesktopComputer className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No folders synced yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first folder to sync across your devices.
                </p>
                <Button onClick={openAddFolder}>Add Folder</Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ExpandableFab
        onAddFolder={openAddFolder}
        onAddDevice={openPairDevice}
      />

      <AddFolderModal
        open={isAddFolderModalOpen}
        onOpenChange={setIsAddFolderModalOpen}
        onAddFolder={handleAddFolder}
      />

      <PairDeviceModal
        open={isPairDeviceModalOpen}
        onOpenChange={setIsPairDeviceModalOpen}
      />

      <DeviceManagementModal
        open={isDeviceManagementOpen}
        onOpenChange={setIsDeviceManagementOpen}
        devices={devices}
        onDeviceUpdate={handleDeviceUpdate}
        onDeviceRemove={handleDeviceRemove}
      />
    </div>
  );
}
