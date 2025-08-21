import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Transfer, SyncSession } from './types';

interface TransferState {
  transfers: Transfer[];
  syncSessions: SyncSession[];
  
  // Actions
  addTransfer: (transfer: Transfer) => void;
  updateTransfer: (transferId: string, updates: Partial<Transfer>) => void;
  removeTransfer: (transferId: string) => void;
  pauseTransfer: (transferId: string) => void;
  resumeTransfer: (transferId: string) => void;
  cancelTransfer: (transferId: string) => void;
  
  addSyncSession: (session: SyncSession) => void;
  updateSyncSession: (sessionId: string, updates: Partial<SyncSession>) => void;
  removeSyncSession: (sessionId: string) => void;
  
  clearCompletedTransfers: () => void;
  clearAllTransfers: () => void;
  
  // Getters
  getActiveTransfers: () => Transfer[];
  getTransfersForDevice: (deviceId: string) => Transfer[];
  getTotalProgress: () => { sent: number; received: number; total: number };
}

export const useTransferStore = create<TransferState>()(
  subscribeWithSelector((set, get) => ({
    transfers: [],
    syncSessions: [],
    
    addTransfer: (transfer) =>
      set((state) => ({
        transfers: [...state.transfers, transfer]
      })),
    
    updateTransfer: (transferId, updates) =>
      set((state) => ({
        transfers: state.transfers.map(transfer =>
          transfer.id === transferId ? { ...transfer, ...updates } : transfer
        )
      })),
    
    removeTransfer: (transferId) =>
      set((state) => ({
        transfers: state.transfers.filter(t => t.id !== transferId)
      })),
    
    pauseTransfer: (transferId) =>
      set((state) => ({
        transfers: state.transfers.map(transfer =>
          transfer.id === transferId ? { ...transfer, status: 'paused' } : transfer
        )
      })),
    
    resumeTransfer: (transferId) =>
      set((state) => ({
        transfers: state.transfers.map(transfer =>
          transfer.id === transferId 
            ? { 
                ...transfer, 
                status: transfer.direction === 'upload' ? 'sending' : 'receiving' 
              } 
            : transfer
        )
      })),
    
    cancelTransfer: (transferId) =>
      set((state) => ({
        transfers: state.transfers.filter(t => t.id !== transferId)
      })),
    
    addSyncSession: (session) =>
      set((state) => ({
        syncSessions: [...state.syncSessions, session]
      })),
    
    updateSyncSession: (sessionId, updates) =>
      set((state) => ({
        syncSessions: state.syncSessions.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      })),
    
    removeSyncSession: (sessionId) =>
      set((state) => ({
        syncSessions: state.syncSessions.filter(s => s.id !== sessionId)
      })),
    
    clearCompletedTransfers: () =>
      set((state) => ({
        transfers: state.transfers.filter(t => 
          t.status !== 'completed' && t.status !== 'error'
        )
      })),
    
    clearAllTransfers: () =>
      set({ transfers: [], syncSessions: [] }),
    
    getActiveTransfers: () => 
      get().transfers.filter(t => 
        t.status === 'sending' || t.status === 'receiving' || t.status === 'preparing'
      ),
    
    getTransfersForDevice: (deviceId) =>
      get().transfers.filter(t => t.deviceId === deviceId),
    
    getTotalProgress: () => {
      const transfers = get().transfers;
      const totals = transfers.reduce(
        (acc, transfer) => ({
          sent: acc.sent + transfer.sentBytes,
          received: acc.received + transfer.receivedBytes,
          total: acc.total + transfer.size,
        }),
        { sent: 0, received: 0, total: 0 }
      );
      return totals;
    },
  }))
);