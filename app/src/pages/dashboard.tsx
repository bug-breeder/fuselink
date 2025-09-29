import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Divider } from "@heroui/divider";
import { Spacer } from "@heroui/spacer";

import DefaultLayout from "@/layouts/default";
import { FolderIcon, DeviceIcon, SyncIcon, PlusIcon } from "@/components/icons";

// Mock data
const folders = [
  {
    id: '1',
    name: 'Project-Nebula',
    path: '~/Documents/Projects/Project-Nebula',
    fileCount: 128,
    size: '1.2 GB',
    isSyncing: true,
    progress: 75,
    syncedDevices: ['Work PC', 'Personal Laptop']
  },
  {
    id: '2',
    name: 'Vacation-Photos',
    path: '~/Pictures/Vacation-2024',
    fileCount: 843,
    size: '4.5 GB',
    isSyncing: false,
    progress: 100,
    syncedDevices: ['Work PC', 'Pixel-8']
  },
  {
    id: '3',
    name: 'Source-Code',
    path: '~/dev/fuselink-app',
    fileCount: 2048,
    size: '350 MB',
    isSyncing: false,
    progress: 100,
    syncedDevices: ['Work PC', 'Personal Laptop', 'Pixel-8']
  }
];

const devices = [
  { id: '1', name: 'Work PC', status: 'online' as const },
  { id: '2', name: 'Personal Laptop', status: 'online' as const },
  { id: '3', name: 'Pixel-8', status: 'offline' as const }
];

export default function DashboardPage() {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  const handleFolderSelect = (folderId: string, isSelected: boolean) => {
    setSelectedFolders(prev => 
      isSelected 
        ? [...prev, folderId]
        : prev.filter(id => id !== folderId)
    );
  };

  return (
    <DefaultLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Synced Folders</h1>
          <p className="text-default-500">
            Manage your synchronized folders across devices.
          </p>
        </div>

        {/* Folder Cards */}
        <div className="grid gap-4 mb-6">
          {folders.map((folder) => {
            const isSelected = selectedFolders.includes(folder.id);
            const syncedDeviceData = folder.syncedDevices
              .map(deviceName => devices.find(d => d.name === deviceName))
              .filter((d): d is typeof devices[0] => !!d);

            return (
              <Card 
                key={folder.id} 
                className={`p-4 ${isSelected ? 'border-primary' : ''}`}
                isPressable
                onPress={() => handleFolderSelect(folder.id, !isSelected)}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      isSelected={isSelected}
                      onValueChange={(checked) => handleFolderSelect(folder.id, checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FolderIcon className="w-6 h-6 text-primary" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{folder.name}</h3>
                        <Chip size="sm" variant="flat" color="default">
                          {folder.fileCount} files
                        </Chip>
                        <Chip size="sm" variant="flat" color="default">
                          {folder.size}
                        </Chip>
                      </div>
                      
                      <p className="text-small text-default-500 truncate mb-3">
                        {folder.path}
                      </p>

                      {folder.isSyncing && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-small text-default-500">Syncing...</span>
                            <span className="text-small font-medium text-primary">
                              {folder.progress}%
                            </span>
                          </div>
                          <Progress 
                            value={folder.progress} 
                            color="primary"
                            size="sm"
                            className="max-w-md"
                          />
                        </div>
                      )}

                      <div>
                        <p className="text-tiny text-default-400 mb-2">Synced Devices</p>
                        <div className="flex flex-wrap gap-2">
                          {syncedDeviceData.length > 0 ? (
                            syncedDeviceData.map((device) => (
                              <Chip
                                key={device.id}
                                size="sm"
                                variant="flat"
                                color={device.status === 'online' ? 'success' : 'default'}
                                startContent={<DeviceIcon className="w-3 h-3" />}
                              >
                                {device.name}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-tiny text-default-400 italic">
                              No devices synced
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Selection Actions */}
        {selectedFolders.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {selectedFolders.length} folder{selectedFolders.length > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" startContent={<SyncIcon />}>
                    Sync Now
                  </Button>
                  <Button size="sm" variant="flat" color="danger">
                    Remove
                  </Button>
                  <Button size="sm" variant="flat">
                    Settings
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Empty State */}
        {folders.length === 0 && (
          <Card className="py-12">
            <CardBody className="text-center">
              <div className="max-w-md mx-auto">
                <div className="p-6 bg-default-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <FolderIcon className="w-8 h-8 text-default-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No folders synced yet</h3>
                <p className="text-default-500 mb-6">
                  Start by adding your first folder to sync across your devices.
                </p>
                <Button color="primary" startContent={<PlusIcon />}>
                  Add Folder
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Dropdown>
            <DropdownTrigger>
              <Button 
                isIconOnly 
                color="primary" 
                size="lg"
                className="w-14 h-14 rounded-full shadow-lg"
              >
                <PlusIcon className="w-6 h-6" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Quick actions">
              <DropdownItem 
                key="add-device" 
                startContent={<DeviceIcon className="w-4 h-4" />}
              >
                Add Device
              </DropdownItem>
              <DropdownItem 
                key="add-folder" 
                startContent={<FolderIcon className="w-4 h-4" />}
              >
                Add Folder
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </DefaultLayout>
  );
}

