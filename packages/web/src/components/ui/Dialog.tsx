import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'w-full max-w-md rounded-xl border border-neutral-200 bg-white p-0 shadow-lg backdrop:bg-black/50',
        className,
      )}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2
              id="dialog-title"
              className="text-lg font-semibold text-neutral-900"
            >
              {title}
            </h2>
            {description && (
              <p
                id="dialog-description"
                className="mt-1 text-sm text-neutral-500"
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
