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
          {/* Backdrop - Blurred overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closePanel}
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Centered Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 flex flex-col w-[520px] max-w-[90vw] h-[70vh] max-h-[600px]"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              // Glassmorphic effect
              background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              // Multi-layer floating shadow
              boxShadow: `
                0 2px 4px rgba(0, 0, 0, 0.1),
                0 8px 16px rgba(0, 0, 0, 0.15),
                0 24px 48px rgba(0, 0, 0, 0.25),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05)
              `,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">⚡</span>
                <div>
                  <h2 className="text-lg font-semibold text-white/95">
                      Brain Dump
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                      {capturedItems.length} items captured
                  </p>
                </div>
              </div>
              <button 
                onClick={closePanel} 
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Capture Input */}
            <div className="p-5 pb-3 shrink-0 border-b border-white/5">
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What's on your mind? (Press Enter to capture)"
                        className="min-h-[100px] resize-none text-[15px] leading-relaxed bg-white/[0.03] border-2 border-white/10 focus:border-primary/60 focus:bg-white/[0.05] rounded-xl p-4 placeholder:text-white/40 placeholder:italic transition-all"
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                        }}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-white/40 flex items-center gap-1">
                        {inputText.length > 0 && <span>Press ↵ to add</span>}
                    </div>
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-5 pt-3">
                <div className="space-y-2 pb-20">
                   <AnimatePresence initial={false} mode='popLayout'>
                        {capturedItems.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="text-center py-16 px-6"
                            >
                                <div className="text-5xl mb-5 animate-bounce">✨</div>
                                <h3 className="text-xl font-semibold text-white/90 mb-2">Ready to capture</h3>
                                <p className="text-sm text-white/50 max-w-[280px] mx-auto leading-relaxed">
                                    Your thoughts are precious—let's keep them safe here.
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
