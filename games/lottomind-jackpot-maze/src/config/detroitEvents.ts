export interface DetroitEventDefinition {
  name: string;
  callout: string;
  effect: 'double-score' | 'villain-jam' | 'hero-rush' | 'shield-team' | 'bonus-drop';
}

export const DETROIT_EVENT_INTERVAL_MS = 50_000;
export const DETROIT_EVENT_DURATION_MS = 8_000;

export const DETROIT_EVENTS: readonly DetroitEventDefinition[] = [
  { name: 'EASTSIDE LOVE LANE', callout: 'Hearts pay double across the Eastside.', effect: 'double-score' },
  { name: 'GRATIOT CROSSWAY CLEAR', callout: 'The crossway signal jams every villain.', effect: 'villain-jam' },
  { name: 'RIVERFRONT TAILWIND', callout: 'Jefferson opens a fast lane for the team.', effect: 'hero-rush' },
  { name: 'WARREN TRAFFIC BREAK', callout: 'Traffic clears and hearts pay double.', effect: 'double-score' },
  { name: 'WESTSIDE UNITY SHIELD', callout: 'Detroit unity restores every active shield.', effect: 'shield-team' },
  { name: 'LIVERNOIS FASHION FLASH', callout: 'Avenue lights stun the villain crew.', effect: 'villain-jam' },
  { name: 'GRAND RIVER FLOW', callout: 'Catch the flow for a full-speed rush.', effect: 'hero-rush' },
  { name: 'DEXTER BONUS RUN', callout: 'A street reward enters the grid now.', effect: 'bonus-drop' },
  { name: 'JOY ROAD NEON STORM', callout: 'The storm jams villains and doubles hearts.', effect: 'double-score' },
  { name: 'WESTSIDE VAULT OVERDRIVE', callout: 'Finale overdrive exposes the vault crew.', effect: 'villain-jam' }
] as const;

export function eventForLevel(level: number): DetroitEventDefinition {
  return DETROIT_EVENTS[((level % DETROIT_EVENTS.length) + DETROIT_EVENTS.length) % DETROIT_EVENTS.length];
}
