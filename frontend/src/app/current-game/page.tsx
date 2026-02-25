'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Swords, Plus, Minus, RotateCcw, Heart, Skull, X, Check,
  Dice6, Pause, Play, ArrowLeft, Save, Loader2, Users,
  Crown, FlaskConical, Shield, Timer, StickyNote, ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerOption {
  _id: string;
  name: string;
  nickname?: string;
  profileImage?: string;
}

interface DeckOption {
  _id: string;
  name: string;
  commander: string;
  deckImage?: string;
  colorIdentity?: string[];
  owner: { _id: string; name: string; nickname?: string };
}

interface PlayerGameState {
  slotIndex: number;
  playerId: string;
  deckId: string;
  displayName: string;
  deckName: string;
  commanderName: string;
  deckImage?: string;
  colorIdentity?: string[];
  // Live tracking
  life: number;
  poison: number;
  commanderDamage: number[]; // commanderDamage[fromSlot] = damage received from that slot
  // Elimination
  eliminated: boolean;
  eliminationOrder?: number;   // 1 = first to die (last place)
  eliminatedBySlot?: number;
  placement?: number;
}

type GamePhase = 'setup' | 'playing' | 'ended';

interface GameState {
  phase: GamePhase;
  playerCount: number;
  players: PlayerGameState[];
  startTime?: number;
  pausedAt?: number;
  totalPausedMs: number;
  firstPlayerSlot?: number;
  notes: string;
  eliminationCount: number;
}

type HistoryEntry =
  | { type: 'life'; slot: number; prev: number }
  | { type: 'poison'; slot: number; prev: number }
  | { type: 'cmdDmg'; fromSlot: number; toSlot: number; prev: number }
  | { type: 'eliminate'; slot: number; prevState: PlayerGameState };

/** How the deck artwork is displayed in the panel background. */
type BgStyle = 'blurred' | 'scrolling' | 'centered';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LIFE = 40;
const POISON_LIMIT = 10;
const CMD_DMG_LIMIT = 21;
const LS_KEY = 'currentGame_state';
const LS_SETUP_KEY = 'currentGame_setup';

// MTG color → gradient classes
const COLOR_THEMES: Record<string, { bg: string; text: string; accent: string }> = {
  W:  { bg: 'from-amber-50 via-yellow-100 to-amber-50',  text: 'text-amber-900', accent: 'bg-amber-300' },
  U:  { bg: 'from-blue-700 via-blue-600 to-blue-800',    text: 'text-blue-50',   accent: 'bg-blue-400' },
  B:  { bg: 'from-gray-900 via-slate-800 to-gray-900',   text: 'text-gray-100',  accent: 'bg-gray-600' },
  R:  { bg: 'from-red-700 via-orange-600 to-red-800',    text: 'text-orange-50', accent: 'bg-red-400' },
  G:  { bg: 'from-green-700 via-emerald-600 to-green-800', text: 'text-green-50', accent: 'bg-green-400' },
  WU: { bg: 'from-blue-400 via-sky-200 to-amber-100',   text: 'text-blue-900',  accent: 'bg-sky-400' },
  WB: { bg: 'from-purple-700 via-gray-700 to-gray-900', text: 'text-purple-100', accent: 'bg-purple-500' },
  WR: { bg: 'from-red-500 via-orange-300 to-amber-200', text: 'text-red-900',   accent: 'bg-red-400' },
  WG: { bg: 'from-green-600 via-lime-300 to-amber-100', text: 'text-green-900', accent: 'bg-green-400' },
  UB: { bg: 'from-blue-900 via-indigo-800 to-gray-900', text: 'text-blue-100',  accent: 'bg-indigo-500' },
  UR: { bg: 'from-red-500 via-violet-500 to-blue-600',  text: 'text-red-50',    accent: 'bg-violet-500' },
  UG: { bg: 'from-green-600 via-teal-400 to-blue-600',  text: 'text-teal-50',   accent: 'bg-teal-400' },
  BR: { bg: 'from-red-900 via-red-700 to-gray-900',     text: 'text-red-100',   accent: 'bg-red-600' },
  BG: { bg: 'from-green-900 via-emerald-700 to-gray-900', text: 'text-green-100', accent: 'bg-emerald-500' },
  RG: { bg: 'from-green-700 via-yellow-500 to-red-700', text: 'text-yellow-50', accent: 'bg-yellow-400' },
  '': { bg: 'from-gray-700 via-gray-600 to-gray-800',   text: 'text-gray-100',  accent: 'bg-gray-500' },
};

function getColorTheme(colorIdentity?: string[]) {
  if (!colorIdentity || colorIdentity.length === 0) return COLOR_THEMES[''];
  if (colorIdentity.length === 1) return COLOR_THEMES[colorIdentity[0]] ?? COLOR_THEMES[''];
  const key = colorIdentity.slice(0, 2).sort().join('');
  return COLOR_THEMES[key] ?? COLOR_THEMES[''];
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

interface SlotGridConfig {
  slot: number;
  rotation: 0 | 90 | 180 | 270;
  colSpan?: number; // CSS grid-column span
}

/**
 * Returns a fixed CSS-grid layout config for the playing phase.
 *
 * For 4 players the layout is table-centric:
 *   ┌──────────────┬──────────────┐
 *   │  slot 2 TOP  │ slot 3 RIGHT │
 *   │   (180°)     │   (90°)      │
 *   ├──────────────┼──────────────┤
 *   │ slot 0 LEFT  │ slot 1 BOTTOM│
 *   │   (270°)     │   (0°)       │
 *   └──────────────┴──────────────┘
 *
 * Each quadrant's content is rotated so it faces the player
 * sitting at that side of the table — the device orientation
 * (portrait/landscape) is irrelevant.
 */
function getGridLayout(count: number): { cols: number; slots: SlotGridConfig[] } {
  switch (count) {
    case 3:
      return {
        cols: 2,
        slots: [
          { slot: 1, rotation: 180 },
          { slot: 2, rotation: 180 },
          { slot: 0, rotation: 0, colSpan: 2 },
        ],
      };
    case 4:
      return {
        cols: 2,
        slots: [
          { slot: 2, rotation: 90 }, // top player
          { slot: 3, rotation: 270 }, // right player
          { slot: 0, rotation: 90  }, // left player
          { slot: 1, rotation: 270   }, // bottom player
        ],
      };
    case 5:
      return {
        cols: 2,
        slots: [
          { slot: 2, rotation: 90 },   // top-left (same as 4-player)
          { slot: 3, rotation: 270 },  // top-right (same as 4-player)
          { slot: 0, rotation: 90 },   // middle-left (same as 4-player)
          { slot: 1, rotation: 270 },  // middle-right (same as 4-player)
          { slot: 4, rotation: 0, colSpan: 2 }, // bottom center
        ],
      };
    case 6:
      return {
        cols: 2,
        slots: [
          { slot: 0, rotation: 90 },   // top-left (faces left-side player)
          { slot: 1, rotation: 270 },  // top-right (faces right-side player)
          { slot: 2, rotation: 90 },   // middle-left
          { slot: 3, rotation: 270 },  // middle-right
          { slot: 4, rotation: 90 },   // bottom-left
          { slot: 5, rotation: 270 },  // bottom-right
        ],
      };
    default:
      return { cols: 2, slots: [] };
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: any): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'INIT_GAME':
      return { ...action.state };
    case 'LIFE': {
      const players = [...state.players];
      players[action.slot] = { ...players[action.slot], life: action.value };
      return { ...state, players };
    }
    case 'POISON': {
      const players = [...state.players];
      players[action.slot] = { ...players[action.slot], poison: action.value };
      return { ...state, players };
    }
    case 'CMD_DMG': {
      const players = [...state.players];
      const p = { ...players[action.toSlot] };
      const cmdDmg = [...p.commanderDamage];
      cmdDmg[action.fromSlot] = action.value;
      p.commanderDamage = cmdDmg;
      players[action.toSlot] = p;
      return { ...state, players };
    }
    case 'ELIMINATE': {
      const players = [...state.players];
      const newCount = state.eliminationCount + 1;
      players[action.slot] = {
        ...players[action.slot],
        eliminated: true,
        eliminationOrder: newCount,
        eliminatedBySlot: action.bySlot,
      };
      return { ...state, players, eliminationCount: newCount };
    }
    case 'PAUSE':
      return { ...state, pausedAt: Date.now() };
    case 'RESUME': {
      const extra = state.pausedAt ? Date.now() - state.pausedAt : 0;
      return { ...state, pausedAt: undefined, totalPausedMs: state.totalPausedMs + extra };
    }
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'END_GAME': {
      // Calculate placements: winner = last survivor (highest placement = 1)
      // Eliminated players get placements from last to 2nd in elimination order
      const totalPlayers = state.players.length;
      const players = state.players.map(p => {
        if (!p.eliminated) {
          return { ...p, placement: 1 }; // winner
        }
        // placement = totalPlayers - eliminationOrder + 1
        // first eliminated gets last place (totalPlayers), etc.
        const placement = totalPlayers - (p.eliminationOrder ?? 0) + 1;
        return { ...p, placement };
      });
      return { ...state, phase: 'ended', players };
    }
    default:
      return state;
  }
}

const initialState: GameState = {
  phase: 'setup',
  playerCount: 4,
  players: [],
  totalPausedMs: 0,
  notes: '',
  eliminationCount: 0,
};

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function CurrentGamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerOption[]>([]);
  const [allDecks, setAllDecks] = useState<DeckOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Slot configs during setup
  const [slotConfigs, setSlotConfigs] = useState<Array<{ playerId: string; deckId: string }>>([
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' },
  ]);

  // UI state for modals
  const [activeModal, setActiveModal] = useState<
    | { type: 'cmdDmg'; slot: number }
    | { type: 'poison'; slot: number }
    | { type: 'eliminate'; slot: number; reason: string }
    | { type: 'rollResult'; slot: number }
    | { type: 'playerMenu'; slot: number }
    | { type: 'endConfirm' }
    | null
  >(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rolling animation
  const [rolling, setRolling] = useState(false);

  // Per-slot background style preference (persists while game is in progress)
  const [bgStyles, setBgStyles] = useState<Record<number, BgStyle>>({});

  // ── Fetch players & decks ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [pRes, dRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/players`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (pRes.ok && dRes.ok) {
          const pData = await pRes.json();
          const dData = await dRes.json();
          setAllPlayers(pData.data ?? pData);
          setAllDecks(dData.data ?? dData);
        }
      } catch {
        // ignore
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  // ── Restore saved game from localStorage ────────────────────────────────────
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        if (parsed.phase === 'playing') {
          dispatch({ type: 'INIT_GAME', state: parsed });
        }
      }
    } catch {
      // ignore
    } finally {
      hasRestoredRef.current = true;
    }
  }, []);

  // ── Persist game state ───────────────────────────────────────────────────────
  useEffect(() => {
    // Don't remove key until restoration attempt has happened
    if (!hasRestoredRef.current) return;
    if (state.phase === 'playing') {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } else if (state.phase === 'ended') {
      localStorage.removeItem(LS_KEY);
    }
    // Don't remove on 'setup' - allows restoration on next page load
  }, [state]);

  // ── Timer logic ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === 'playing' && !state.pausedAt && state.startTime) {
      timerRef.current = setInterval(() => {
        const ms = Date.now() - (state.startTime ?? 0) - state.totalPausedMs;
        setElapsedSeconds(Math.floor(ms / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.pausedAt, state.startTime, state.totalPausedMs]);

  // ── Auto-detect eliminations ─────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'playing') return;
    for (const p of state.players) {
      if (p.eliminated) continue;
      const totalCmdDmg = p.commanderDamage.reduce((a, b) => a + b, 0);
      const maxCmdDmgFromOne = Math.max(...p.commanderDamage, 0);
      if (p.life <= 0) {
        setActiveModal({ type: 'eliminate', slot: p.slotIndex, reason: 'life reached 0' });
        return;
      }
      if (p.poison >= POISON_LIMIT) {
        setActiveModal({ type: 'eliminate', slot: p.slotIndex, reason: `${p.poison} poison counters` });
        return;
      }
      if (maxCmdDmgFromOne >= CMD_DMG_LIMIT) {
        const fromSlot = p.commanderDamage.indexOf(maxCmdDmgFromOne);
        const fromName = state.players[fromSlot]?.displayName ?? 'Unknown';
        setActiveModal({ type: 'eliminate', slot: p.slotIndex, reason: `${maxCmdDmgFromOne} commander damage from ${fromName}` });
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players]);

  // ── Auto-end game when only 1 remains ─────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const alive = state.players.filter(p => !p.eliminated).length;
    if (alive === 1 && state.players.length > 1) {
      dispatch({ type: 'END_GAME' });
    }
  }, [state.players, state.phase]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getPlayerDecks = (playerId: string) =>
    allDecks.filter(d => d.owner._id === playerId);

  const updateSlotConfig = (index: number, field: 'playerId' | 'deckId', value: string) => {
    const next = [...slotConfigs];
    next[index] = { ...next[index], [field]: value };
    if (field === 'playerId') next[index].deckId = '';
    setSlotConfigs(next);
  };

  // ── Start Game ────────────────────────────────────────────────────────────────

  const startGame = () => {
    const configs = slotConfigs.slice(0, state.playerCount);
    if (configs.some(c => !c.playerId || !c.deckId)) return;

    const players: PlayerGameState[] = configs.map((c, i) => {
      const pData = allPlayers.find(p => p._id === c.playerId)!;
      const dData = allDecks.find(d => d._id === c.deckId)!;
      return {
        slotIndex: i,
        playerId: c.playerId,
        deckId: c.deckId,
        displayName: pData.nickname ?? pData.name,
        deckName: dData.name,
        commanderName: dData.commander,
        deckImage: dData.deckImage,
        colorIdentity: dData.colorIdentity,
        life: DEFAULT_LIFE,
        poison: 0,
        commanderDamage: Array(configs.length).fill(0),
        eliminated: false,
      };
    });

    dispatch({
      type: 'INIT_GAME',
      state: {
        phase: 'playing',
        playerCount: state.playerCount,
        players,
        startTime: Date.now(),
        totalPausedMs: 0,
        notes: '',
        eliminationCount: 0,
      },
    });
  };

  // ── Roll for First Player ─────────────────────────────────────────────────────

  const rollForFirst = () => {
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * state.playerCount);
      dispatch({ type: 'INIT_GAME', state: { ...state, firstPlayerSlot: rand } });
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setRolling(false);
        const winner = Math.floor(Math.random() * state.playerCount);
        dispatch({ type: 'INIT_GAME', state: { ...state, firstPlayerSlot: winner } });
        setActiveModal({ type: 'rollResult', slot: winner });
      }
    }, 80);
  };

  // ── Life / Poison / Cmd Damage adjustments ────────────────────────────────────

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(h => [...h.slice(-49), entry]); // keep last 50 actions
  }, []);

  const adjustLife = (slot: number, delta: number) => {
    const p = state.players[slot];
    if (p.eliminated) return;
    pushHistory({ type: 'life', slot, prev: p.life });
    dispatch({ type: 'LIFE', slot, value: p.life + delta });
  };

  const adjustPoison = (slot: number, delta: number) => {
    const p = state.players[slot];
    if (p.eliminated) return;
    pushHistory({ type: 'poison', slot, prev: p.poison });
    dispatch({ type: 'POISON', slot, value: Math.max(0, p.poison + delta) });
  };

  const adjustCmdDmg = (fromSlot: number, toSlot: number, delta: number) => {
    const p = state.players[toSlot];
    if (p.eliminated) return;
    const prev = p.commanderDamage[fromSlot] ?? 0;
    pushHistory({ type: 'cmdDmg', fromSlot, toSlot, prev });
    dispatch({ type: 'CMD_DMG', fromSlot, toSlot, value: Math.max(0, prev + delta) });
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    switch (last.type) {
      case 'life':
        dispatch({ type: 'LIFE', slot: last.slot, value: last.prev });
        break;
      case 'poison':
        dispatch({ type: 'POISON', slot: last.slot, value: last.prev });
        break;
      case 'cmdDmg':
        dispatch({ type: 'CMD_DMG', fromSlot: last.fromSlot, toSlot: last.toSlot, value: last.prev });
        break;
      case 'eliminate': {
        const players = [...state.players];
        players[last.slot] = last.prevState;
        dispatch({
          type: 'INIT_GAME',
          state: { ...state, players, eliminationCount: Math.max(0, state.eliminationCount - 1) },
        });
        break;
      }
    }
  };

  // ── Eliminate player ──────────────────────────────────────────────────────────

  const confirmElimination = (slot: number, bySlot: number | undefined) => {
    const p = state.players[slot];
    pushHistory({ type: 'eliminate', slot, prevState: { ...p } });
    dispatch({ type: 'ELIMINATE', slot, bySlot });
    setActiveModal(null);
  };

  // ── Save Game ─────────────────────────────────────────────────────────────────

  const saveGame = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const durationMs = state.startTime
        ? Date.now() - state.startTime - state.totalPausedMs
        : 0;
      const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

      const playersPayload = state.players.map(p => ({
        player: p.playerId,
        deck: p.deckId,
        placement: p.placement ?? state.playerCount,
        eliminatedBy: p.eliminatedBySlot !== undefined
          ? state.players[p.eliminatedBySlot]?.playerId
          : undefined,
      }));

      const body = {
        players: playersPayload,
        durationMinutes,
        notes: state.notes || undefined,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        localStorage.removeItem(LS_KEY);
        router.push('/games');
      } else {
        const err = await res.json();
        setSaveError(err.message ?? 'Failed to save game');
      }
    } catch {
      setSaveError('An error occurred while saving the game');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Swords className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Please log in to use Battle Mode.</p>
        <Link href="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  // ── Setup Phase ───────────────────────────────────────────────────────────────

  if (state.phase === 'setup') {
    const configs = slotConfigs.slice(0, state.playerCount);
    const allConfigured = configs.every(c => c.playerId && c.deckId);

    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Swords className="h-7 w-7 text-primary" />
              Battle Mode
            </h1>
            <p className="text-muted-foreground">Live game tracker — replaces external apps</p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player count */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Number of Players
              </h2>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      const next = [...slotConfigs];
                      while (next.length < n) next.push({ playerId: '', deckId: '' });
                      setSlotConfigs(next);
                      dispatch({ type: 'INIT_GAME', state: { ...state, playerCount: n } });
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                      state.playerCount === n
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Player slots */}
            {configs.map((cfg, i) => {
              const playerDecks = cfg.playerId ? getPlayerDecks(cfg.playerId) : [];

              // For 4-player table-centric layout show cardinal seat positions.
              // Slot order matches getGridLayout(4): 0=Left, 1=Bottom, 2=Top, 3=Right.
              const positions4p = ['← Left (270°)', '↓ Bottom (0°)', '↑ Top (180°)', '→ Right (90°)'];
              const positionsFallback = ['Bottom-Left', 'Bottom-Right', 'Top-Left', 'Top-Right', 'Top-Center', 'Bottom-Center'];
              const position = state.playerCount === 4
                ? (positions4p[i] ?? `Slot ${i + 1}`)
                : (positionsFallback[i] ?? `Slot ${i + 1}`);

              // Arrow showing which way the panel faces (↑ = away from viewer)
              const rotationArrow = state.playerCount === 4
                ? ['↺', '↓', '↑', '↻'][i] ?? ''
                : (i < Math.ceil(state.playerCount / 2) ? '↓' : '↑');
              return (
                <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {rotationArrow} Slot {i + 1} — {position}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Player</label>
                      <select
                        value={cfg.playerId}
                        onChange={e => updateSlotConfig(i, 'playerId', e.target.value)}
                        className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                      >
                        <option value="">Select player…</option>
                        {allPlayers.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.nickname ?? p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Deck</label>
                      <select
                        value={cfg.deckId}
                        onChange={e => updateSlotConfig(i, 'deckId', e.target.value)}
                        disabled={!cfg.playerId || playerDecks.length === 0}
                        className="w-full p-2 rounded-lg border border-input bg-background text-sm disabled:opacity-50"
                      >
                        <option value="">Select deck…</option>
                        {playerDecks.map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {cfg.playerId && playerDecks.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">No decks registered</p>
                      )}
                    </div>
                  </div>
                  {/* Preview */}
                  {cfg.deckId && (() => {
                    const deck = allDecks.find(d => d._id === cfg.deckId);
                    if (!deck) return null;
                    const theme = getColorTheme(deck.colorIdentity);
                    return (
                      <div className={`rounded-lg p-2 bg-gradient-to-r ${theme.bg} flex items-center gap-2`}>
                        {deck.deckImage && (
                          <img src={deck.deckImage} alt={deck.name} className="w-8 h-8 rounded object-cover" />
                        )}
                        <div>
                          <p className={`text-xs font-bold ${theme.text}`}>{deck.name}</p>
                          <p className={`text-xs opacity-80 ${theme.text}`}>{deck.commander}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Start button */}
            <Button
              onClick={startGame}
              disabled={!allConfigured}
              className="w-full py-6 text-xl font-bold shadow-glow-md"
              size="lg"
            >
              <Swords className="h-6 w-6 mr-3" />
              Start Battle
            </Button>

            {!allConfigured && (
              <p className="text-center text-sm text-muted-foreground">
                Configure all {state.playerCount} players to start
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── End Phase ─────────────────────────────────────────────────────────────────

  if (state.phase === 'ended') {
    const sortedPlayers = [...state.players].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));

    return (
      <div className="fixed inset-0 z-[60] bg-background overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">Game Over!</h1>
            <p className="text-muted-foreground">Duration: {formatTime(elapsedSeconds)}</p>
          </div>

          {/* Placements */}
          <div className="space-y-3 mb-6">
            {sortedPlayers.map((p, idx) => {
              const theme = getColorTheme(p.colorIdentity);
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
              const killer = p.eliminatedBySlot !== undefined
                ? state.players[p.eliminatedBySlot]?.displayName
                : undefined;
              return (
                <div
                  key={p.slotIndex}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${theme.bg} border border-white/10`}
                >
                  <span className="text-3xl">{medals[idx] ?? `${idx + 1}`}</span>
                  <div className="flex-1">
                    <p className={`font-bold ${theme.text}`}>{p.displayName}</p>
                    <p className={`text-sm opacity-75 ${theme.text}`}>{p.deckName} · {p.commanderName}</p>
                    {killer && (
                      <p className={`text-xs opacity-60 ${theme.text}`}>Eliminated by {killer}</p>
                    )}
                  </div>
                  <div className={`text-right ${theme.text}`}>
                    <p className="text-sm font-mono">{p.life} hp</p>
                    {p.poison > 0 && <p className="text-xs opacity-70">☠ {p.poison}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4" /> Game Notes (optional)
            </label>
            <textarea
              value={state.notes}
              onChange={e => dispatch({ type: 'SET_NOTES', notes: e.target.value })}
              placeholder="Memorable moments, highlights..."
              rows={3}
              className="w-full p-3 rounded-lg border border-input bg-background text-sm resize-none"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-500 mb-4 text-center">{saveError}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                dispatch({ type: 'INIT_GAME', state: initialState });
                setHistory([]);
              }}
            >
              New Game
            </Button>
            <Button
              className="flex-1 shadow-glow-sm"
              onClick={saveGame}
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save & Close</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing Phase ─────────────────────────────────────────────────────────────

  const { cols, slots } = getGridLayout(state.playerCount);
  const isPaused = !!state.pausedAt;

  return (
    <div className="fixed inset-0 z-[60] bg-black select-none touch-none overflow-hidden">

      {/* ── Top Status Bar ────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal({ type: 'endConfirm' })}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="text-white/40 text-xs">|</span>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="text-white/60 hover:text-white disabled:opacity-30 transition-colors p-1"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5">
          <Timer className="h-3 w-3 text-white/50" />
          <span className="text-white/80 text-sm font-mono tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => isPaused ? dispatch({ type: 'RESUME' }) : dispatch({ type: 'PAUSE' })}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          {/* Roll for first */}
          <button
            onClick={rollForFirst}
            disabled={rolling}
            className="text-white/60 hover:text-white disabled:opacity-30 transition-colors p-1"
          >
            <Dice6 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Game Grid (fixed CSS grid, table-centric — no responsive reflow) ──── */}
      {/* Ken Burns background-position animation (no transform conflict) */}
      <style>{`
        @keyframes kenburns-bg {
          0%   { background-position: 20% 20%; }
          33%  { background-position: 80% 20%; }
          66%  { background-position: 80% 80%; }
          100% { background-position: 20% 20%; }
        }
      `}</style>
      <div
        className="absolute inset-0 pt-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil(slots.length / cols)}, 1fr)`,
        }}
      >
        {slots.map(({ slot, rotation, colSpan }) => (
          <PlayerPanelView
            key={slot}
            player={state.players[slot]}
            allPlayers={state.players}
            rotation={rotation}
            isFirst={state.firstPlayerSlot === slot}
            colSpan={colSpan}
            bgStyle={bgStyles[slot] ?? 'blurred'}
            onAdjustLife={delta => adjustLife(slot, delta)}
            onOpenCmdDmg={() => setActiveModal({ type: 'cmdDmg', slot })}
            onOpenPoison={() => setActiveModal({ type: 'poison', slot })}
            onOpenPlayerMenu={() => setActiveModal({ type: 'playerMenu', slot })}
          />
        ))}
      </div>

      {/* ── Paused Overlay ────────────────────────────────────────────────────── */}
      {isPaused && (
        <div
          className="absolute inset-0 z-20 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          onClick={() => dispatch({ type: 'RESUME' })}
        >
          <Pause className="h-16 w-16 text-white/50" />
          <p className="text-white/60 text-lg">Tap to resume</p>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {activeModal && (() => {
        // Get rotation for the modal based on the slot
        const getModalRotation = () => {
          if (!activeModal || activeModal.type === 'endConfirm' || activeModal.type === 'rollResult') return 0;
          const slotConfig = slots.find(s => s.slot === activeModal.slot);
          return slotConfig?.rotation ?? 0;
        };
        const modalRotation = getModalRotation();

        return (
          <div
            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setActiveModal(null); }}
          >
            {/* Commander Damage Modal */}
            {activeModal.type === 'cmdDmg' && (() => {
              const target = state.players[activeModal.slot];
              if (!target) return null;
              return (
                <div 
                  className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-4"
                  style={{ transform: `rotate(${modalRotation}deg)` }}
                >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Commander Damage — {target.displayName}
                  </h3>
                  <button onClick={() => setActiveModal(null)}>
                    <X className="h-5 w-5 text-white/50 hover:text-white" />
                  </button>
                </div>
                <div className="space-y-3">
                  {state.players
                    .filter(p => p.slotIndex !== activeModal.slot && !p.eliminated)
                    .map(attacker => {
                      const dmg = target.commanderDamage[attacker.slotIndex] ?? 0;
                      return (
                        <div key={attacker.slotIndex} className="flex items-center gap-3">
                          <span className="text-white/70 text-sm flex-1 truncate">{attacker.displayName}</span>
                          <button
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                            onClick={() => adjustCmdDmg(attacker.slotIndex, activeModal.slot, -1)}
                          >
                            −
                          </button>
                          <span className={`w-10 text-center font-bold tabular-nums ${dmg >= CMD_DMG_LIMIT ? 'text-red-400' : 'text-white'}`}>
                            {dmg}
                          </span>
                          <button
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
                            onClick={() => adjustCmdDmg(attacker.slotIndex, activeModal.slot, 1)}
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                </div>
                <p className="text-xs text-white/30 text-center">
                  {CMD_DMG_LIMIT} from one source = elimination
                </p>
              </div>
            );
          })()}

          {/* Poison Modal */}
          {activeModal.type === 'poison' && (() => {
            const p = state.players[activeModal.slot];
            if (!p) return null;
            return (
              <div 
                className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-xs space-y-5"
                style={{ transform: `rotate(${modalRotation}deg)` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-green-400" />
                    Poison — {p.displayName}
                  </h3>
                  <button onClick={() => setActiveModal(null)}>
                    <X className="h-5 w-5 text-white/50 hover:text-white" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button
                    className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 text-white text-2xl font-bold flex items-center justify-center"
                    onClick={() => adjustPoison(activeModal.slot, -1)}
                  >
                    −
                  </button>
                  <span className={`text-5xl font-bold tabular-nums ${p.poison >= POISON_LIMIT ? 'text-red-400' : 'text-green-400'}`}>
                    {p.poison}
                  </span>
                  <button
                    className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 text-white text-2xl font-bold flex items-center justify-center"
                    onClick={() => adjustPoison(activeModal.slot, 1)}
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full ${i < p.poison ? 'bg-green-500' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/30 text-center">{POISON_LIMIT} poison = elimination</p>
              </div>
            );
          })()}

          {/* Elimination Modal */}
          {activeModal.type === 'eliminate' && (() => {
            const victim = state.players[activeModal.slot];
            if (!victim) return null;
            const opponents = state.players.filter(p => p.slotIndex !== activeModal.slot && !p.eliminated);
            return (
              <div 
                className="bg-gray-900 border border-red-800/50 rounded-2xl p-5 w-full max-w-sm space-y-4"
                style={{ transform: `rotate(${modalRotation}deg)` }}
              >
                <div className="text-center">
                  <Skull className="h-10 w-10 text-red-400 mx-auto mb-2" />
                  <h3 className="font-bold text-white text-lg">{victim.displayName} eliminated!</h3>
                  {activeModal.reason !== 'manual' && (
                    <p className="text-white/50 text-sm mt-1">{activeModal.reason}</p>
                  )}
                </div>
                <p className="text-white/70 text-sm text-center">Who eliminated them?</p>
                <div className="space-y-2">
                  {opponents.map(opp => (
                    <button
                      key={opp.slotIndex}
                      onClick={() => confirmElimination(activeModal.slot, opp.slotIndex)}
                      className="w-full p-3 rounded-xl bg-white/5 hover:bg-red-900/30 border border-white/10 hover:border-red-700/50 text-white text-sm font-medium transition-all"
                    >
                      {opp.displayName}
                    </button>
                  ))}
                  <button
                    onClick={() => confirmElimination(activeModal.slot, undefined)}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm transition-all"
                  >
                    Unknown / Self
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Roll Result Modal */}
          {activeModal.type === 'rollResult' && (() => {
            const winner = state.players[activeModal.slot];
            if (!winner) return null;
            return (
              <div
                className="bg-gray-900 border border-primary/50 rounded-2xl p-6 w-full max-w-xs text-center space-y-4"
                onClick={() => setActiveModal(null)}
              >
                <Dice6 className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <p className="text-white/60 text-sm">First Player</p>
                  <p className="text-white text-2xl font-bold mt-1">{winner.displayName}</p>
                  <p className="text-white/40 text-sm mt-1">{winner.deckName}</p>
                </div>
                <p className="text-white/30 text-xs">Tap to continue</p>
              </div>
            );
          })()}

          {/* Player Menu Modal */}
          {activeModal.type === 'playerMenu' && (() => {
            const p = state.players[activeModal.slot];
            if (!p) return null;
            const currentBgStyle: BgStyle = bgStyles[activeModal.slot] ?? 'blurred';
            const bgOptions: { value: BgStyle; label: string; icon: string }[] = [
              { value: 'blurred',   label: 'Blurred',  icon: '🌫️' },
              { value: 'scrolling', label: 'Panning',  icon: '🎞️' },
              { value: 'centered',  label: 'Centered', icon: '🖼️' },
            ];
            return (
              <div
                className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-5"
                style={{ transform: `rotate(${modalRotation}deg)` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-base leading-tight">{p.displayName}</p>
                    <p className="text-white/40 text-xs mt-0.5 truncate">{p.deckName} · {p.commanderName}</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="shrink-0 mt-0.5">
                    <X className="h-5 w-5 text-white/50 hover:text-white" />
                  </button>
                </div>

                {/* Eliminate action */}
                {!p.eliminated && (
                  <button
                    onClick={() => setActiveModal({ type: 'eliminate', slot: activeModal.slot, reason: 'manual' })}
                    className="w-full p-3 rounded-xl bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 hover:border-red-700/60 text-white text-sm font-medium flex items-center gap-3 transition-all"
                  >
                    <Skull className="h-4 w-4 text-red-400 shrink-0" />
                    Eliminate {p.displayName}
                  </button>
                )}

                {/* Background style picker — only when deck has an image */}
                {p.deckImage && (
                  <div className="space-y-2">
                    <p className="text-white/40 text-[11px] uppercase tracking-widest">Background Style</p>
                    <div className="grid grid-cols-3 gap-2">
                      {bgOptions.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => setBgStyles(prev => ({ ...prev, [activeModal.slot]: value }))}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                            currentBgStyle === value
                              ? 'border-primary bg-primary/20 text-primary'
                              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                          }`}
                        >
                          <span className="text-lg leading-none">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* End Game Confirm */}
          {activeModal.type === 'endConfirm' && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-4">
              <h3 className="font-bold text-white text-center">End the game?</h3>
              <p className="text-white/50 text-sm text-center">
                This will finalize all placements and let you save the game.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium"
                >
                  Keep Playing
                </button>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    dispatch({ type: 'END_GAME' });
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/80 text-white text-sm font-bold"
                >
                  End Game
                </button>
              </div>
            </div>
          )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Player Panel Component ───────────────────────────────────────────────────

interface PlayerPanelViewProps {
  player: PlayerGameState;
  allPlayers: PlayerGameState[];
  /** Degrees CW the panel content is rotated to face the seated player. */
  rotation: 0 | 90 | 180 | 270;
  isFirst: boolean;
  /** CSS grid-column span (used for 3-player bottom panel). */
  colSpan?: number;
  /** How the deck artwork is rendered in the panel background. */
  bgStyle: BgStyle;
  onAdjustLife: (delta: number) => void;
  onOpenCmdDmg: () => void;
  onOpenPoison: () => void;
  /** Opens the player action menu (contains eliminate + bg-style options). */
  onOpenPlayerMenu: () => void;
}

function PlayerPanelView({
  player,
  allPlayers,
  rotation,
  isFirst,
  colSpan,
  bgStyle,
  onAdjustLife,
  onOpenCmdDmg,
  onOpenPoison,
  onOpenPlayerMenu,
}: PlayerPanelViewProps) {
  const theme = getColorTheme(player.colorIdentity);
  const totalCmdDmg = player.commanderDamage.reduce((a, b) => a + b, 0);
  const maxCmdDmgFromOne = Math.max(...player.commanderDamage, 0);
  const isDangerous = player.life <= 5 && !player.eliminated;

  // For 90°/270° rotations the content div needs swapped w/h so it fills
  // the panel correctly after transform. We measure the panel with a
  // ResizeObserver so it works for any screen size or orientation.
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setPanelSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const is90or270 = rotation === 90 || rotation === 270;

  /**
   * For 0°/180°: fill the panel with position:absolute inset-0, then rotate
   * around the panel center (transform-origin defaults to 50% 50%).
   *
   * For 90°/270°: pre-set the content to panelHeight × panelWidth (swapped)
   * so that after the 90°/270° CSS rotation the element exactly fills the
   * panel. We centre it with translate(-50%,-50%) first.
   */
  const contentStyle: React.CSSProperties = is90or270 ? {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // swap dimensions so the rotated element fills the panel
    width:  panelSize.h > 0 ? `${panelSize.h}px` : 'calc((100dvh - 2rem) / 2)',
    height: panelSize.w > 0 ? `${panelSize.w}px` : '50dvw',
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  } : {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
  };

  const outerStyle: React.CSSProperties = colSpan
    ? { gridColumn: `span ${colSpan}` }
    : {};

  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden border-r border-b border-white/5 last:border-r-0 ${
        isFirst ? 'ring-2 ring-inset ring-yellow-400/60' : ''
      }`}
      style={outerStyle}
    >
      {/* Background: deck image (three styles) or color gradient */}
      {player.deckImage ? (
        bgStyle === 'blurred' ? (
          /* ── Blurred: fills panel, soft blur + slight scale ── */
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(${player.deckImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(2px)',
              transform: `rotate(${rotation}deg) scale(1.4)`,
            }}
          />
        ) : bgStyle === 'scrolling' ? (
          /* ── Panning (Ken Burns): slowly drifts across the panel ── */
          <div
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage: `url(${player.deckImage})`,
              backgroundSize: '140%',
              backgroundRepeat: 'no-repeat',
              transform: `rotate(${rotation}deg)`,
              animation: 'kenburns-bg 25s ease-in-out infinite',
            }}
          />
        ) : (
          /* ── Centered (contain): full image visible, letterboxed ── */
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(${player.deckImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              transform: `rotate(${rotation}deg)`,
            }}
          />
        )
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-80`} />
      )}
      {/* Overlay tint */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Eliminated overlay */}
      {player.eliminated && (
        <div className="absolute inset-0 z-10 bg-black/75 flex items-center justify-center">
          {/* Rotate the label so the seated player can read it */}
          <div style={{ transform: `rotate(${rotation}deg)` }} className="text-center">
            <Skull className="h-8 w-8 text-white/30 mx-auto mb-1" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              {player.eliminationOrder === 1 ? 'Last' : `#${(allPlayers.length - (player.eliminationOrder ?? 0) + 1)}`}
            </p>
            <p className="text-white/30 text-xs truncate max-w-[120px]">{player.displayName}</p>
          </div>
        </div>
      )}

      {/* ── Content (rotated to face the seated player) ────────────────────── */}
      <div className="flex flex-col z-[5]" style={contentStyle}>

        {/* Header: name (opens player menu), deck, badges */}
        <div className="flex items-start justify-between px-2 pt-1.5 pb-0.5 gap-1">
          <button
            onClick={onOpenPlayerMenu}
            className="flex-1 min-w-0 text-left hover:opacity-75 active:opacity-60 transition-opacity"
          >
            <p className="text-white font-bold text-xs leading-tight truncate">{player.displayName}</p>
            <p className="text-white/50 text-[10px] leading-tight truncate">{player.commanderName}</p>
          </button>
          {/* Badges */}
          <div className="flex items-center gap-1 shrink-0">
            {player.poison > 0 && (
              <button
                onClick={onOpenPoison}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  player.poison >= POISON_LIMIT ? 'bg-red-600 text-white' : 'bg-green-800/60 text-green-300'
                }`}
              >
                <FlaskConical className="h-2.5 w-2.5" />
                {player.poison}
              </button>
            )}
            {totalCmdDmg > 0 && (
              <button
                onClick={onOpenCmdDmg}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  maxCmdDmgFromOne >= CMD_DMG_LIMIT ? 'bg-red-600 text-white' : 'bg-orange-800/60 text-orange-300'
                }`}
              >
                <Shield className="h-2.5 w-2.5" />
                {totalCmdDmg}
              </button>
            )}
            {isFirst && (
              <span className="bg-yellow-500/80 text-yellow-100 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                1st
              </span>
            )}
          </div>
        </div>

        {/* Life total (center, takes most space) */}
        <div className="flex-1 flex items-center justify-center">
          <span
            className={`font-black tabular-nums select-none ${
              isDangerous ? 'text-red-400 animate-pulse' :
              player.life <= 10 ? 'text-orange-300' :
              'text-white'
            } ${
              player.life > 99 ? 'text-4xl' :
              player.life > 9  ? 'text-6xl' :
              'text-7xl'
            }`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {player.life}
          </span>
        </div>

        {/* Buttons row */}
        {!player.eliminated && (
          <div className="flex items-center gap-1 px-2 pb-2">
            <button
              onClick={() => onAdjustLife(-5)}
              className="flex-1 h-10 rounded-lg bg-red-900/60 active:bg-red-700/80 text-red-200 font-bold text-sm transition-colors"
            >
              −5
            </button>
            <button
              onClick={() => onAdjustLife(-1)}
              className="flex-1 h-10 rounded-lg bg-red-900/40 active:bg-red-700/60 text-red-300 font-bold text-sm transition-colors"
            >
              −1
            </button>
            {/* Cmd Dmg */}
            <button
              onClick={onOpenCmdDmg}
              className="w-10 h-10 rounded-lg bg-white/10 active:bg-white/20 text-white/60 flex items-center justify-center"
            >
              <Shield className="h-4 w-4" />
            </button>
            {/* Poison */}
            <button
              onClick={onOpenPoison}
              className="w-10 h-10 rounded-lg bg-white/10 active:bg-white/20 text-white/60 flex items-center justify-center"
            >
              <FlaskConical className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAdjustLife(1)}
              className="flex-1 h-10 rounded-lg bg-green-900/40 active:bg-green-700/60 text-green-300 font-bold text-sm transition-colors"
            >
              +1
            </button>
            <button
              onClick={() => onAdjustLife(5)}
              className="flex-1 h-10 rounded-lg bg-green-900/60 active:bg-green-700/80 text-green-200 font-bold text-sm transition-colors"
            >
              +5
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
