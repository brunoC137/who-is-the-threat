'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, cssUrl, normalizeSearch } from '@/lib/utils';

export interface PickerDeck {
  _id: string;
  name: string;
  commander: string;
  deckImage?: string;
  colorIdentity?: string[];
  archived?: boolean;
  owner?: {
    _id: string;
    name: string;
    nickname?: string;
  } | null;
  /** From GET /api/decks?withUsage=true; absent when loaded without it. */
  gamesPlayed?: number;
  lastPlayedAt?: string | null;
}

interface DeckPickerProps {
  /** Every loaded deck; the picker narrows it to what this player can use. */
  decks: PickerDeck[];
  /** The participant the deck is for. Their own decks come first. */
  playerId: string;
  value: string;
  onChange: (deck: PickerDeck) => void;
  /** Also offer other players' decks, recorded as borrowed by the caller. */
  allowBorrowing?: boolean;
  disabled?: boolean;
  t: (key: string) => string;
  className?: string;
}

type Tab = 'own' | 'others';

/** Below this many decks a "recently played" shortcut would only repeat the list. */
const SUGGEST_FROM = 6;
const SUGGESTED_COUNT = 3;

const MANA_CLASSES: Record<string, string> = {
  W: 'bg-mana-white',
  U: 'bg-mana-blue',
  B: 'bg-mana-black',
  R: 'bg-mana-red',
  G: 'bg-mana-green',
  C: 'bg-mana-colorless',
};

const ownerName = (deck: PickerDeck) =>
  deck.owner ? deck.owner.nickname || deck.owner.name : '';

const byName = (a: PickerDeck, b: PickerDeck) => a.name.localeCompare(b.name);

/**
 * The one way a deck is chosen anywhere in the app. A native select cannot
 * search, show art or rank anything, which stops working once a player owns
 * dozens of decks. This opens a sheet (a bottom sheet on phones, a dialog on
 * larger screens) with the player's recently played decks first, a search over
 * deck and commander names, then everything A–Z. Archived decks are never
 * offered, except the one already selected, so an old game still shows it.
 */
export function DeckPicker({
  decks,
  playerId,
  value,
  onChange,
  allowBorrowing = false,
  disabled = false,
  t,
  className,
}: DeckPickerProps) {
  const [open, setOpen] = useState(false);

  const selected = decks.find(deck => deck._id === value);
  const isBorrowed = Boolean(selected?.owner && selected.owner._id !== playerId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled || !playerId}
        aria-haspopup="dialog"
        className={cn(
          'flex h-12 w-full items-center gap-2.5 rounded-md border border-input bg-background px-2 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        {selected ? (
          <>
            <DeckArt deck={selected} className="h-8 w-8" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium leading-tight">{selected.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {selected.commander}
                {isBorrowed && ` · ${t('deckPicker.borrowedFrom')} ${ownerName(selected)}`}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-muted-foreground">
            {t(playerId ? 'deckPicker.chooseDeck' : 'deckPicker.pickPlayerFirst')}
          </span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <DeckPickerSheet
          decks={decks}
          playerId={playerId}
          value={value}
          allowBorrowing={allowBorrowing}
          onPick={deck => {
            onChange(deck);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

function DeckPickerSheet({
  decks,
  playerId,
  value,
  allowBorrowing,
  onPick,
  onClose,
  t,
}: {
  decks: PickerDeck[];
  playerId: string;
  value: string;
  allowBorrowing: boolean;
  onPick: (deck: PickerDeck) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [query, setQuery] = useState('');
  // Opens on the tab holding the current choice, so a borrowed deck is visible
  const [tab, setTab] = useState<Tab>(() => {
    const current = decks.find(deck => deck._id === value);
    return allowBorrowing && current?.owner && current.owner._id !== playerId ? 'others' : 'own';
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    // The page behind must not scroll along with the list
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    // Straight into typing with a mouse; on a phone the keyboard would cover
    // the recently played decks, which are usually the answer
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const pickable = useMemo(
    () => decks.filter(deck => !deck.archived || deck._id === value),
    [decks, value]
  );

  const ownDecks = useMemo(
    () => pickable.filter(deck => deck.owner?._id === playerId).sort(byName),
    [pickable, playerId]
  );

  const otherDecks = useMemo(
    () =>
      pickable
        .filter(deck => deck.owner && deck.owner._id !== playerId)
        .sort((a, b) => ownerName(a).localeCompare(ownerName(b)) || byName(a, b)),
    [pickable, playerId]
  );

  const list = tab === 'own' ? ownDecks : otherDecks;
  // Accent-insensitive, so "amem" still finds "amém"
  const needle = normalizeSearch(query.trim());

  const matches = needle
    ? list.filter(deck =>
        normalizeSearch(
          `${deck.name} ${deck.commander} ${tab === 'others' ? ownerName(deck) : ''}`
        ).includes(needle)
      )
    : list;

  // What someone played lately is usually what they play next
  const suggested =
    tab === 'own' && !needle && ownDecks.length >= SUGGEST_FROM
      ? ownDecks
          .filter(deck => deck.lastPlayedAt && !deck.archived)
          .sort((a, b) => Date.parse(b.lastPlayedAt!) - Date.parse(a.lastPlayedAt!))
          .slice(0, SUGGESTED_COUNT)
      : [];

  const renderRow = (deck: PickerDeck) => (
    <DeckRow
      key={deck._id}
      deck={deck}
      selected={deck._id === value}
      showOwner={tab === 'others'}
      onPick={onPick}
      t={t}
    />
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('deckPicker.title')}
        className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="shrink-0 space-y-2 border-b border-border/50 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">{t('deckPicker.title')}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-my-2 -mr-2 h-11 w-11"
              onClick={onClose}
              aria-label={t('actions.close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {allowBorrowing && (
            <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(['own', 'others'] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'h-9 rounded-md text-sm font-medium transition-colors',
                    tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  {t(key === 'own' ? 'deckPicker.ownDecks' : 'deckPicker.borrowDeck')}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('deckPicker.search')}
              aria-label={t('deckPicker.search')}
              className="pl-9"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {list.length === 0 ? (
            <EmptyState text={t(tab === 'own' ? 'deckPicker.noDecks' : 'deckPicker.noOtherDecks')} />
          ) : matches.length === 0 ? (
            <EmptyState text={t('deckPicker.noResults')} />
          ) : (
            <>
              {suggested.length > 0 && (
                <DeckSection title={t('deckPicker.recentlyPlayed')}>
                  {suggested.map(renderRow)}
                </DeckSection>
              )}
              <DeckSection title={suggested.length > 0 ? t('deckPicker.allDecks') : undefined}>
                {matches.map(renderRow)}
              </DeckSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-2 py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function DeckSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-2 last:mb-0">
      {title && (
        <h3 className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

function DeckRow({
  deck,
  selected,
  showOwner,
  onPick,
  t,
}: {
  deck: PickerDeck;
  selected: boolean;
  showOwner: boolean;
  onPick: (deck: PickerDeck) => void;
  t: (key: string) => string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(deck)}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60',
          selected && 'bg-primary/10 ring-1 ring-primary/40'
        )}
      >
        <DeckArt deck={deck} className="h-10 w-10" />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{deck.name}</span>
            {deck.archived && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t('decks.archived')}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {showOwner && `${ownerName(deck)} · `}
            {deck.commander}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          <ColorPips colors={deck.colorIdentity} />
          {deck.gamesPlayed !== undefined && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {deck.gamesPlayed} {t(deck.gamesPlayed === 1 ? 'deckPicker.game' : 'deckPicker.games')}
            </span>
          )}
        </span>

        {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      </button>
    </li>
  );
}

/** The deck's art as a thumbnail, or its commander's initial when it has none. */
function DeckArt({ deck, className }: { deck: PickerDeck; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary/25 to-accent/25 bg-cover bg-center text-xs font-bold text-foreground/70',
        className
      )}
      style={deck.deckImage ? { backgroundImage: cssUrl(deck.deckImage) } : undefined}
    >
      {!deck.deckImage && deck.commander.charAt(0).toUpperCase()}
    </span>
  );
}

function ColorPips({ colors }: { colors?: string[] }) {
  if (!colors?.length) return null;

  return (
    <span className="flex gap-0.5">
      {colors.map(color => (
        <span
          key={color}
          title={color}
          className={cn('h-2.5 w-2.5 rounded-full ring-1 ring-black/30', MANA_CLASSES[color] ?? 'bg-muted-foreground')}
        />
      ))}
    </span>
  );
}
