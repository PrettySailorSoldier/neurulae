import { useState, useEffect, useCallback, useRef } from 'react';
import { Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BrainDumpEditor } from './BrainDumpEditor';
import './BrainDumpEditor.css';

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BrainDumpModal({ isOpen, onClose }: BrainDumpModalProps) {
  const [content, setContent] = useLocalStorage('neurulae_brain_dump_content', '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save
  const handleUpdate = useCallback((html: string) => {
    setSaveStatus('saving');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setContent(html);
      setLastSaved(new Date());
      setSaveStatus('saved');
    }, 500);
  }, [setContent]);

  // Format "Saved Xm ago"
  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (diff < 60) return 'Saved just now';
    const mins = Math.floor(diff / 60);
    return `Saved ${mins}m ago`;
  };

  // Update "Saved Xm ago" every 10 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen || !lastSaved) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [isOpen, lastSaved]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Character count
  const charCount = content.replace(/<[^>]*>/g, '').length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="brain-dump-modal-overlay" onClick={onClose} />
      
      {/* Modal */}
      <div className="brain-dump-modal-v2">
        {/* Header */}
        <div className="brain-dump-header">
          <div className="brain-dump-header-title">
            <Brain className="h-5 w-5 text-primary" />
            Brain Dump
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Editor (includes toolbar) */}
        <BrainDumpEditor content={content} onUpdate={handleUpdate} />

        {/* Footer */}
        <div className="brain-dump-footer">
          <span>
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && getLastSavedText()}
            {saveStatus === 'idle' && ''}
          </span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </>
  );
}
