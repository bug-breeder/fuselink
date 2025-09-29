export type Device = {
  id: string;
  name: string;
  alias?: string;
  status: 'online' | 'offline';
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
};

export type File = {
  id: string;
  name: string;
  size: string;
  isSyncing: boolean;
  progress: number;
};

export type Folder = {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  size: string;
  isSyncing: boolean;
  progress: number;
  files: File[];
  syncedDevices: string[]; // Array of device IDs
};

export type Conflict = {
  id: string;
  fileName: string;
  folderName: string;
  device1Name: string;
  device2Name: string;
  timestamp: Date;
  file1Content: string;
  file2Content: string;
};
