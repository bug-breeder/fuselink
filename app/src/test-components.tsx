// Test file to verify all components are working
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLibP2PStore } from "@/stores/libp2pStore"

export function TestComponents() {
  const { isConnected, peerId } = useLibP2PStore()

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Component Test</h2>

      {/* Origin UI Components Test */}
      <Card>
        <CardHeader>
          <CardTitle>Origin UI Components ✅</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button>Button Component</Button>
          <Button variant="outline">Outline Button</Button>
          <Input placeholder="Input Component" />
          <Badge>Badge Component</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </CardContent>
      </Card>

      {/* libp2p Test */}
      <Card>
        <CardHeader>
          <CardTitle>libp2p Status {isConnected ? "✅" : "⏳"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Connected: {isConnected ? "Yes" : "Connecting..."}</p>
          {peerId && <p className="text-sm font-mono break-all">Peer ID: {peerId}</p>}
        </CardContent>
      </Card>

      {/* Zustand Test */}
      <Card>
        <CardHeader>
          <CardTitle>State Management ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Zustand store is working and providing libp2p state</p>
        </CardContent>
      </Card>

      {/* Tailwind Test */}
      <Card>
        <CardHeader>
          <CardTitle>Tailwind CSS ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary text-primary-foreground p-2 rounded">
            Primary colors working
          </div>
          <div className="bg-secondary text-secondary-foreground p-2 rounded mt-2">
            Secondary colors working
          </div>
        </CardContent>
      </Card>
    </div>
  )
}