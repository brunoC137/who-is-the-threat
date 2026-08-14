'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommentaryEntry } from './types';

interface NotesSheetProps {
  commentary: CommentaryEntry[];
  notes: string;
  onAddCommentary: (text: string) => void;
  onRemoveCommentary: (index: number) => void;
  onNotesChange: (notes: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export function NotesSheet({
  commentary,
  notes,
  onAddCommentary,
  onRemoveCommentary,
  onNotesChange,
  onClose,
  t,
}: NotesSheetProps) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    onAddCommentary(draft);
    setDraft('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border/50 p-3">
          <h2 className="text-sm font-bold">{t('currentGame.gameCommentary')}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label={t('actions.close')}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {commentary.length > 0 ? (
            <ul className="space-y-1.5">
              {commentary.map((entry, index) => (
                <li
                  key={`${entry.timestamp}-${index}`}
                  className="flex items-start gap-2 rounded-lg bg-background/60 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm">{entry.text}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    onClick={() => onRemoveCommentary(index)}
                    aria-label={t('actions.remove')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {t('currentGame.noCommentary')}
            </p>
          )}

          <div className="space-y-2 border-t border-border/50 pt-3">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder={t('currentGame.commentaryPlaceholder')}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-md border border-input bg-background p-2 text-sm"
            />
            <Button size="sm" className="w-full" onClick={submit} disabled={!draft.trim()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t('currentGame.addCommentary')}
            </Button>
          </div>

          <div className="space-y-2 border-t border-border/50 pt-3">
            <label className="text-sm font-medium" htmlFor="game-notes">
              {t('currentGame.gameNotes')}
            </label>
            <textarea
              id="game-notes"
              value={notes}
              onChange={event => onNotesChange(event.target.value)}
              placeholder={t('currentGame.notesPlaceholder')}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-md border border-input bg-background p-2 text-sm"
            />
            <p className="text-right text-[10px] text-muted-foreground">{notes.length}/500</p>
          </div>
        </div>
      </div>
    </div>
  );
}
