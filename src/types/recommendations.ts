export type GameMood = 'ALL' | 'ADRENALINE' | 'EXPLORATION' | 'RELAX_PUZZLE' | 'RETRO_NOSTALGIA';

export interface MoodDefinition {
  id: GameMood;
  name: string;
  icon: string;
  tagline: string;
  accentColor: string;
  relevantCategories: string[];
  keywords: string[];
}

export const MOOD_DEFINITIONS: Record<GameMood, MoodDefinition> = {
  ALL: {
    id: 'ALL',
    name: 'Top For You',
    icon: '✨',
    tagline: 'Algorithmically curated based on your playtime & style',
    accentColor: 'indigo',
    relevantCategories: [],
    keywords: [],
  },
  ADRENALINE: {
    id: 'ADRENALINE',
    name: 'Adrenaline Rush',
    icon: '⚡',
    tagline: 'High-speed kinetic runners, space shooters & rapid reflexes',
    accentColor: 'cyan',
    relevantCategories: ['cat-arcade', 'cat-action'],
    keywords: ['runner', 'cyber', 'drift', 'speed', 'laser', 'asteroids', 'kinetic', 'bullet', 'fast'],
  },
  EXPLORATION: {
    id: 'EXPLORATION',
    name: 'Dungeon & Adventure',
    icon: '🗡️',
    tagline: 'Voxel worlds, monsters, loot, dungeon crawling & RPGs',
    accentColor: 'amber',
    relevantCategories: ['cat-rpg', 'cat-action', 'cat-strategy'],
    keywords: ['voxel', 'dungeon', 'quest', 'sword', 'monster', 'gold', 'rpg', 'adventure', 'crawler'],
  },
  RELAX_PUZZLE: {
    id: 'RELAX_PUZZLE',
    name: 'Brain & Zen',
    icon: '🧠',
    tagline: 'Relaxing spatial puzzles, strategic thinking & mindful flow',
    accentColor: 'emerald',
    relevantCategories: ['cat-puzzle', 'cat-casual', 'cat-strategy'],
    keywords: ['puzzle', 'logic', 'match', 'strategy', 'relax', 'zen', 'mind', 'maze', 'physics'],
  },
  RETRO_NOSTALGIA: {
    id: 'RETRO_NOSTALGIA',
    name: 'Retro 80s Vibe',
    icon: '🕹️',
    tagline: 'Classic synthwave, pixel art & neon nostalgia',
    accentColor: 'rose',
    relevantCategories: ['cat-arcade'],
    keywords: ['retro', 'synthwave', 'pixel', 'arcade', 'classic', '80s', 'neon', '2088'],
  },
};

export interface PlayerAffinityProfile {
  userId: string;
  categoryWeights: Record<string, number>;
  playedGameIds: Set<string>;
  totalPlayMinutes: number;
  dominantMood: GameMood;
  interactionCount: number;
}
