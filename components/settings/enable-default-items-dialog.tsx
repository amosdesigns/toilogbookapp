'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createSafetyChecklistItem, type SafetyChecklistItem } from '@/lib/actions/safety-checklist-actions'
import { DEFAULT_CHECKLIST_ITEMS } from '@/lib/constants/default-checklist-items'

interface EnableDefaultItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  existingItems: SafetyChecklistItem[]
}

export function EnableDefaultItemsDialog({
  open,
  onOpenChange,
  onSuccess,
  existingItems,
}: EnableDefaultItemsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  // Filter out items that already exist
  const existingNames = new Set(existingItems.map((item) => item.name.toLowerCase()))
  const availableDefaults = DEFAULT_CHECKLIST_ITEMS.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  )

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleEnableAll = () => {
    setSelectedItems(new Set(availableDefaults.map((_, i) => i)))
  }

  const handleClearAll = () => {
    setSelectedItems(new Set())
  }

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item')
      return
    }

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    // Create selected items
    for (const index of selectedItems) {
      const item = availableDefaults[index]
      const result = await createSafetyChecklistItem({
        name: item.name,
        description: item.description,
        order: item.order,
        isActive: true,
      })

      if (result.ok) {
        successCount++
      } else {
        errorCount++
      }
    }

    setLoading(false)

    if (errorCount === 0) {
      toast.success(`Successfully added ${successCount} checklist items`)
      setSelectedItems(new Set())
      onSuccess()
    } else {
      toast.warning(`Added ${successCount} items, ${errorCount} failed`)
      setSelectedItems(new Set())
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enable Default Checklist Items</DialogTitle>
          <DialogDescription>
            Select pre-defined safety checklist items to add to your system. Items that already exist
            are not shown.
          </DialogDescription>
        </DialogHeader>

        {availableDefaults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All default checklist items are already enabled.
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">
                {selectedItems.size} of {availableDefaults.length} selected
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEnableAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-4">
                {availableDefaults.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                    onClick={() => toggleItem(index)}
                  >
                    <Checkbox checked={selectedItems.has(index)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || selectedItems.size === 0}>
                {loading ? 'Adding...' : `Add ${selectedItems.size} Items`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
