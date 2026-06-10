'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, CheckSquare, MapPin, Car } from 'lucide-react'
import { SafetyChecklistSettings } from './safety-checklist-settings'
import { LocationSettings } from './location-settings'
import { FleetSettings } from './fleet-settings'
import type { Role } from '@prisma/client'

const SETTINGS_TABS = ['checklist', 'locations', 'fleet'] as const
type SettingsTab = (typeof SETTINGS_TABS)[number]

function isSettingsTab(value: string | undefined): value is SettingsTab {
  return SETTINGS_TABS.includes(value as SettingsTab)
}

interface SettingsPageClientProps {
  user: {
    id: string
    firstName: string
    lastName: string
    role: Role
  }
  locations: { id: string; name: string }[]
  initialTab?: string
}

export function SettingsPageClient({ user, locations, initialTab }: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isSettingsTab(initialTab) ? initialTab : 'checklist'
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage system configurations and preferences</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => isSettingsTab(value) && setActiveTab(value)}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Safety Checklist
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Fleet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Checklist Management</CardTitle>
              <CardDescription>
                Manage guard check-in questions and safety checklist items. These items will be
                displayed to guards during clock-in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SafetyChecklistSettings user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Settings</CardTitle>
              <CardDescription>
                Manage marina locations, addresses, and maximum guard capacity per shift.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationSettings user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Management</CardTitle>
              <CardDescription>
                Manage vehicles and radios across all marina locations. Track status, mileage,
                VINs, and serial numbers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FleetSettings user={user} locations={locations} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
