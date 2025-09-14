import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Smartphone,
  Trash2,
  Edit2,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings
} from 'lucide-react'
import { useDeviceStore, type TrustedDevice } from '@/stores/deviceStore'

export function TrustedDevicesManager() {
  const [editingDevice, setEditingDevice] = useState<TrustedDevice | null>(null)
  const [newName, setNewName] = useState('')
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null)

  const { trustedDevices, removeTrustedDevice, addTrustedDevice, deviceId, deviceName, updateDeviceName } = useDeviceStore()

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleEditDevice = (device: TrustedDevice) => {
    setEditingDevice(device)
    setNewName(device.name)
  }

  const handleSaveEdit = () => {
    if (editingDevice && newName.trim()) {
      // Update the device with new name
      addTrustedDevice({
        ...editingDevice,
        name: newName.trim()
      }, editingDevice.isPaired)

      setEditingDevice(null)
      setNewName('')
    }
  }

  const handleRemoveDevice = (deviceId: string) => {
    removeTrustedDevice(deviceId)
    setShowRemoveDialog(null)
  }

  const handleEditCurrentDevice = () => {
    if (newName.trim() && newName !== deviceName) {
      updateDeviceName(newName.trim())
      setEditingDevice(null)
      setNewName('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Device */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              This Device
            </CardTitle>
            <Badge variant="default">Current</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{deviceName}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {deviceId?.substring(0, 16)}...
                </p>
              </div>
            </div>

            <Dialog
              open={editingDevice?.id === 'current'}
              onOpenChange={(open) => !open && setEditingDevice(null)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingDevice({ id: 'current' } as TrustedDevice)
                    setNewName(deviceName || '')
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename This Device</DialogTitle>
                  <DialogDescription>
                    Choose a name that helps you identify this device
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My Device"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingDevice(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditCurrentDevice} disabled={!newName.trim()}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Trusted Devices ({trustedDevices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trustedDevices.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Trusted Devices</h3>
              <p className="text-muted-foreground mb-4">
                Pair with other devices to start syncing files securely
              </p>
              <Button>Start Pairing</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trustedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{device.name}</p>
                        {device.isPaired && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {!device.isPaired && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{device.id.substring(0, 16)}...</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastSeen(device.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={device.isPaired ? "default" : "secondary"}>
                      {device.isPaired ? "Paired" : "Pending"}
                    </Badge>

                    <Dialog
                      open={editingDevice?.id === device.id}
                      onOpenChange={(open) => !open && setEditingDevice(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDevice(device)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rename Device</DialogTitle>
                          <DialogDescription>
                            Change the display name for this trusted device
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="device-name">Device Name</Label>
                          <Input
                            id="device-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={device.name}
                            autoFocus
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingDevice(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} disabled={!newName.trim()}>
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={showRemoveDialog === device.id}
                      onOpenChange={(open) => !open && setShowRemoveDialog(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRemoveDialog(device.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Trusted Device</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove "{device.name}" from your trusted devices?
                            You'll need to pair again to sync files.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowRemoveDialog(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveDevice(device.id)}
                          >
                            Remove Device
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {trustedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Device Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Trusted devices can sync files with this device without requiring re-verification.
              Remove devices you no longer trust or use.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">Export Device List</Button>
              <Button variant="outline">Clear All Devices</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}