// Core types for the application state

export interface Device {
  id: string;
  name: string;
  pubKeyJwk: JsonWebKey;
  lastSeen?: number;
  isOnline?: boolean;
  ipAddress?: string;
}

export interface FolderMapping {
  id: string;
  name: string;
  localPath: string;
  handle?: FileSystemDirectoryHandle;
  include?: string[];
  exclude?: string[];
  lastSync?: number;
  syncEnabled: boolean;
}

export interface Transfer {
  id: string;
  deviceId: string;
  folderId: string;
  path: string;
  size: number;
  sentBytes: number;
  receivedBytes: number;
  status:
    | "idle"
    | "preparing"
    | "sending"
    | "receiving"
    | "paused"
    | "completed"
    | "error";
  direction: "upload" | "download";
  error?: string;
  startTime?: number;
  endTime?: number;
  speed?: number; // bytes per second
}

export interface FileEntry {
  path: string;
  size: number;
  mtime: number;
  hash?: string;
  isDirectory: boolean;
}

export interface SyncSession {
  id: string;
  deviceId: string;
  folderId: string;
  status:
    | "connecting"
    | "scanning"
    | "diffing"
    | "transferring"
    | "completed"
    | "error";
  startTime: number;
  endTime?: number;
  filesScanned: number;
  filesChanged: number;
  bytesTransferred: number;
  error?: string;
}

export interface NotificationData {
  deviceId: string;
  deviceName: string;
  folderId?: string;
  folderName?: string;
  action: "sync_request" | "sync_complete" | "pair_request";
  timestamp: number;
}
