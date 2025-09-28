import type { Folder, Device, Conflict } from '@/lib/types';

export const devices: Device[] = [
  { id: '1', name: 'Desktop-Alpha', alias: 'Work PC', status: 'online', os: 'windows' },
  { id: '2', name: 'MacBook-Pro', alias: 'Personal Laptop', status: 'online', os: 'macos' },
  { id: '3', name: 'Pixel-8', status: 'offline', os: 'android' },
];

export const folders: Folder[] = [
  {
    id: 'f1',
    name: 'Project-Nebula',
    path: '~/Documents/Projects/Project-Nebula',
    fileCount: 128,
    size: '1.2 GB',
    isSyncing: true,
    progress: 75,
    files: [
      { id: 'file1', name: 'research-paper.pdf', size: '2.5 MB', isSyncing: false, progress: 100 },
      { id: 'file2', name: 'asset-pack.zip', size: '850 MB', isSyncing: true, progress: 60 },
      { id: 'file3', name: 'meeting-notes.docx', size: '120 KB', isSyncing: false, progress: 100 },
    ],
    syncedDevices: ['1', '2'],
  },
  {
    id: 'f2',
    name: 'Vacation-Photos',
    path: '~/Pictures/Vacation-2024',
    fileCount: 843,
    size: '4.5 GB',
    isSyncing: false,
    progress: 100,
    files: [
      { id: 'file4', name: 'IMG_20240710.jpg', size: '5.2 MB', isSyncing: false, progress: 100 },
      { id: 'file5', name: 'IMG_20240711.jpg', size: '4.8 MB', isSyncing: false, progress: 100 },
    ],
    syncedDevices: ['1', '3'],
  },
  {
    id: 'f3',
    name: 'Source-Code',
    path: '~/dev/fuselink-app',
    fileCount: 2048,
    size: '350 MB',
    isSyncing: false,
    progress: 100,
    files: [],
    syncedDevices: ['1', '2', '3'],
  },
];

export const conflicts: Conflict[] = [
    {
        id: 'c1',
        fileName: 'config.json',
        folderName: 'Project-Nebula',
        device1Name: 'Desktop-Alpha',
        device2Name: 'MacBook-Pro',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        file1Content: `{
  "theme": "dark",
  "fontSize": 14,
  "autoSave": true,
  "experimentalFeatures": false
}`,
        file2Content: `{
  "theme": "dark",
  "fontSize": 16,
  "autoSave": true,
  "showLineNumbers": true
}`,
    },
    {
        id: 'c2',
        fileName: 'README.md',
        folderName: 'Source-Code',
        device1Name: 'Desktop-Alpha',
        device2Name: 'MacBook-Pro',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        file1Content: `# FuseLink Project

This is the main README for the FuseLink project.

## Features
- P2P Sync
- Cross-platform`,
        file2Content: `# FuseLink

The best P2P file sync tool.

## Key Features
- Peer-to-peer synchronization
- Cross-platform support
- End-to-end encryption`,
    }
]
