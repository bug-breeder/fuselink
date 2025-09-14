import { create } from 'zustand'
import { createNode, type LibP2PNode } from '@/lib/libp2p'

interface LibP2PStore {
  node: LibP2PNode | null
  isConnected: boolean
  peerId: string | null
  initializeNode: () => Promise<void>
  cleanup: () => Promise<void>
}

export const useLibP2PStore = create<LibP2PStore>((set, get) => ({
  node: null,
  isConnected: false,
  peerId: null,

  initializeNode: async () => {
    try {
      const node = await createNode()

      node.addEventListener('peer:connect', () => {
        console.log('Peer connected')
      })

      node.addEventListener('peer:disconnect', () => {
        console.log('Peer disconnected')
      })

      await node.start()

      set({
        node,
        isConnected: true,
        peerId: node.peerId.toString()
      })

      console.log('libp2p node started, PeerID:', node.peerId.toString())
    } catch (error) {
      console.error('Failed to initialize libp2p node:', error)
    }
  },

  cleanup: async () => {
    const { node } = get()
    if (node) {
      await node.stop()
      set({ node: null, isConnected: false, peerId: null })
    }
  }
}))