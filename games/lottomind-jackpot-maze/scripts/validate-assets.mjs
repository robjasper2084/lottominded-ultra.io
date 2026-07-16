import { access, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'public/assets/mascot/mascot-atlas.webp',
  'public/assets/heroes/player2-dog-atlas.webp',
  'public/assets/heroes/player2-dog-reference.webp',
  'public/assets/villains/villains-atlas.webp',
  'public/assets/villains/envy-crew-strip.webp',
  'public/assets/villains/jackpot-patrol-strip.webp',
  'source-assets/processed/bosses-atlas.png',
  'public/assets/environments/world-1-detroit-city.webp',
  'public/assets/environments/world-2-dream-oracle-temple.webp',
  'public/assets/environments/world-3-jackpot-vault.webp',
  'public/assets/ui/icons/number-orb.png',
  'public/assets/ui/icons/mind-coin.png',
  'public/assets/ui/icons/clarity-heart.png',
  'public/assets/ui/icons/vault-key.png',
  'public/assets/ui/detroit-street-sign-blank.webp',
  'public/assets/ui/icon-192.png',
  'public/assets/ui/icon-512.png',
  'public/assets/bonuses/cash-bonus.webp',
  'public/assets/bonuses/lottery-ticket-bonus.webp',
  'public/assets/bonuses/scratch-off-bonus.webp'
];

for (const item of required) {
  const path = resolve(item); await access(path); const info = await stat(path);
  if (info.size < 1024) throw new Error(`${item} is unexpectedly small`);
}
console.log(`Validated ${required.length} production assets.`);
