'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Car, Radio as RadioIcon, WrenchIcon, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getFleetInShop } from '@/lib/actions/vehicle-actions'
import type { VehicleWithLocation } from '@/lib/actions/vehicle-actions'
import type { Radio, Location } from '@prisma/client'

type RadioWithLocation = Radio & { location: Location | null }

export function InShopWidget() {
  const [vehicles, setVehicles] = useState<VehicleWithLocation[]>([])
  const [radios, setRadios] = useState<RadioWithLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFleetInShop().then(result => {
      if (result.ok) {
        setVehicles(result.data.vehicles)
        setRadios(result.data.radios)
      }
      setLoading(false)
    })
  }, [])

  const total = vehicles.length + radios.length

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={total > 0 ? 'border-red-200 dark:border-red-900' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <WrenchIcon className={`h-4 w-4 ${total > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            Fleet — Out of Service
            {total > 0 && (
              <Badge variant="destructive" className="ml-1">{total}</Badge>
            )}
          </CardTitle>
          <Link href="/dashboard/settings?tab=fleet"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Manage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            All fleet assets operational ✓
          </p>
        ) : (
          <div className="space-y-2">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="font-medium leading-none">{v.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.year} {v.make} {v.model}
                      {v.location && ` · ${v.location.name}`}
                    </p>
                  </div>
                </div>
                {v.notes && (
                  <span className="text-xs text-muted-foreground max-w-[140px] truncate ml-2" title={v.notes}>
                    {v.notes}
                  </span>
                )}
              </div>
            ))}
            {radios.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <RadioIcon className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="font-medium leading-none">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.model ?? 'Radio'}
                      {r.location && ` · ${r.location.name}`}
                    </p>
                  </div>
                </div>
                {r.notes && (
                  <span className="text-xs text-muted-foreground max-w-[140px] truncate ml-2" title={r.notes}>
                    {r.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
