import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { GameRuntimeHandle } from '../game/GameRuntime';
import { NumberSlots } from './NumberSlots';
import { DETROIT_LEVELS, LEVEL_ONE_HEART_CAP } from '../config/gameBalance';
import { BONUS_TIERS, STREET_BONUSES } from '../config/streetBonuses';
import { commercialForCompletedLevel, shouldShowCommercialAfterLevel } from '../config/levelCommercials';
import { LOTTERY_RULES } from '../config/lotteryRules';
import { EMPTY_MISSION_STATS, evaluateDetroitMissions } from '../config/detroitMissions';
import { generateLotteryDraw } from '../services/secureRandom';
import type { ControlAction, ControlBindings, ControlPreset, CosmeticId, GameCheckpoint, GameSnapshot, LotteryDraw, LotteryMode, PlayerCount, PlayStyle, RunVariant } from '../types/game';
import type { GameSettings } from '../services/settings';

const initialSnapshot: GameSnapshot = { world: 0, score: 0, playerCount: 1, activePlayer: 0, playerScores: [0, 0], playerLives: [3, 3], playerShields: [true, true], downedPlayers: [false, false], reviveProgress: [0, 0], coins: 0, remainingHearts: 0, lives: 3, combo: 1, revealed: [], totalSlots: 0, powerUp: 'Mind Coin Shield', hasMoved: false, usedPortal: false, powerUpsUsed: 0, villainEncounters: 0, revivesCompleted: 0, bossHealth: 0, bossMaxHealth: 0, mechanic: '', bonusesCollected: 0, bestCombo: 1, teamCombo: 0, heartsCollected: 0, levelHeartsTotal: 0, bonusSeconds: 30, bonusActive: false, syncGateReady: false, eventSeconds: 50, eventsCompleted: 0, missedBonuses: 0, runVariant: 'classic', timeAttackSeconds: 0, portalCombo: 0, portalComboSeconds: 0, missions: [], missionsCompleted: 0 };
const IN_GAME_TRACK = 'untitled-14-gameplay-96.mp3';
const COMMERCIAL_LOTTERY_MODES: LotteryMode[] = ['pick3', 'pick4', 'megaMillions', 'powerball'];
const keyLabel = (code: string) => code.replace(/^Key/, '').replace(/^Arrow/, '').replace('Space', 'SPACE').replace('Enter', 'ENTER');
const directionArrow = { N: '↑', NE: '↗', E: '→', SE: '↘', S: '↓', SW: '↙', W: '←', NW: '↖' } as const;

function snapshotForNewRun(draw: LotteryDraw, playerCount: PlayerCount, runVariant: RunVariant): GameSnapshot {
  const totalSlots = draw.main.length + (draw.special === undefined ? 0 : 1);
  return {
    ...initialSnapshot,
    playerCount,
    runVariant,
    remainingHearts: LEVEL_ONE_HEART_CAP,
    levelHeartsTotal: LEVEL_ONE_HEART_CAP,
    totalSlots,
    missions: evaluateDetroitMissions(0, { ...EMPTY_MISSION_STATS })
  };
}

function snapshotFromCheckpoint(checkpoint: GameCheckpoint, playerCount: PlayerCount, runVariant: RunVariant): GameSnapshot {
  const totalSlots = checkpoint.draw.main.length + (checkpoint.draw.special === undefined ? 0 : 1);
  const remainingHearts = checkpoint.remainingHeartKeys?.length ?? 0;
  return {
    ...initialSnapshot,
    world: checkpoint.world,
    score: checkpoint.score,
    playerCount,
    activePlayer: checkpoint.activePlayer,
    playerScores: [...checkpoint.playerScores],
    playerLives: [...checkpoint.playerLives],
    playerShields: [...checkpoint.playerShields],
    coins: checkpoint.pellets,
    remainingHearts,
    lives: checkpoint.lives,
    revealed: [...checkpoint.revealed],
    totalSlots,
    powerUp: checkpoint.shielded ? 'Mind Coin Shield • READY' : 'Shield recharging',
    hasMoved: true,
    powerUpsUsed: checkpoint.powerUpsUsed,
    villainEncounters: checkpoint.villainEncounters,
    bossHealth: checkpoint.bossHealth ?? 0,
    bossMaxHealth: 0,
    bonusesCollected: checkpoint.bonusesCollected ?? 0,
    bestCombo: checkpoint.bestCombo ?? 1,
    heartsCollected: checkpoint.pellets,
    levelHeartsTotal: checkpoint.pellets + remainingHearts,
    eventsCompleted: checkpoint.eventsCompleted ?? 0,
    missedBonuses: checkpoint.missedBonuses ?? 0,
    runVariant,
    timeAttackSeconds: Math.max(0, Math.ceil((checkpoint.levelTimeRemainingMs ?? 0) / 1000)),
    missions: evaluateDetroitMissions(checkpoint.world, { ...EMPTY_MISSION_STATS, ...checkpoint.levelMissionStats }),
    missionsCompleted: checkpoint.missionsCompleted ?? 0
  };
}

export function GameCanvas({ draw, playerCount, playStyle, runVariant, cosmetic, muted, musicVolume, effectsVolume, reducedMotion, highContrast, screenShake, gameSpeed, haptics, p1Controls, p2Controls, p1Bindings, p2Bindings, hudScale, tutorialSeen, initialCheckpoint, onTutorialComplete, onSettingsChange, onCheckpoint, onComplete, onQuit }: {
  draw: LotteryDraw;
  playerCount: PlayerCount;
  playStyle: PlayStyle;
  runVariant: RunVariant;
  cosmetic: CosmeticId;
  muted: boolean;
  musicVolume: number;
  effectsVolume: number;
  reducedMotion: boolean;
  highContrast: boolean;
  screenShake: boolean;
  gameSpeed: number;
  haptics: boolean;
  p1Controls: ControlPreset;
  p2Controls: ControlPreset;
  p1Bindings: ControlBindings;
  p2Bindings: ControlBindings;
  hudScale: number;
  tutorialSeen: boolean;
  initialCheckpoint: GameCheckpoint | null;
  onTutorialComplete: () => void;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  onCheckpoint: (checkpoint: GameCheckpoint) => void;
  onComplete: (data: { score: number; villainEncounters: number; powerUpsUsed: number; playerScores: [number, number]; heartsCollected: number; bonusesCollected: number; bestCombo: number; missedBonuses: number; eventsCompleted: number; levelGrades: Array<'S' | 'A' | 'B' | 'C'>; missionsCompleted: number; timeAttackBonus: number }) => void;
  onQuit: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<GameRuntimeHandle | null>(null);
  const soundtrack = useRef<HTMLAudioElement | null>(null);
  const commercialVideo = useRef<HTMLVideoElement | null>(null);
  const continueRunAfterCommercial = useRef<(() => void) | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState(() => initialCheckpoint ? snapshotFromCheckpoint(initialCheckpoint, playerCount, runVariant) : snapshotForNewRun(draw, playerCount, runVariant));
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [liveSummary, setLiveSummary] = useState('');
  const [paused, setPaused] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(tutorialSeen ? -1 : 0);
  const [capture, setCapture] = useState<{ player: 0 | 1; action: ControlAction } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [gamepads, setGamepads] = useState<[string | null, string | null]>([null, null]);
  const [commercialLevel, setCommercialLevel] = useState<number | null>(null);
  const [commercialDraws, setCommercialDraws] = useState<LotteryDraw[]>([]);
  const pauseDialog = useRef<HTMLElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const pauseWasOpen = useRef(false);
  const level = DETROIT_LEVELS[snapshot.world] ?? DETROIT_LEVELS[0];
  const lockedCount = snapshot.revealed.filter(value => value !== null).length;
  const completedMissionCount = snapshot.missions.filter(mission => mission.complete).length;
  const isLevelIntro = Boolean(snapshot.warning?.includes('LEVEL') && snapshot.warning.includes('READY'));
  const levelCommercial = commercialLevel === null ? null : commercialForCompletedLevel(commercialLevel);
  const tutorialSteps = [
    { title: 'MOVE THROUGH DETROIT', text: 'Use your selected keys, a gamepad stick, or the touch pad. Turns queue early so the hero slides cleanly around walls.' },
    { title: 'COLLECT LOVE IN THE STREETS', text: 'Follow the glowing hearts. Nearby hearts magnet toward the hero and build a score combo.' },
    { title: 'ACTIVATE MIND COINS', text: 'Corner Mind Coins frighten villains. Press Space, gamepad A, or POWER to restore a shield or trigger a speed rush.' },
    { title: 'CHASE RARE STREET BONUSES', text: 'Cash, tickets, and scratch-offs move through the grid in Bronze, Silver, and Gold tiers. Rarer drops last longer and score more.' },
    { title: 'CHAIN THE PORTALS', text: 'Drive into numbered matching portals, then collect hearts before the combo timer ends for up to 5x portal points.' },
    { title: 'CLEAR DETROIT MISSIONS', text: 'Each district has three short goals. Finish them during the level to earn bonus points and unlock hero styles.' },
    { title: 'SURVIVE THE VILLAINS', text: 'Colored outlines identify each villain. Shields absorb one hit; without a shield you lose a life.' },
    ...(playStyle === 'coop' ? [{ title: 'REVIVE YOUR TEAMMATE', text: 'P1 and P2 score together. Stand beside a downed teammate to revive them and earn a teamwork bonus.' }] : [])
  ];
  const finishTutorial = () => { setTutorialStep(-1); onTutorialComplete(); };
  const showLevelCommercial = useCallback((completedLevelIndex: number, continueRun: () => void) => {
    if (!shouldShowCommercialAfterLevel(completedLevelIndex)) {
      continueRun();
      return;
    }
    continueRunAfterCommercial.current = continueRun;
    setCommercialDraws(COMMERCIAL_LOTTERY_MODES.map(mode => generateLotteryDraw(mode)));
    setCommercialLevel(completedLevelIndex);
  }, []);
  const finishLevelCommercial = useCallback(() => {
    const continueRun = continueRunAfterCommercial.current;
    continueRunAfterCommercial.current = null;
    setCommercialLevel(null);
    window.setTimeout(() => continueRun?.(), 0);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const pads = navigator.getGamepads?.() ?? [];
      setGamepads([pads[0]?.id ?? null, pads[1]?.id ?? null]);
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!capture) return;
    const listen = (event: KeyboardEvent) => {
      event.preventDefault(); event.stopPropagation();
      if (event.code === 'Escape') { setCapture(null); return; }
      const key = capture.player === 0 ? 'p1Bindings' : 'p2Bindings';
      const current = capture.player === 0 ? p1Bindings : p2Bindings;
      onSettingsChange({ [key]: { ...current, [capture.action]: event.code } });
      setCapture(null);
    };
    window.addEventListener('keydown', listen, true);
    return () => window.removeEventListener('keydown', listen, true);
  }, [capture, onSettingsChange, p1Bindings, p2Bindings]);

  useEffect(() => {
    if (tutorialStep < 0) return;
    const complete = [snapshot.hasMoved, snapshot.coins > 0, snapshot.powerUpsUsed > 0, snapshot.bonusesCollected > 0, snapshot.usedPortal, snapshot.missions.some(mission => mission.complete), snapshot.villainEncounters > 0, snapshot.revivesCompleted > 0][tutorialStep];
    if (!complete) return;
    const id = window.setTimeout(() => tutorialStep >= tutorialSteps.length - 1 ? finishTutorial() : setTutorialStep(step => step + 1), 650);
    return () => window.clearTimeout(id);
  }, [snapshot.hasMoved, snapshot.coins, snapshot.powerUpsUsed, snapshot.bonusesCollected, snapshot.usedPortal, snapshot.villainEncounters, snapshot.revivesCompleted, tutorialStep, tutorialSteps.length]);

  useEffect(() => {
    document.body.classList.add('game-active');
    return () => document.body.classList.remove('game-active');
  }, []);

  useEffect(() => {
    if (paused) { pauseWasOpen.current = true; window.setTimeout(() => pauseDialog.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0); }
    else if (pauseWasOpen.current) { pauseWasOpen.current = false; pauseButton.current?.focus(); }
  }, [paused]);

  useEffect(() => {
    if (!paused) return;
    const handlePauseKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmExit) setConfirmExit(false);
        else runtime.current?.setPaused(false);
        return;
      }
      if (event.key !== 'Tab' || !pauseDialog.current) return;
      const focusable = [...pauseDialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', handlePauseKeys, true);
    return () => window.removeEventListener('keydown', handlePauseKeys, true);
  }, [confirmExit, paused]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLiveSummary(`Level ${snapshot.world + 1}. Score ${snapshot.score}. ${snapshot.remainingHearts} hearts remain. ${lockedCount} of ${snapshot.totalSlots} numbers locked. ${completedMissionCount} Detroit missions complete.${snapshot.warning ? ` ${snapshot.warning}` : ''}`);
    }, 500);
    return () => window.clearTimeout(id);
  }, [completedMissionCount, lockedCount, snapshot.remainingHearts, snapshot.score, snapshot.totalSlots, snapshot.warning, snapshot.world]);

  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/${IN_GAME_TRACK}`);
    soundtrack.current?.pause(); soundtrack.current = audio;
    audio.loop = true; audio.preload = 'metadata'; audio.volume = muted ? 0 : musicVolume;
    if (!muted && musicVolume > 0) void audio.play().catch(() => undefined);
    return () => { audio.pause(); audio.currentTime = 0; if (soundtrack.current === audio) soundtrack.current = null; };
  }, [musicVolume, muted, IN_GAME_TRACK]);

  useEffect(() => {
    const audio = soundtrack.current;
    if (!audio) return;
    if (commercialLevel !== null) audio.pause();
    else if (!muted && musicVolume > 0) void audio.play().catch(() => undefined);
  }, [commercialLevel, musicVolume, muted]);

  useEffect(() => {
    const video = commercialVideo.current;
    if (!video || commercialLevel === null) return;
    video.muted = muted;
    video.volume = muted ? 0 : musicVolume;
    void video.play().catch(() => undefined);
  }, [commercialLevel, musicVolume, muted]);

  useEffect(() => {
    let nextCommercialLevel = snapshot.world;
    while (nextCommercialLevel < 9 && !shouldShowCommercialAfterLevel(nextCommercialLevel)) nextCommercialLevel += 1;
    if (nextCommercialLevel >= 9 && !shouldShowCommercialAfterLevel(nextCommercialLevel)) return;
    const commercial = commercialForCompletedLevel(nextCommercialLevel);
    const preload = () => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = `${import.meta.env.BASE_URL}${commercial.file}`;
      video.load();
    };
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);
    if (requestIdle) { const id = requestIdle(preload, { timeout: 2500 }); return () => cancelIdle?.(id); }
    const id = window.setTimeout(preload, 1200);
    return () => window.clearTimeout(id);
  }, [snapshot.world]);

  useEffect(() => {
    if (!host.current) return;
    window.scrollTo(0, 0);
    let cancelled = false;
    const currentHost = host.current;
    import('../game/GameRuntime').then(({ createGameRuntime }) => {
      if (!cancelled) runtime.current = createGameRuntime(currentHost, { draw, playerCount, playStyle, runVariant, cosmetic, muted, effectsVolume, reducedMotion, screenShake, gameSpeed, haptics, p1Controls, p2Controls, p1Bindings, p2Bindings, initialCheckpoint, onCheckpoint, onSnapshot: next => { setSnapshot(next); setRuntimeReady(true); }, onPausedChange: setPaused, onLevelBreak: showLevelCommercial, onComplete });
    });
    return () => { cancelled = true; continueRunAfterCommercial.current = null; runtime.current?.destroy(); runtime.current = null; };
  }, [cosmetic, draw, gameSpeed, initialCheckpoint, onCheckpoint, onComplete, playerCount, playStyle, reducedMotion, runVariant, screenShake, showLevelCommercial]);

  useEffect(() => { runtime.current?.setEffectsVolume(effectsVolume); }, [effectsVolume]);
  useEffect(() => { runtime.current?.setMuted(muted); }, [muted]);
  useEffect(() => { runtime.current?.setHaptics(haptics); }, [haptics]);
  useEffect(() => { runtime.current?.setBindings(0, p1Bindings); }, [p1Bindings]);
  useEffect(() => { runtime.current?.setBindings(1, p2Bindings); }, [p2Bindings]);

  const dir = (value: 'up' | 'down' | 'left' | 'right' | null, player: 0 | 1 = 0) => runtime.current?.setDirection(value, player);
  const togglePause = () => runtime.current?.setPaused(!paused);
  const startSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finishSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
    if (Math.abs(deltaX) > Math.abs(deltaY)) dir(deltaX > 0 ? 'right' : 'left');
    else dir(deltaY > 0 ? 'down' : 'up');
  };

  return (
    <main className={`game-shell ${highContrast ? 'high-contrast' : ''}`} style={{ '--hud-scale': hudScale } as CSSProperties}>
      <div className={`arcade-scoreboard ${snapshot.playerCount === 2 ? 'two-player' : ''}`}>
        <div className={playStyle === 'coop' ? 'coop-player player-one' : snapshot.activePlayer === 0 ? 'active-player' : ''}><small>{playStyle === 'coop' ? 'P1' : '1UP'}</small><strong>{snapshot.playerScores[0].toString().padStart(2, '0')}</strong>{playStyle === 'coop' && <span className={`shield-status ${snapshot.playerShields[0] ? 'ready' : snapshot.downedPlayers[0] ? 'down' : ''}`}>{snapshot.downedPlayers[0] ? `REVIVE ${Math.round(snapshot.reviveProgress[0] / 1.4 * 100)}%` : snapshot.playerShields[0] ? 'SHIELD' : 'NO SHIELD'}</span>}</div>
        <div><small>HIGH SCORE</small><strong>{Math.max(10000, ...snapshot.playerScores)}</strong></div>
        {snapshot.playerCount === 2 && <div className={playStyle === 'coop' ? 'coop-player player-two' : snapshot.activePlayer === 1 ? 'active-player' : ''}><small>{playStyle === 'coop' ? 'P2' : '2UP'}</small><strong>{snapshot.playerScores[1].toString().padStart(2, '0')}</strong>{playStyle === 'coop' && <span className={`shield-status ${snapshot.playerShields[1] ? 'ready' : snapshot.downedPlayers[1] ? 'down' : ''}`}>{snapshot.downedPlayers[1] ? `REVIVE ${Math.round(snapshot.reviveProgress[1] / 1.4 * 100)}%` : snapshot.playerShields[1] ? 'SHIELD' : 'NO SHIELD'}</span>}</div>}
      </div>
      <div className="live-mission-strip" aria-label={`Mission status: ${snapshot.remainingHearts} hearts left, ${lockedCount} of ${snapshot.totalSlots} numbers locked`}>
        <span><small>{playStyle === 'coop' ? 'TEAM MISSION' : 'ACTIVE MISSION'}</small><b>{snapshot.remainingHearts} HEARTS LEFT</b></span>
        {snapshot.runVariant === 'timeAttack' && <span className={`time-attack-live ${snapshot.timeAttackSeconds <= 20 ? 'urgent' : ''}`}><small>DISTRICT CLOCK</small><b>{Math.floor(snapshot.timeAttackSeconds / 60)}:{(snapshot.timeAttackSeconds % 60).toString().padStart(2, '0')}</b></span>}
        <span className={snapshot.bonusActive ? 'bonus-live' : ''}><small>{snapshot.bonusActive ? 'BONUS MOVING' : 'NEXT BONUS'}</small><b>{!snapshot.hasMoved ? 'MOVE TO START' : snapshot.bonusActive && snapshot.bonusDirection ? `${directionArrow[snapshot.bonusDirection]} ${snapshot.bonusDirection} • ${snapshot.bonusSeconds}s` : `0:${snapshot.bonusSeconds.toString().padStart(2, '0')}`}</b></span>
        <span><small>NUMBERS LOCKED</small><b>{lockedCount}/{snapshot.totalSlots}</b></span>
        <span className={snapshot.eventName ? 'event-live' : 'event-timer'}><small>{snapshot.eventName ? 'DETROIT EVENT' : 'NEXT CITY EVENT'}</small><b>{!snapshot.hasMoved ? 'MOVE TO START' : snapshot.eventName ? `${snapshot.eventName} • ${snapshot.eventSeconds}s` : `0:${snapshot.eventSeconds.toString().padStart(2, '0')}`}</b></span>
        {playStyle === 'coop' && <span className="team-meter"><small>313 TEAM COMBO</small><b>{snapshot.teamCombo}x {snapshot.syncGateReady ? '• SYNC GATE OPEN' : ''}</b><i style={{ width: `${snapshot.teamCombo * 10}%` }} /></span>}
      </div>
      <div className="screen-reader-stats" aria-live="polite" aria-atomic="true">{liveSummary}</div>
      <div className="playfield-wrap" onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { swipeStart.current = null; }}>
        {!runtimeReady && <div className={`restore-run ${initialCheckpoint ? 'restore-checkpoint' : 'boot-run'}`} role="status">
          <small>{initialCheckpoint ? 'CHECKPOINT LINKED' : 'LM.OS // GRID BOOT'}</small>
          <strong>{initialCheckpoint ? 'Restoring Detroit Run' : 'Initializing Detroit Grid'}</strong>
          <span>{initialCheckpoint ? `Rebuilding Level ${snapshot.world + 1} • ${snapshot.remainingHearts} hearts remain` : `${LOTTERY_RULES[draw.mode].label} • ${snapshot.totalSlots} secure number slots`}</span>
        </div>}
        {isLevelIntro && <div className="level-intro" role="status">
          <small>LEVEL {snapshot.world + 1} / 10</small>
          <strong>{level.name.toUpperCase()}</strong>
          <span>{level.landmark}</span>
          <em>{level.tagline} • {level.mechanic}</em>
        </div>}
        {!isLevelIntro && snapshot.warning && <div className={`warning ${snapshot.warning.includes('MIND COIN') ? 'power-warning' : ''}`} role="status">{snapshot.warning}</div>}
        {!isLevelIntro && !snapshot.warning && !snapshot.bonusEffect && snapshot.combo > 1 && <div className="combo-chip" aria-live="polite"><small>HEART STREAK</small><strong>×{snapshot.combo}</strong></div>}
        {!isLevelIntro && !snapshot.warning && !snapshot.bonusEffect && snapshot.portalCombo > 0 && <div className="portal-combo-chip" aria-live="polite"><small>PORTAL CHAIN</small><strong>×{snapshot.portalCombo}</strong><span>{snapshot.portalComboSeconds}s</span></div>}
        {snapshot.bonusEffect && <div className={`street-bonus-chip ${snapshot.bonusEffect} tier-${snapshot.bonusTier ?? 'bronze'}`} aria-live="polite"><small>{snapshot.bonusTier ? `${BONUS_TIERS[snapshot.bonusTier].label} ` : ''}STREET BONUS</small><strong>{STREET_BONUSES[snapshot.bonusEffect].label}</strong><span>{STREET_BONUSES[snapshot.bonusEffect].effect}</span></div>}
        <aside className="detroit-mission-board" aria-label="Detroit district missions"><header><small>DETROIT MISSIONS</small><b>{snapshot.missions.filter(mission => mission.complete).length}/{snapshot.missions.length}</b></header>{snapshot.missions.map(mission => <span className={mission.complete ? 'complete' : ''} key={mission.id}><i>{mission.complete ? '✓' : '◇'}</i><em>{mission.label}</em><b>{mission.current}/{mission.target}</b></span>)}</aside>
        {playStyle === 'coop' && snapshot.teammateDirections && <div className="teammate-directions" aria-label={`Player one teammate is ${snapshot.teammateDirections[0]}. Player two teammate is ${snapshot.teammateDirections[1]}.`}><span>P1 TEAMMATE {directionArrow[snapshot.teammateDirections[0]]}</span><span>P2 TEAMMATE {directionArrow[snapshot.teammateDirections[1]]}</span></div>}
        {snapshot.bossMaxHealth > 0 && <div className="boss-meter" role="meter" aria-label={`${snapshot.bossLabel} health ${snapshot.bossHealth} of ${snapshot.bossMaxHealth}`} aria-valuemin={0} aria-valuemax={snapshot.bossMaxHealth} aria-valuenow={snapshot.bossHealth}><span>{snapshot.bossLabel}</span><i style={{ width: `${snapshot.bossHealth / snapshot.bossMaxHealth * 100}%` }} /></div>}
        <div ref={host} className="game-canvas" aria-label="Jackpot Maze playfield. Swipe to steer on touch screens." />
        {tutorialStep >= 0 && <aside className="tutorial-coach" aria-live="polite" onPointerDown={event => event.stopPropagation()}>
          <small>FIELD TRAINING {tutorialStep + 1}/{tutorialSteps.length}</small>
          <strong>{tutorialSteps[tutorialStep].title}</strong>
          <p>{tutorialSteps[tutorialStep].text}</p>
          <div><span className="tutorial-action">WAITING FOR ACTION</span><button onClick={finishTutorial}>Skip training</button></div>
        </aside>}
      </div>
      {paused && <section ref={pauseDialog} className="pause-command" role="dialog" aria-modal="true" aria-labelledby="pause-title" onPointerDown={event => event.stopPropagation()}>
        <div className="pause-header"><span>LM.OS // RUN SUSPENDED</span><h2 id="pause-title">Detroit Command Pause</h2><p>Progress saved at Level {snapshot.world + 1}, {snapshot.remainingHearts} hearts remaining.</p></div>
        <div className="pause-settings">
          <label>Music <b>{Math.round(musicVolume * 100)}%</b><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={event => onSettingsChange({ musicVolume: Number(event.target.value) })} /></label>
          <label>Effects <b>{Math.round(effectsVolume * 100)}%</b><input type="range" min="0" max="1" step="0.05" value={effectsVolume} onChange={event => onSettingsChange({ effectsVolume: Number(event.target.value) })} /></label>
          <label><input type="checkbox" checked={muted} onChange={event => onSettingsChange({ muted: event.target.checked })} /> Mute all audio</label>
          <label><input type="checkbox" checked={highContrast} onChange={event => onSettingsChange({ highContrast: event.target.checked })} /> High contrast HUD</label>
          <label><input type="checkbox" checked={haptics} onChange={event => onSettingsChange({ haptics: event.target.checked })} /> Phone bonus vibration</label>
          <label>HUD size <select value={hudScale} onChange={event => onSettingsChange({ hudScale: Number(event.target.value) })}><option value={1}>Standard</option><option value={1.12}>Large</option><option value={1.24}>Extra large</option></select></label>
        </div>
        <button className="guide-toggle" aria-expanded={showGuide} onClick={() => setShowGuide(value => !value)}>{showGuide ? 'Close How to Play' : 'How to Play & Bonus Guide'}</button>
        {showGuide && <div className="pause-guide">
          <span><b>LOVE HEARTS</b> Clear the grid and build a score streak.</span><span><b>MIND COINS</b> Frighten villains and charge your shield.</span>
          <span><b>PORTAL CHAINS</b> Jump, then collect hearts before the timer ends for up to 5x.</span><span><b>CASH</b> Double heart points for 8 seconds.</span>
          <span><b>LOTTERY TICKET</b> Boost hero speed for 8 seconds.</span><span><b>SCRATCH-OFF</b> Add a force field for 12 seconds.</span>
          <span><b>RARE TIERS</b> Silver and Gold drops score more and last longer.</span><span><b>DETROIT MISSIONS</b> Complete all three goals on each map for unlock progress.</span>
          {snapshot.runVariant === 'timeAttack' && <span><b>TIME ATTACK</b> Clear a district before the clock expires to bank bonus points.</span>}
          {playStyle === 'coop' && <span><b>313 SYNC GATE</b> Bring both players close to a moving bonus for +313.</span>}
        </div>}
        <div className="control-remap">
          {([0, 1] as const).map(player => (player === 0 || playerCount === 2) && <div key={player} className={`binding-player p${player + 1}`}><strong>P{player + 1} CUSTOM KEYS</strong><small>{gamepads[player] ? `GAMEPAD ${player + 1} CONNECTED` : `GAMEPAD ${player + 1} NOT CONNECTED`}</small>
            <div>{(['up', 'left', 'down', 'right', 'power'] as ControlAction[]).map(action => { const bindings = player === 0 ? p1Bindings : p2Bindings; const active = capture?.player === player && capture.action === action; return <button key={action} className={active ? 'listening' : ''} onClick={() => setCapture({ player, action })}><span>{action}</span><b>{active ? 'PRESS A KEY' : keyLabel(bindings[action])}</b></button>; })}</div>
          </div>)}
        </div>
        {!confirmExit && <div className="pause-actions">
          <button className="primary" onClick={() => runtime.current?.setPaused(false)}>Resume Run</button>
          <button onClick={() => { runtime.current?.restartLevel(); runtime.current?.setPaused(false); }}>Restart from Safe Spawn</button>
          <button onClick={() => void document.documentElement.requestFullscreen?.()}>Fullscreen</button>
          <button className="danger" onClick={() => setConfirmExit(true)}>Save & Exit</button>
        </div>}
        {confirmExit && <div className="exit-confirm"><span><strong>Return to the command deck?</strong><small>Your exact level progress is saved.</small></span><button onClick={() => setConfirmExit(false)}>Keep Playing</button><button className="danger" onClick={() => { runtime.current?.saveCheckpoint(); onQuit(); }}>Confirm Save & Exit</button></div>}
      </section>}
      {levelCommercial && commercialLevel !== null && <section className="level-commercial" role="dialog" aria-modal="true" aria-labelledby="commercial-title">
        <div className="commercial-frame">
          <header>
            <span>LM.TV // DETROIT BROADCAST</span>
            <strong id="commercial-title">LEVEL {commercialLevel + 1} CLEAR</strong>
            <em>UP NEXT: LEVEL {commercialLevel + 2} / 10</em>
          </header>
          <div className="commercial-content">
            <video
              ref={commercialVideo}
              key={levelCommercial.id}
              src={`${import.meta.env.BASE_URL}${levelCommercial.file}`}
              poster={`${import.meta.env.BASE_URL}${levelCommercial.poster}`}
              aria-label={levelCommercial.label}
              autoPlay
              controls
              playsInline
              preload="metadata"
              onEnded={finishLevelCommercial}
              onError={finishLevelCommercial}
            />
            <aside className="commercial-picks" aria-label="Generated lottery fun picks">
              <header><small>LOTTOMIND NUMBER LAB</small><strong>GENERATED FUN PICKS</strong><span>NOT OFFICIAL RESULTS</span></header>
              {commercialDraws.map(generatedDraw => <div className={`commercial-draw ${generatedDraw.mode}`} key={generatedDraw.mode}>
                <b>{LOTTERY_RULES[generatedDraw.mode].label}</b>
                <div>{generatedDraw.main.map((value, index) => <i key={`${generatedDraw.mode}-${index}`}>{value}</i>)}
                  {generatedDraw.special !== undefined && <><em>+</em><i className="special">{generatedDraw.special}</i></>}
                </div>
              </div>)}
              <p>For entertainment only. Save your favorites after the run.</p>
            </aside>
          </div>
          <footer>
            <span>COMMERCIAL BREAK // RUN PAUSED</span>
            <button type="button" autoFocus onClick={finishLevelCommercial}>Skip Commercial</button>
          </footer>
        </div>
      </section>}
      <div className="arcade-footer">
        <div className="arcade-lives" aria-label={`${playStyle === 'coop' ? 'Co-op team' : `Player ${snapshot.activePlayer + 1}`}, ${snapshot.lives} lives remaining`}>
          {snapshot.playerCount === 2 && <span className="arcade-turn">{playStyle === 'coop' ? 'TEAM' : `P${snapshot.activePlayer + 1}`}</span>}
          {playStyle === 'coop' ? <div className="coop-life-pair" aria-hidden="true">
            <span><img src={`${import.meta.env.BASE_URL}assets/mascot/mascot-reference.webp`} alt="" /><b>{snapshot.playerLives[0]}</b></span>
            <span><img className="dog-life" src={`${import.meta.env.BASE_URL}assets/heroes/player2-dog-reference.webp`} alt="" /><b>{snapshot.playerLives[1]}</b></span>
          </div> : Array.from({ length: Math.max(0, snapshot.lives - 1) }, (_, index) => <img className={snapshot.activePlayer === 1 ? 'dog-life' : ''} key={index} src={`${import.meta.env.BASE_URL}${snapshot.activePlayer === 1 ? 'assets/heroes/player2-dog-reference.webp' : 'assets/mascot/mascot-reference.webp'}`} alt="" />)}
        </div>
        <div className="arcade-numbers" aria-label="Collected lottery number slots"><NumberSlots mode={draw.mode} values={snapshot.revealed} scrambled={snapshot.warning?.includes('scrambled')} /></div>
        <span className="arcade-level"><b>LEVEL {snapshot.world + 1} / 10</b><small>{level.name}</small><em>{snapshot.remainingHearts} HEARTS</em></span>
        <div className="game-actions">
          <button ref={pauseButton} onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
          <button onClick={() => { runtime.current?.setPaused(true); setConfirmExit(true); }}>Menu</button>
        </div>
      </div>
      <div className={`mobile-controls ${playStyle === 'coop' ? 'coop' : ''}`} aria-label="Touch controls">
        <div className="player-touch player-one-touch"><small>{playStyle === 'coop' ? 'P1' : 'MOVE'}</small><div className="dpad">
          <button aria-label="Up" onPointerDown={() => dir('up', 0)} onPointerUp={() => dir(null, 0)}>▲</button>
          <button aria-label="Left" onPointerDown={() => dir('left', 0)} onPointerUp={() => dir(null, 0)}>◀</button>
          <button aria-label="Down" onPointerDown={() => dir('down', 0)} onPointerUp={() => dir(null, 0)}>▼</button>
          <button aria-label="Right" onPointerDown={() => dir('right', 0)} onPointerUp={() => dir(null, 0)}>▶</button>
        </div></div>
        <button className="power-button" aria-label="Activate Mind Coin power-up" onClick={() => runtime.current?.activatePowerUp()}>
          <img src={`${import.meta.env.BASE_URL}assets/ui/icons/mind-coin.png`} alt="" />
          <span>POWER</span>
        </button>
        {playStyle === 'coop' && <div className="player-touch player-two-touch"><small>P2</small><div className="dpad">
          <button aria-label="Player 2 up" onPointerDown={() => dir('up', 1)} onPointerUp={() => dir(null, 1)}>▲</button>
          <button aria-label="Player 2 left" onPointerDown={() => dir('left', 1)} onPointerUp={() => dir(null, 1)}>◀</button>
          <button aria-label="Player 2 down" onPointerDown={() => dir('down', 1)} onPointerUp={() => dir(null, 1)}>▼</button>
          <button aria-label="Player 2 right" onPointerDown={() => dir('right', 1)} onPointerUp={() => dir(null, 1)}>▶</button>
        </div></div>}
      </div>
    </main>
  );
}
