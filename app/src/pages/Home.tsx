import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, Shield, Zap } from "lucide-react"
import { useLibP2PStore } from "@/stores/libp2pStore"

export function Home() {
  const navigate = useNavigate()
  const { node, isConnected, peerId, initializeNode } = useLibP2PStore()

  useEffect(() => {
    if (!node) {
      initializeNode()
    }
  }, [node, initializeNode])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Fuselink</h1>
          <p className="text-muted-foreground mb-4">P2P File Sync with End-to-End Encryption</p>

          <div className="flex justify-center gap-2 mb-4">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "libp2p Connected" : "Connecting..."}
            </Badge>
            {peerId && (
              <Badge variant="outline" className="font-mono text-xs max-w-48 truncate">
                {peerId}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                P2P Direct
              </CardTitle>
              <CardDescription>
                Direct device-to-device transfers using WebRTC
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                End-to-End Encrypted
              </CardTitle>
              <CardDescription>
                Zero-knowledge server with libp2p encryption
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                QR Pairing
              </CardTitle>
              <CardDescription>
                Scan QR codes to connect devices instantly
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Ready to Start?</CardTitle>
            <CardDescription>
              Choose how you want to connect your devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              disabled={!isConnected}
              onClick={() => navigate('/pairing')}
            >
              Start Device Pairing
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/devices')}
            >
              Manage Devices
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          Phase 2: Device Pairing Complete ✅ - QR Generation + Scanner + Safety Words
        </div>
      </div>
    </div>
  )
}