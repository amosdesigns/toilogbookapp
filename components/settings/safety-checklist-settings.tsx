'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AddChecklistItemDialog } from './add-checklist-item-dialog'
import { EditChecklistItemDialog } from './edit-checklist-item-dialog'
import { DeleteChecklistItemDialog } from './delete-checklist-item-dialog'
import { EnableDefaultItemsDialog } from './enable-default-items-dialog'
import {
  getAllSafetyChecklistItems,
  type SafetyChecklistItem,
} from '@/lib/actions/safety-checklist-actions'
import type { Role } from '@prisma/client'

interface SafetyChecklistSettingsProps {
  user: {
    id: string
    firstName: string
    lastName: string
    role: Role
  }
}

export function SafetyChecklistSettings({ user }: SafetyChecklistSettingsProps) {
  const [items, setItems] = useState<SafetyChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SafetyChecklistItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<SafetyChecklistItem | null>(null)
  const [defaultItemsDialogOpen, setDefaultItemsDialogOpen] = useState(false)

  // Load checklist items
  const loadItems = async () => {
    setLoading(true)
    const result = await getAllSafetyChecklistItems()
    if (result.ok) {
      setItems(result.data)
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleItemAdded = () => {
    setAddDialogOpen(false)
    loadItems()
  }

  const handleItemUpdated = () => {
    setEditingItem(null)
    loadItems()
  }

  const handleItemDeleted = () => {
    setDeletingItem(null)
    loadItems()
  }

  const handleDefaultItemsEnabled = () => {
    setDefaultItemsDialogOpen(false)
    loadItems()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const activeItems = items.filter((item) => item.isActive)
  const inactiveItems = items.filter((item) => !item.isActive)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {activeItems.length} active items • {inactiveItems.length} inactive items
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDefaultItemsDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Enable Defaults
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No checklist items configured</p>
          <Button onClick={() => setDefaultItemsDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Enable Default Items
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {item.description || '—'}
                  </TableCell>
                  <TableCell>{item.order}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        title="Edit item"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingItem(item)}
                        title="Delete item"
                        disabled={!item.isActive}
                      >
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

      {/* Dialogs */}
      <AddChecklistItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleItemAdded}
      />

      {editingItem && (
        <EditChecklistItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={handleItemUpdated}
        />
      )}

      {deletingItem && (
        <DeleteChecklistItemDialog
          item={deletingItem}
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          onSuccess={handleItemDeleted}
        />
      )}

      <EnableDefaultItemsDialog
        open={defaultItemsDialogOpen}
        onOpenChange={setDefaultItemsDialogOpen}
        onSuccess={handleDefaultItemsEnabled}
        existingItems={items}
      />
    </div>
  )
}
