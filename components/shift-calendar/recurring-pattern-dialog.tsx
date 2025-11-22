'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { X } from 'lucide-react'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const recurringPatternSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  locationId: z.string().min(1, 'Location is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

type RecurringPatternFormData = z.infer<typeof recurringPatternSchema>

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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

interface RecurringPatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  users: User[]
  pattern?: any
  onSuccess?: () => void
}

export function RecurringPatternDialog({
  open,
  onOpenChange,
  locations,
  users,
  pattern,
  onSuccess,
}: RecurringPatternDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<{ userId: string; role: string | null }[]>([])
  const [generateShifts, setGenerateShifts] = useState(true)
  const [generateDays, setGenerateDays] = useState(30)

  const form = useForm<RecurringPatternFormData>({
    resolver: zodResolver(recurringPatternSchema),
    defaultValues: {
      name: pattern?.name || '',
      locationId: pattern?.location?.id || '',
      startTime: pattern?.startTime || '08:00',
      endTime: pattern?.endTime || '16:00',
      startDate: pattern?.startDate
        ? format(new Date(pattern.startDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      endDate: pattern?.endDate ? format(new Date(pattern.endDate), 'yyyy-MM-dd') : '',
    },
  })

  useEffect(() => {
    if (pattern?.daysOfWeek) {
      setSelectedDays(JSON.parse(pattern.daysOfWeek))
    }
    if (pattern?.userAssignments) {
      setSelectedUsers(
        pattern.userAssignments.map((a: any) => ({
          userId: a.user.id,
          role: a.role,
        }))
      )
    }
  }, [pattern])

  const handleToggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleAddUser = (userId: string) => {
    if (!selectedUsers.find((u) => u.userId === userId)) {
      setSelectedUsers([...selectedUsers, { userId, role: 'PRIMARY' }])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.userId !== userId))
  }

  const onSubmit = async (data: RecurringPatternFormData) => {
    if (selectedDays.length === 0) {
      toast.error('Please select at least one day of the week')
      return
    }

    setIsLoading(true)

    try {
      const url = pattern ? `/api/shifts/recurring/${pattern.id}` : '/api/shifts/recurring'
      const method = pattern ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          daysOfWeek: selectedDays,
          userAssignments: selectedUsers,
          generateShifts: !pattern && generateShifts ? { days: generateDays } : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save recurring pattern')
      }

      toast.success(
        pattern ? 'Recurring pattern updated successfully' : 'Recurring pattern created successfully'
      )
      onOpenChange(false)
      form.reset()
      setSelectedDays([])
      setSelectedUsers([])
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserById = (userId: string) => users.find((u) => u.id === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pattern ? 'Edit Recurring Pattern' : 'Create Recurring Pattern'}
          </DialogTitle>
          <DialogDescription>
            {pattern
              ? 'Update recurring shift pattern details'
              : 'Create a pattern for shifts that repeat on specific days'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning Shift - Bay Shore Marina (Weekdays)" {...field} />
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
                    <FormLabel>Start Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="08:00" {...field} />
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
                    <FormLabel>End Time (HH:MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="16:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Repeat On</FormLabel>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave empty for indefinite pattern</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Default Guard Assignments</FormLabel>
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

            {!pattern && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generate-shifts"
                    checked={generateShifts}
                    onCheckedChange={(checked) => setGenerateShifts(checked as boolean)}
                  />
                  <label htmlFor="generate-shifts" className="text-sm font-medium">
                    Generate shifts immediately
                  </label>
                </div>
                {generateShifts && (
                  <div className="ml-6">
                    <FormLabel>Number of days to generate</FormLabel>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={generateDays}
                      onChange={(e) => setGenerateDays(parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            )}

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
                {isLoading
                  ? 'Saving...'
                  : pattern
                  ? 'Update Pattern'
                  : 'Create Pattern'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
