import { TrustedDevicesManager } from '@/components/TrustedDevicesManager'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DevicesPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Device Management</h1>
            <p className="text-muted-foreground">
              Manage your trusted devices and pairing settings
            </p>
          </div>
        </div>

        {/* Device Manager */}
        <TrustedDevicesManager />
      </div>
    </div>
  )
}