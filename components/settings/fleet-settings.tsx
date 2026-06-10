'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Car, Radio as RadioIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { VehicleFormDialog } from './vehicle-form-dialog'
import { RadioFormDialog } from './radio-form-dialog'
import { getVehicles, deleteVehicle, type VehicleWithLocation } from '@/lib/actions/vehicle-actions'
import { getRadios, deleteRadio, type RadioWithLocation } from '@/lib/actions/radio-actions'
import type { Role } from '@prisma/client'

interface FleetSettingsProps {
  user: { id: string; firstName: string; lastName: string; role: Role }
  locations: { id: string; name: string }[]
}

function statusBadge(status: string) {
  if (status === 'WORKING') return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Working</Badge>
  if (status === 'OUT_OF_SERVICE') return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Service</Badge>
  return <Badge variant="secondary">Retired</Badge>
}

export function FleetSettings({ user, locations }: FleetSettingsProps) {
  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([])
  const [radios, setRadios] = useState<RadioWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicleDialog, setVehicleDialog] = useState<{ open: boolean; vehicle?: VehicleWithLocation }>({ open: false })
  const [radioDialog, setRadioDialog] = useState<{ open: boolean; radio?: RadioWithLocation }>({ open: false })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'vehicle' | 'radio'; id: string; name: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    const [vResult, rResult] = await Promise.all([getVehicles(), getRadios()])
    if (vResult.ok) setVehicles(vResult.data)
    if (rResult.ok) setRadios(rResult.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const result = deleteConfirm.type === 'vehicle'
      ? await deleteVehicle(deleteConfirm.id)
      : await deleteRadio(deleteConfirm.id)
    if (result.ok) {
      toast.success(result.message)
      loadData()
    } else {
      toast.error(result.message)
    }
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicles ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="radios" className="flex items-center gap-2">
            <RadioIcon className="h-4 w-4" />
            Radios ({radios.length})
          </TabsTrigger>
        </TabsList>

        {/* ── VEHICLES ── */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {vehicles.filter(v => v.status === 'OUT_OF_SERVICE').length} out of service
            </p>
            <Button size="sm" onClick={() => setVehicleDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No vehicles added yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year / Make / Model</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead className="text-right">Mileage</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map(v => (
                    <TableRow key={v.id} className={v.status === 'OUT_OF_SERVICE' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.year} {v.make} {v.model}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{v.vin ?? '—'}</TableCell>
                      <TableCell>{v.licensePlate ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.mileage.toLocaleString()} mi
                      </TableCell>
                      <TableCell>{v.location?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{statusBadge(v.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setVehicleDialog({ open: true, vehicle: v })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ open: true, type: 'vehicle', id: v.id, name: v.name })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── RADIOS ── */}
        <TabsContent value="radios" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {radios.filter(r => r.status === 'OUT_OF_SERVICE').length} out of service
            </p>
            <Button size="sm" onClick={() => setRadioDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Radio
            </Button>
          </div>

          {radios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RadioIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No radios added yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {radios.map(r => (
                    <TableRow key={r.id} className={r.status === 'OUT_OF_SERVICE' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.model ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.serialNumber ?? '—'}</TableCell>
                      <TableCell>{r.channel ?? '—'}</TableCell>
                      <TableCell>{r.location?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setRadioDialog({ open: true, radio: r })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ open: true, type: 'radio', id: r.id, name: r.name })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vehicle dialog */}
      <VehicleFormDialog
        open={vehicleDialog.open}
        vehicle={vehicleDialog.vehicle}
        locations={locations}
        onOpenChange={open => setVehicleDialog(prev => ({ ...prev, open }))}
        onSuccess={() => { setVehicleDialog({ open: false }); loadData() }}
      />

      {/* Radio dialog */}
      <RadioFormDialog
        open={radioDialog.open}
        radio={radioDialog.radio}
        locations={locations}
        onOpenChange={open => setRadioDialog(prev => ({ ...prev, open }))}
        onSuccess={() => { setRadioDialog({ open: false }); loadData() }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remove {deleteConfirm?.type === 'vehicle' ? 'Vehicle' : 'Radio'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>? This action can be undone by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
