import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BrainDumpItem } from './BrainDumpItem';
import { useBrainDump } from '@/hooks/useBrainDump';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, FolderInput } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BulkActionsBar } from './BulkActionsBar';

export const BrainDumpPanel = ({ 
  isOpen, 
  closePanel,
  capturedItems,
  selectedItemIds,
  captureQuickTask,
  toggleItemSelection,
  deleteItem,
  clearSelection,
  deleteSelected,
  bulkAssignCategory,
  bulkCreateSubtasks
}: ReturnType<typeof useBrainDump>) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        captureQuickTask(inputText);
        setInputText('');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:bg-background/40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full sm:w-[450px]",
              "bg-gradient-to-b from-background/95 via-background/90 to-background/95",
              "border-l border-border/50 shadow-2xl backdrop-blur-xl flex flex-col"
            )}
            style={{ 
                backgroundColor: 'rgba(20, 20, 30, 0.95)' 
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 animate-holographic">
                    Brain Dump
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {capturedItems.length} items captured
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closePanel} className="rounded-full hover:bg-white/10 hover:text-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Capture Input */}
            <div className="p-6 pb-2 shrink-0">
                <div className="relative group">
                    <Textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What's on your mind? (Press Enter to capture)"
                        className="min-h-[100px] resize-none text-base border-white/20 bg-white/5 focus-visible:ring-primary/50 focus-visible:bg-white/10 transition-all rounded-xl shadow-inner placeholder:text-muted-foreground/50"
                    />
                    <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground/60">
                        {inputText.length > 0 && <span>Press ↵ to add</span>}
                    </div>
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-6 pt-2">
                <div className="space-y-2 pb-24">
                   <AnimatePresence initial={false} mode='popLayout'>
                        {capturedItems.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-12 px-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <FolderInput className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-lg font-medium text-muted-foreground/80">All clear!</h3>
                                <p className="text-sm text-muted-foreground/50 mt-1 max-w-[200px] mx-auto">
                                    Your mind is empty. Use the box above to capture thoughts as they come.
                                </p>
                            </motion.div>
                        ) : (
                            capturedItems.map((item, idx) => (
                                <BrainDumpItem
                                    key={item.id}
                                    item={item}
                                    index={idx}
                                    isSelected={selectedItemIds.includes(item.id)}
                                    onToggleSelect={toggleItemSelection}
                                    onDelete={deleteItem}
                                />
                            ))
                        )}
                   </AnimatePresence>
                </div>
            </ScrollArea>

            {/* Bulk Actions Bar (Sticky Bottom) */}
            <BulkActionsBar 
                selectedCount={selectedItemIds.length}
                onClearSelection={clearSelection}
                onAssignCategory={bulkAssignCategory}
                onDelete={deleteSelected}
                onCreateSubtasks={bulkCreateSubtasks}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
