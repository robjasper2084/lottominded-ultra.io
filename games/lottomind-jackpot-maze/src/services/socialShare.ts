export type SocialSharePlatform = 'facebook' | 'x';

export function buildShareMessage(lotteryLabel: string, values: number[], score: number): string {
  return `I completed LottoMind: Jackpot Maze with ${score.toLocaleString('en-US')} points! ${lotteryLabel} entertainment numbers: ${values.join(' • ')}. Can you beat my score?`;
}

export function buildSocialShareUrl(platform: SocialSharePlatform, message: string, pageUrl: string): string {
  const url = new URL(platform === 'facebook' ? 'https://www.facebook.com/sharer/sharer.php' : 'https://twitter.com/intent/tweet');
  if (platform === 'facebook') {
    url.searchParams.set('u', pageUrl);
    url.searchParams.set('quote', message);
  } else {
    url.searchParams.set('text', message);
    url.searchParams.set('url', pageUrl);
  }
  return url.toString();
}

export async function copyShareText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const textarea = document.createElement('textarea');
    textarea.value = text; textarea.setAttribute('readonly', ''); textarea.style.position = 'fixed'; textarea.style.opacity = '0';
    document.body.appendChild(textarea); textarea.select(); const copied = document.execCommand('copy'); textarea.remove(); return copied;
  }
}
