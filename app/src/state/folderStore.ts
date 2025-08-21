import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FolderMapping } from './types';

interface FolderState {
  folders: FolderMapping[];
  
  // Actions
  addFolder: (folder: FolderMapping) => void;
  removeFolder: (folderId: string) => void;
  updateFolder: (folderId: string, updates: Partial<FolderMapping>) => void;
  toggleFolderSync: (folderId: string) => void;
  updateLastSync: (folderId: string, timestamp: number) => void;
  clearAllFolders: () => void;
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      folders: [],
      
      addFolder: (folder) => 
        set((state) => ({
          folders: [...state.folders, folder]
        })),
      
      removeFolder: (folderId) => 
        set((state) => ({
          folders: state.folders.filter(f => f.id !== folderId)
        })),
      
      updateFolder: (folderId, updates) =>
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, ...updates } : folder
          )
        })),
      
      toggleFolderSync: (folderId) =>
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId 
              ? { ...folder, syncEnabled: !folder.syncEnabled }
              : folder
          )
        })),
      
      updateLastSync: (folderId, timestamp) =>
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.id === folderId 
              ? { ...folder, lastSync: timestamp }
              : folder
          )
        })),
      
      clearAllFolders: () => 
        set({ folders: [] }),
    }),
    {
      name: 'fuselink-folders',
      partialize: (state) => ({
        folders: state.folders.map(f => ({
          ...f,
          // Don't persist FileSystemDirectoryHandle as it's not serializable
          handle: undefined
        }))
      }),
    }
  )
);