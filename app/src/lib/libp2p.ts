import { createLibp2p } from 'libp2p'
import { webRTC } from '@libp2p/webrtc'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'

export async function createNode() {
  const node = await createLibp2p({
    addresses: {
      listen: ['/webrtc', '/p2p-circuit']
    },
    transports: [
      webRTC({
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:3478' },
            { urls: 'stun:stun2.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      }),
      circuitRelayTransport()
    ],
    streamMuxers: [yamux()],
    connectionEncrypters: [noise()],
    services: {
      identify: identify()
    }
  })

  return node
}

export type LibP2PNode = Awaited<ReturnType<typeof createNode>>