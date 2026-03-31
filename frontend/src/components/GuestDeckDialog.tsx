'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Layers, Loader2, Plus } from 'lucide-react';

interface Deck {
  _id: string;
  name: string;
  commander: string;
  owner: {
    _id: string;
    name: string;
    nickname?: string;
  };
  isGuestDeck?: boolean;
}

interface GuestDeckDialogProps {
  guestPlayerId: string;
  guestPlayerName: string;
  onGuestDeckCreated: (guestDeck: Deck) => void;
  triggerButton?: React.ReactNode;
}

export function GuestDeckDialog({ 
  guestPlayerId, 
  guestPlayerName, 
  onGuestDeckCreated,
  triggerButton 
}: GuestDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [commander, setCommander] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deckName.trim()) {
      setError('Deck name is required');
      return;
    }

    if (!commander.trim()) {
      setError('Commander is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('You must be logged in');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          guestPlayerId,
          name: deckName.trim(),
          commander: commander.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        onGuestDeckCreated(data.data);
        setDeckName('');
        setCommander('');
        setOpen(false);
      } else {
        setError(data.message || 'Failed to create guest deck');
      }
    } catch (err) {
      setError('An error occurred while creating guest deck');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setDeckName('');
      setCommander('');
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button type="button" variant="ghost" size="sm" className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add deck for {guestPlayerName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="
          p-4 sm:p-6
          w-[calc(100%-32px)]
          max-w-sm
          mx-auto
          rounded-2xl
          sm:rounded-lg
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Add Guest Deck
          </DialogTitle>
          <DialogDescription>
            Create a deck for guest player <span className="font-semibold">{guestPlayerName}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="deckName" className="text-sm font-medium">
                Deck Name
              </label>
              <Input
                id="deckName"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g., Dragon Tribal"
                className={error && !deckName ? 'border-red-500' : ''}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="commander" className="text-sm font-medium">
                Commander
              </label>
              <Input
                id="commander"
                value={commander}
                onChange={(e) => setCommander(e.target.value)}
                placeholder="e.g., The Ur-Dragon"
                className={error && !commander ? 'border-red-500' : ''}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Guest Deck'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
