import { useState, useEffect, useCallback } from 'react';
import { BrainDumpItem, Task } from '@/types';
import { useSyncedStorage } from '@/hooks/useSyncedStorage';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';

export const useBrainDump = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedItems, setCapturedItems] = useSyncedStorage<BrainDumpItem[]>('neurulae-brain-dump-items', []);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { addTask, createSubtask } = useTasks();

  const openPanel = () => setIsOpen(true);
  const closePanel = () => {
      setSelectedItemIds([]); // Clear selection on close
      setIsOpen(false);
  }

  const captureQuickTask = useCallback((text: string) => {
    if (!text.trim()) return;

    const newItem: BrainDumpItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      order: capturedItems.length,
      createdAt: new Date().toISOString(),
      isSelected: false,
    };

    setCapturedItems(prev => [...prev, newItem]);
    
    // Optional: Haptic feedback or sound could go here
  }, [capturedItems, setCapturedItems]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    setSelectedItemIds(capturedItems.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItemIds([]);
  };

  const deleteItem = (id: string) => {
    setCapturedItems(prev => prev.filter(item => item.id !== id));
    setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
  };

  const deleteSelected = () => {
    const count = selectedItemIds.length;
    setCapturedItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
    setSelectedItemIds([]);
    
    toast({
      title: "Items deleted",
      description: `${count} items removed from brain dump.`,
    });
  };

  const bulkAssignCategory = async (categoryId: string) => {
    const itemsToMove = capturedItems.filter(item => selectedItemIds.includes(item.id));
    
    if (itemsToMove.length === 0) return;

    // Convert brain dump items to real tasks
    let successCount = 0;
    for (const item of itemsToMove) {
        try {
            await addTask(item.text, categoryId); 
            successCount++;
        } catch (e) {
            console.error("Failed to convert item to task", e);
        }
    }

    // Remove successfully moved items from brain dump
    if (successCount > 0) {
        setCapturedItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
        setSelectedItemIds([]);
        
        toast({
            title: "Tasks Organized",
            description: `${successCount} items moved to ${categoryId}.`,
        });
    }
  };

  const bulkCreateSubtasks = async (parentId: string) => {
    const itemsToMove = capturedItems.filter(item => selectedItemIds.includes(item.id));
    if (itemsToMove.length === 0) return;

    let successCount = 0;
    for (const item of itemsToMove) {
        try {
            await createSubtask(parentId, item.text);
            successCount++;
        } catch (e) {
            console.error("Failed to convert item to subtask", e);
        }
    }

    if (successCount > 0) {
        setCapturedItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
        setSelectedItemIds([]);
        
        toast({
            title: "Subtasks Created",
            description: `${successCount} items added as subtasks.`,
        });
    }
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
      const result = Array.from(capturedItems);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      
      // Update order property
      const updated = result.map((item, index) => ({...item, order: index}));
      setCapturedItems(updated);
  };

  return {
    isOpen,
    capturedItems,
    selectedItemIds,
    openPanel,
    closePanel,
    captureQuickTask,
    toggleItemSelection,
    selectAll,
    clearSelection,
    deleteItem,
    deleteSelected,
    bulkAssignCategory,
    reorderItems,
    bulkCreateSubtasks
  };
};
