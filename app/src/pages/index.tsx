import React from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

import DefaultLayout from "@/layouts/default";
import { FolderIcon, DeviceIcon, PlusIcon } from "@/components/icons";

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

export default function IndexPage() {
  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-light mb-4 text-foreground">Synced Folders</h1>
          <p className="text-lg text-default-400 max-w-2xl mx-auto">
            Seamlessly manage your synchronized folders across all devices
          </p>
        </div>

        {/* Folder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {folders.map((folder) => {
            const syncedDeviceData = folder.syncedDevices
              .map(deviceName => devices.find(d => d.name === deviceName))
              .filter((d): d is typeof devices[0] => !!d);

            return (
              <div 
                key={folder.id} 
                className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-gray-900/5 dark:hover:shadow-black/20 hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
                      <FolderIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    {folder.isSyncing && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {folder.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {folder.fileCount.toLocaleString()} files • {folder.size}
                    </p>
                  </div>
                </div>

                {/* Sync Progress */}
                {folder.isSyncing && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Syncing</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {folder.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${folder.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Simple Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{syncedDeviceData.filter(d => d.status === 'online').length} online</span>
                    </div>
                    <span>•</span>
                    <span>{syncedDeviceData.length} devices</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors">
                    Sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {folders.length === 0 && (
          <div className="text-center py-24">
            <div className="max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mx-auto flex items-center justify-center">
                <FolderIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No folders yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Add your first folder to start syncing files across devices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <Dropdown placement="top-end">
            <DropdownTrigger>
              <button className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group">
                <PlusIcon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Quick actions">
              <DropdownItem key="add-folder" startContent={<FolderIcon className="w-4 h-4" />}>
                Add Folder
              </DropdownItem>
              <DropdownItem key="add-device" startContent={<DeviceIcon className="w-4 h-4" />}>
                Pair Device
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </DefaultLayout>
  );
}
