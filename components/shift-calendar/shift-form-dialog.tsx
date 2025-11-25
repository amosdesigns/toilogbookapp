'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createShift, updateShift } from '@/lib/actions/shift-actions'
import { getErrorMessage, type CatchError } from '@/lib/utils/error-handler'

const shiftFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  locationId: z.string().min(1, 'Location is required'),
})

type ShiftFormData = z.infer<typeof shiftFormSchema>

type Location = {
  id: string
  name: string
  maxCapacity: number | null
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

type ShiftAssignment = {
  userId: string
  role: string | null
}

interface ShiftFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  users: User[]
  shift?: any
  defaultDate?: Date
  defaultHour?: number
  onSuccess?: () => void
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  locations,
  users,
  shift,
  defaultDate,
  defaultHour,
  onSuccess,
}: ShiftFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<ShiftAssignment[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: shift?.name || '',
      startTime: shift?.startTime
        ? format(new Date(shift.startTime), "yyyy-MM-dd'T'HH:mm")
        : defaultDate && defaultHour !== undefined
        ? format(
            new Date(defaultDate.setHours(defaultHour, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm"
          )
        : '',
      endTime: shift?.endTime
        ? format(new Date(shift.endTime), "yyyy-MM-dd'T'HH:mm")
        : defaultDate && defaultHour !== undefined
        ? format(
            new Date(defaultDate.setHours(defaultHour + 8, 0, 0, 0)),
            "yyyy-MM-dd'T'HH:mm"
          )
        : '',
      locationId: shift?.location?.id || '',
    },
  })

  useEffect(() => {
    if (shift?.assignments) {
      setSelectedUsers(
        shift.assignments.map((a: any) => ({
          userId: a.user.id,
          role: a.role,
        }))
      )
    }
  }, [shift])

  useEffect(() => {
    const locationId = form.watch('locationId')
    const location = locations.find((l) => l.id === locationId)
    setSelectedLocation(location || null)
  }, [form.watch('locationId'), locations])

  const handleAddUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    // Check capacity
    if (selectedLocation?.maxCapacity && selectedUsers.length >= selectedLocation.maxCapacity) {
      toast.error(`Maximum capacity of ${selectedLocation.maxCapacity} guards reached`)
      return
    }

    if (!selectedUsers.find((u) => u.userId === userId)) {
      setSelectedUsers([...selectedUsers, { userId, role: null }])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.userId !== userId))
  }

  const onSubmit = async (data: ShiftFormData) => {
    setIsLoading(true)

    try {
      const shiftData = {
        ...data,
        userAssignments: selectedUsers,
      }

      const result = shift
        ? await updateShift(shift.id, shiftData)
        : await createShift(shiftData)

      if (!result.ok) {
        throw new Error(result.message || 'Failed to save shift')
      }

      toast.success(result.message || (shift ? 'Shift updated successfully' : 'Shift created successfully'))
      onOpenChange(false)
      form.reset()
      setSelectedUsers([])
      onSuccess?.()
    } catch (error: CatchError) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const getUserById = (userId: string) => users.find((u) => u.id === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shift ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
          <DialogDescription>
            {shift ? 'Update shift details and assignments' : 'Create a new shift and assign guards'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning Shift - Location Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                          {location.maxCapacity && ` (Max: ${location.maxCapacity})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Assign Guards</FormLabel>
              <Select onValueChange={handleAddUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select guard to assign" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === 'GUARD' || u.role === 'SUPERVISOR')
                    .filter((u) => !selectedUsers.find((su) => su.userId === u.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedLocation?.maxCapacity && (
                <p className="text-sm text-muted-foreground">
                  Assigned: {selectedUsers.length} / {selectedLocation.maxCapacity}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((assignment) => {
                  const user = getUserById(assignment.userId)
                  if (!user) return null

                  return (
                    <Badge key={assignment.userId} variant="secondary" className="pr-1">
                      {user.firstName} {user.lastName}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                        onClick={() => handleRemoveUser(assignment.userId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
