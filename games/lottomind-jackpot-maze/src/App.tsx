import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { NumberSlots } from './components/NumberSlots';
import { SocialShare } from './components/SocialShare';
import { LOTTERY_RULES } from './config/lotteryRules';
import { generateLotteryDraw } from './services/secureRandom';
import { loadSavedResults, makeResultId, saveResult } from './services/savedNumbers';
import { loadSettings, saveSettings } from './services/settings';
import type { GameSettings } from './services/settings';
import { clearCheckpoint, loadCheckpoint, saveCheckpoint } from './services/checkpoint';
import type { ControlBindings, ControlPreset, GameCheckpoint, LotteryDraw, LotteryMode, PlayStyle, SavedResult } from './types/game';

const DISCLAIMER = 'For entertainment purposes only. LottoMind does not predict or guarantee lottery results. Play responsibly.';

function generateDailyDraw(mode: LotteryMode): LotteryDraw {
  const rule = LOTTERY_RULES[mode];
  const stamp = new Date().toISOString().slice(0, 10);
  let seed = [...`${stamp}:${mode}`].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const main: number[] = [];
  while (main.length < rule.mainCount) {
    const value = rule.mainMin + Math.floor(random() * (rule.mainMax - rule.mainMin + 1));
    if (!rule.uniqueMain || !main.includes(value)) main.push(value);
  }
  if (rule.sortMain) main.sort((a, b) => a - b);
  return { mode, main, special: rule.special ? rule.special.min + Math.floor(random() * (rule.special.max - rule.special.min + 1)) : undefined };
}

function presetBindings(preset: ControlPreset, power: string): ControlBindings {
  if (preset === 'arrows') return { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', power };
  if (preset === 'ijkl') return { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', power };
  return { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', power };
}

export function App() {
  const [screen, setScreen] = useState<'start' | 'game' | 'results' | 'history'>('start');
  const [mode, setMode] = useState<LotteryMode>('pick3');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('solo');
  const playerCount = playStyle === 'solo' ? 1 : 2;
  const [draw, setDraw] = useState<LotteryDraw | null>(null);
  const [result, setResult] = useState<SavedResult | null>(null);
  const [settings, setSettings] = useState(loadSettings);
  const [history, setHistory] = useState(loadSavedResults);
  const [checkpoint, setCheckpoint] = useState(loadCheckpoint);
  const [resumeCheckpoint, setResumeCheckpoint] = useState<GameCheckpoint | null>(null);
  const [dailyRun, setDailyRun] = useState(false);
  const menuAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const startup = menuAudio.current ??= new Audio(`${import.meta.env.BASE_URL}assets/audio/digital-static-menu-96.mp3`);
    startup.loop = true; startup.preload = 'metadata'; startup.volume = settings.muted ? 0 : settings.musicVolume;
    if (screen === 'start' && !settings.muted && settings.musicVolume > 0) void startup.play().catch(() => undefined);
    else startup.pause();
    return () => { startup.pause(); };
  }, [screen, settings.musicVolume, settings.muted]);

  const unlockMenuAudio = () => {
    if (screen === 'start' && !settings.muted && settings.musicVolume > 0) void menuAudio.current?.play().catch(() => undefined);
  };
  const begin = () => {
    clearCheckpoint(); setCheckpoint(null); setResumeCheckpoint(null);
    setDailyRun(false); setDraw(generateLotteryDraw(mode)); setScreen('game');
  };
  const beginDaily = () => {
    clearCheckpoint(); setCheckpoint(null); setResumeCheckpoint(null);
    setDailyRun(true); setDraw(generateDailyDraw(mode)); setScreen('game');
  };
  const resume = () => {
    if (!checkpoint) return;
    setMode(checkpoint.draw.mode); setPlayStyle(checkpoint.playStyle); setResumeCheckpoint(checkpoint); setDraw(checkpoint.draw); setScreen('game');
  };
  const checkpointRun = useCallback((next: GameCheckpoint) => { saveCheckpoint(next); setCheckpoint(next); }, []);
  const complete = useCallback((run: { score: number; villainEncounters: number; powerUpsUsed: number; playerScores: [number, number]; heartsCollected: number; bonusesCollected: number; bestCombo: number; missedBonuses: number; eventsCompleted: number; levelGrades: Array<'S' | 'A' | 'B' | 'C'> }) => {
    setDraw(current => {
      if (!current) return current;
      const grade: SavedResult['grade'] = run.score >= 40000 ? 'S' : run.score >= 28000 ? 'A' : run.score >= 17000 ? 'B' : 'C';
      const achievements = ['DETROIT GRID CLEARED', ...(run.villainEncounters <= 8 ? ['STREET SMART'] : []), ...(run.powerUpsUsed >= 8 ? ['MIND COIN MASTER'] : []), ...(playStyle === 'coop' ? ['313 TEAMWORK'] : [])];
      const next: SavedResult = { ...current, id: makeResultId(), createdAt: new Date().toISOString(), level: 10, playerCount, playStyle, grade, achievements, daily: dailyRun, ...run };
      clearCheckpoint(); setCheckpoint(null); setResumeCheckpoint(null);
      setResult(next); setHistory(saveResult(next)); setScreen('results');
      return current;
    });
  }, [dailyRun, playStyle, playerCount]);
  const values = useMemo(() => result ? [...result.main, ...(result.special === undefined ? [] : [result.special])] : [], [result]);
  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings(current => { const next = { ...current, ...patch }; saveSettings(next); return next; });
  }, []);
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => updateSettings({ [key]: value });
  const setControlPreset = (player: 0 | 1, preset: ControlPreset) => updateSettings(player === 0
    ? { p1Controls: preset, p1Bindings: presetBindings(preset, settings.p1Bindings.power) }
    : { p2Controls: preset, p2Bindings: presetBindings(preset, settings.p2Bindings.power) });

  if (screen === 'game' && draw) return <GameCanvas draw={draw} playerCount={playerCount} playStyle={playStyle} muted={settings.muted} musicVolume={settings.musicVolume} effectsVolume={settings.effectsVolume} reducedMotion={settings.reducedMotion} highContrast={settings.highContrast} screenShake={settings.screenShake} gameSpeed={settings.gameSpeed} haptics={settings.haptics} p1Controls={settings.p1Controls} p2Controls={settings.p2Controls} p1Bindings={settings.p1Bindings} p2Bindings={settings.p2Bindings} hudScale={settings.hudScale} tutorialSeen={settings.tutorialSeen} initialCheckpoint={resumeCheckpoint} onTutorialComplete={() => updateSetting('tutorialSeen', true)} onSettingsChange={updateSettings} onCheckpoint={checkpointRun} onComplete={complete} onQuit={() => setScreen('start')} />;

  if (screen === 'results' && result) return (
    <main className="results-screen panel-screen">
      <div className="results-card glass-panel">
        <p className="eyebrow">VAULT OPEN • {LOTTERY_RULES[result.mode].label}</p>
        <h1>Jackpot Maze Complete</h1>
        <div className={`result-grade grade-${result.grade}`} aria-label={`Run grade ${result.grade}`}><small>RUN GRADE</small><strong>{result.grade}</strong></div>
        <img src={`${import.meta.env.BASE_URL}assets/mascot/mascot-reference.webp`} alt="LottoMind mascot celebrating" className="result-mascot" />
        <NumberSlots mode={result.mode} values={values} />
        <p className="result-meta">Score {result.score.toLocaleString()} • 5 villain types • {result.villainEncounters} encounters</p>
        <div className="run-recap" aria-label="Run recap">
          <span><small>DETROIT ROUTE</small><b>EASTSIDE → WESTSIDE VAULT</b></span>
          <span><small>HEARTS COLLECTED</small><b>{result.heartsCollected ?? '—'}</b></span>
          <span><small>BONUSES CAUGHT</small><b>{result.bonusesCollected ?? '—'}</b></span>
          <span><small>BEST HEART STREAK</small><b>{result.bestCombo ? `${result.bestCombo}x` : '—'}</b></span>
          <span><small>DETROIT EVENTS</small><b>{result.eventsCompleted ?? '—'}</b></span>
          <span><small>MISSED BONUSES</small><b>{result.missedBonuses ?? '—'}</b></span>
        </div>
        {result.levelGrades?.length ? <div className="level-grade-row" aria-label="Per-level grades">{result.levelGrades.map((grade, index) => <span key={index}><small>L{index + 1}</small><b>{grade}</b></span>)}</div> : null}
        {result.playStyle === 'coop' && result.playerScores && <div className="coop-recap"><span>P1 <b>{result.playerScores[0].toLocaleString()}</b></span><strong>313 TEAM TOTAL {result.score.toLocaleString()}</strong><span>P2 <b>{result.playerScores[1].toLocaleString()}</b></span></div>}
        {result.achievements && <div className="achievement-row" aria-label="Unlocked achievements">{result.achievements.map(item => <span key={item}>{item}</span>)}</div>}
        <p className="disclaimer">{DISCLAIMER}</p>
        <div className="button-row">
          <button className="primary" onClick={() => navigator.clipboard.writeText(values.join(' - '))}>Copy Numbers</button>
          <button onClick={() => setScreen('history')}>LottoMind Wallet</button>
          <button onClick={begin}>Generate Another Set</button>
          <button onClick={() => setScreen('start')}>Change Game Mode</button>
          <SocialShare result={result} />
        </div>
      </div>
    </main>
  );

  if (screen === 'history') return (
    <main className="panel-screen"><section className="glass-panel history-panel"><p className="eyebrow">LOTTOMIND WALLET</p><h1>Saved Number History</h1>
      {history.length > 0 && <div className="local-leaderboard"><small>LOCAL TOP 5</small>{[...history].sort((a, b) => b.score - a.score).slice(0, 5).map((item, index) => <span key={item.id}><b>#{index + 1}</b> {item.score.toLocaleString()} <em>{item.grade ?? '—'}</em></span>)}</div>}
      {history.length === 0 ? <p>No saved runs yet.</p> : history.map(item => <article key={item.id} className="history-item"><strong>{LOTTERY_RULES[item.mode].label} {item.grade ? `• GRADE ${item.grade}` : ''}</strong><span>{[...item.main, ...(item.special === undefined ? [] : [item.special])].join(' • ')}</span><small>{new Date(item.createdAt).toLocaleString()} — Score {item.score.toLocaleString()}</small></article>)}
      <button onClick={() => setScreen('start')}>Back</button></section></main>
  );

  return (
    <main className={`start-screen ${settings.highContrast ? 'high-contrast' : ''}`} onPointerDown={unlockMenuAudio}>
      <div className="hero-art" aria-hidden="true" />
      <section className="start-panel glass-panel">
        <div className="command-status" aria-hidden="true">
          <span><i className="status-pulse" /> CORE ONLINE</span>
          <b>LM.OS // JACKPOT MAZE</b>
          <span>DETROIT SECTOR 313</span>
        </div>
        <div className="generated-title-card" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}assets/ui/lottomind-jackpot-maze-title-card-mascot-3d-v2.webp`} alt="" />
        </div>
        <h1 className="screen-reader-title">LottoMind Jackpot Maze</h1>
        <div className="start-hud-rail" aria-hidden="true"><span>DETROIT GRID // ONLINE</span><i /><span>ARCADE COMMAND DECK</span><i /><span>SELECT RUN MODE</span></div>
        <p className="eyebrow">LOTTOMIND ARCADE ORIGINAL</p>
        <p className="lede">Collect secure number reveals. Outsmart five comic villains. Open the vault.</p>
        <div className="mission-strip" aria-hidden="true"><small>ACTIVE MISSION</small><strong>LOCK NUMBERS // EVADE VILLAINS // OPEN THE VAULT</strong><span>RUN READY</span></div>
        <fieldset className="mode-grid"><legend>Select lottery mode</legend>{Object.values(LOTTERY_RULES).map((rule, index) => <button key={rule.id} data-node={`0${index + 1}`} className={mode === rule.id ? 'selected' : ''} onClick={() => setMode(rule.id)} aria-pressed={mode === rule.id}><strong>{rule.label}</strong><small>{rule.mainCount} {rule.mainCount === 3 || rule.mainCount === 4 ? 'digits' : 'main balls'}{rule.special ? ` + ${rule.special.label}` : ''}</small></button>)}</fieldset>
        <fieldset className="player-grid"><legend>Players</legend>
          <button className={playStyle === 'solo' ? 'selected' : ''} onClick={() => setPlayStyle('solo')} aria-pressed={playStyle === 'solo'}><strong>1 Player</strong><small>Solo jackpot run</small></button>
          <button className={playStyle === 'alternating' ? 'selected' : ''} onClick={() => setPlayStyle('alternating')} aria-pressed={playStyle === 'alternating'}><strong>2 Player</strong><small>Classic alternating turns</small></button>
          <button className={playStyle === 'coop' ? 'selected' : ''} onClick={() => setPlayStyle('coop')} aria-pressed={playStyle === 'coop'}><strong>2 Player Co-op</strong><small>Play together at the same time</small></button>
        </fieldset>
        <div className="launch-row">
          <button className="primary launch" onClick={begin}><span>Enter the Maze</span><small>Initialize Run • {settings.gameSpeed === .8 ? 'Relaxed' : settings.gameSpeed === 1.2 ? 'Fast' : 'Standard'}</small></button>
          <button className="daily-run" onClick={beginDaily}><strong>Daily Detroit Run</strong><small>Same secure challenge for today</small></button>
          {checkpoint && <button className="resume-run" onClick={resume}><strong>Resume Level {checkpoint.world + 1}</strong><small>{checkpoint.playStyle === 'coop' ? 'Co-op' : checkpoint.playStyle === 'alternating' ? '2 Player' : 'Solo'} • {checkpoint.score.toLocaleString()} points</small></button>}
        </div>
        <details className="settings-panel">
          <summary>Game options</summary>
          <div className="settings-row">
            <label><input type="checkbox" checked={settings.reducedMotion} onChange={e => updateSetting('reducedMotion', e.target.checked)} /> Reduced motion</label>
            <label><input type="checkbox" checked={!settings.screenShake} onChange={e => updateSetting('screenShake', !e.target.checked)} /> No screen shake</label>
            <label><input type="checkbox" checked={settings.highContrast} onChange={e => updateSetting('highContrast', e.target.checked)} /> High contrast</label>
            <label><input type="checkbox" checked={settings.muted} onChange={e => updateSetting('muted', e.target.checked)} /> Mute</label>
            <label><input type="checkbox" checked={settings.haptics} onChange={e => updateSetting('haptics', e.target.checked)} /> Bonus vibration</label>
            <label>Speed <select value={settings.gameSpeed} onChange={e => updateSetting('gameSpeed', Number(e.target.value))}><option value={0.8}>Relaxed</option><option value={1}>Standard</option><option value={1.2}>Fast</option></select></label>
            <label>Music <input type="range" min="0" max="1" step="0.05" value={settings.musicVolume} onChange={e => updateSetting('musicVolume', Number(e.target.value))} /></label>
            <label>Effects <input type="range" min="0" max="1" step="0.05" value={settings.effectsVolume} onChange={e => updateSetting('effectsVolume', Number(e.target.value))} /></label>
            <label>P1 keys <select value={settings.p1Controls} onChange={e => setControlPreset(0, e.target.value as ControlPreset)}><option value="wasd">WASD</option><option value="arrows">Arrow keys</option><option value="ijkl">IJKL</option></select></label>
            <label>P2 keys <select value={settings.p2Controls} onChange={e => setControlPreset(1, e.target.value as ControlPreset)}><option value="arrows">Arrow keys</option><option value="wasd">WASD</option><option value="ijkl">IJKL</option></select></label>
            <button type="button" className="replay-tutorial" onClick={() => updateSetting('tutorialSeen', false)}>Replay tutorial</button>
          </div>
        </details>
        <div className="hud-diagnostics" aria-hidden="true"><span>INPUT LINKED</span><span>SECURE RNG</span><span>AUDIO ONLINE</span><span>VAULT NETWORK READY</span></div>
        <p className="controls-copy">{playStyle === 'coop' ? `P1: ${settings.p1Controls.toUpperCase()} • P2: ${settings.p2Controls.toUpperCase()} • Both players move together • Shared power-up: Space / Gamepad A` : playStyle === 'alternating' ? `Move: ${settings.p1Controls.toUpperCase()} / gamepad / swipe • Players switch after a hit` : `Move: ${settings.p1Controls.toUpperCase()} / gamepad / swipe controls`} • Pause: P / Gamepad Start • Mute: M</p>
        <p className="disclaimer">{DISCLAIMER}</p>
        <button className="text-button" onClick={() => setScreen('history')}>Open saved number history</button>
      </section>
    </main>
  );
}
