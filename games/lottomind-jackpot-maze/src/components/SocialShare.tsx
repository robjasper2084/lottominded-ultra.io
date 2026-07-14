import { useMemo, useState } from 'react';
import { LOTTERY_RULES } from '../config/lotteryRules';
import { buildShareMessage, buildSocialShareUrl, copyShareText, type SocialSharePlatform } from '../services/socialShare';
import type { SavedResult } from '../types/game';

export function SocialShare({ result }: { result: SavedResult }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const values = useMemo(() => [...result.main, ...(result.special === undefined ? [] : [result.special])], [result.main, result.special]);
  const message = useMemo(() => buildShareMessage(LOTTERY_RULES[result.mode].label, values, result.score), [result.mode, result.score, values]);
  const shareTo = (platform: SocialSharePlatform) => window.open(buildSocialShareUrl(platform, message, window.location.href), `lottomind-${platform}`, 'noopener,noreferrer,width=720,height=680');
  const instagram = () => {
    window.open('https://www.instagram.com/', 'lottomind-instagram', 'noopener,noreferrer');
    void copyShareText(message).then(copied => setStatus(copied ? 'Instagram caption copied — paste it into your post.' : 'Instagram opened — use Copy Numbers to copy your result.'));
  };

  return <section className="social-share" aria-label="Share result on social media">
    <button className="share-trigger" aria-expanded={open} aria-controls="social-share-options" onClick={() => { setOpen(current => !current); setStatus(''); }}>Share Result</button>
    {open ? <div id="social-share-options" className="social-share-panel">
      <button className="social-button facebook" onClick={() => shareTo('facebook')} aria-label="Share result on Facebook">f&nbsp; Facebook</button>
      <button className="social-button instagram" onClick={instagram} aria-label="Share result on Instagram">◎&nbsp; Instagram</button>
      <button className="social-button x-social" onClick={() => shareTo('x')} aria-label="Share result on X">𝕏&nbsp; X</button>
      <small>Instagram opens with your caption copied and ready to paste.</small>
    </div> : null}
    <span className="share-status" role="status" aria-live="polite">{status}</span>
  </section>;
}
