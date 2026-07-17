import Phaser from 'phaser';
import { BOSS_RECOVERY_MS, DETROIT_LEVELS, GAME_BALANCE, HEART_BASE_SCORE, HEART_SIZE, LEVEL_ONE_HEART_CAP, MIND_COIN_FRIGHTENED_MS, VILLAIN_RECOVERY_MS, VILLAIN_WAVES, heartGridSpacingForLevel, villainCountForLevel } from '../config/gameBalance';
import { DETROIT_EVENT_DURATION_MS, DETROIT_EVENT_INTERVAL_MS, eventForLevel } from '../config/detroitEvents';
import { EMPTY_MISSION_STATS, evaluateDetroitMissions } from '../config/detroitMissions';
import { BONUS_TIERS, STREET_BONUSES, STREET_BONUS_ORDER, STREET_BONUS_SPAWN_INTERVAL_MS, STREET_BONUS_SPEED_TILES_PER_SECOND, bonusTierForSpawn } from '../config/streetBonuses';
import { COSMETICS } from '../services/playerProgress';
import type { BonusTier, CompassDirection, ControlBindings, ControlPreset, CosmeticId, GameCheckpoint, GameSnapshot, LevelMissionStats, LotteryDraw, PlayerCount, PlayStyle, RunVariant, StreetBonusKind } from '../types/game';
import { chooseForgivingDirection, createMazeDefinition, MAZE_LEVEL_COUNT, OPPOSITE, projectTile, shortestDirection, shouldSnapLateTurn, stepTile, tileKey, validDirections, type CardinalDirection, type GridDirection, type GridPoint, type MazeDefinition } from './MazeGrid';
import { createPortalNetwork, portalGateDurationMs, portalPairForWave, tunnelPortalPair, type PortalPair } from './PortalNetwork';

type EnemyKind = 'tax' | 'reaper' | 'chaos' | 'envy' | 'police';
type VillainMode = 'normal' | 'frightened' | 'returning';

interface RuntimeOptions {
  draw: LotteryDraw;
  playerCount: PlayerCount;
  playStyle: PlayStyle;
  runVariant: RunVariant;
  cosmetic: CosmeticId;
  muted: boolean;
  effectsVolume: number;
  reducedMotion: boolean;
  screenShake: boolean;
  gameSpeed: number;
  haptics: boolean;
  p1Controls: ControlPreset;
  p2Controls: ControlPreset;
  p1Bindings: ControlBindings;
  p2Bindings: ControlBindings;
  initialCheckpoint: GameCheckpoint | null;
  onCheckpoint: (checkpoint: GameCheckpoint) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onPausedChange: (paused: boolean) => void;
  onLevelBreak: (completedLevelIndex: number, continueRun: () => void) => void;
  onComplete: (result: { score: number; villainEncounters: number; powerUpsUsed: number; playerScores: [number, number]; heartsCollected: number; bonusesCollected: number; bestCombo: number; missedBonuses: number; eventsCompleted: number; levelGrades: Array<'S' | 'A' | 'B' | 'C'>; missionsCompleted: number; timeAttackBonus: number }) => void;
}

interface GridMover {
  tile: GridPoint;
  next: GridPoint | null;
  progress: number;
  direction: GridDirection;
  queued: GridDirection;
  speed: number;
}

interface Villain extends GridMover {
  kind: EnemyKind;
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  spawn: GridPoint;
  releaseAt: number;
  mode: VillainMode;
  baseFrame: number;
  isBoss: boolean;
}

interface StreetBonus extends GridMover {
  kind: StreetBonusKind;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  expiresAt: number;
  tier: BonusTier;
}

interface PortalVisual {
  container: Phaser.GameObjects.Container;
  halo: Phaser.GameObjects.Ellipse;
  core: Phaser.GameObjects.Ellipse;
  outer: Phaser.GameObjects.Ellipse;
  middle: Phaser.GameObjects.Ellipse;
  orbit: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  labelText: string;
  color: number;
  orbitColor: number;
}

export interface GameRuntimeHandle {
  destroy: () => void;
  setDirection: (direction: 'up' | 'down' | 'left' | 'right' | null, player?: 0 | 1) => void;
  activatePowerUp: () => void;
  setPaused: (paused: boolean) => void;
  setEffectsVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setBindings: (player: 0 | 1, bindings: ControlBindings) => void;
  saveCheckpoint: () => void;
  restartLevel: () => void;
}

const TILE = 21;
const ORIGIN_X = 39.5;
const ORIGIN_Y = 7.5;
const GAME_WIDTH = 520;
const GAME_HEIGHT = 540;
const LEVEL_PALETTES = [
  { primary: 0x35dfff, secondary: 0xffd45d, lane: 0xffe27a, road: 0x061826, portalLeft: 0x54eaff, portalRight: 0xb06cff, powerUp: 0x6ff7ff },
  { primary: 0xffa33d, secondary: 0x48e6ff, lane: 0xffcf54, road: 0x211106, portalLeft: 0xffb04e, portalRight: 0x36d9ff, powerUp: 0xffbd5a },
  { primary: 0x4d9dff, secondary: 0xbdeeff, lane: 0x8bd7ff, road: 0x071a32, portalLeft: 0x62c9ff, portalRight: 0x8c7cff, powerUp: 0x8bc8ff },
  { primary: 0xff5d9e, secondary: 0xffb35a, lane: 0xff799f, road: 0x250914, portalLeft: 0xff6fb4, portalRight: 0xffb347, powerUp: 0xff64bc },
  { primary: 0xffd45d, secondary: 0xb07cff, lane: 0xffe680, road: 0x1d1504, portalLeft: 0xffd75d, portalRight: 0x9e78ff, powerUp: 0xffe15c },
  { primary: 0xff873d, secondary: 0xff70ca, lane: 0xffbf68, road: 0x281006, portalLeft: 0xff874e, portalRight: 0xff68cc, powerUp: 0xff784e },
  { primary: 0x42f5a1, secondary: 0x42dff5, lane: 0x8dffbf, road: 0x052018, portalLeft: 0x43f5ae, portalRight: 0x3cd7ff, powerUp: 0x56ffb0 },
  { primary: 0x49b8ff, secondary: 0xff4d65, lane: 0xffe05b, road: 0x07182a, portalLeft: 0x42c8ff, portalRight: 0xff526f, powerUp: 0x4da7ff },
  { primary: 0xb574ff, secondary: 0x61efff, lane: 0xe2a4ff, road: 0x160925, portalLeft: 0xb66dff, portalRight: 0x53efff, powerUp: 0xc886ff },
  { primary: 0xffd84d, secondary: 0xf46bff, lane: 0xffffff, road: 0x241c04, portalLeft: 0xffdd55, portalRight: 0xf067ff, powerUp: 0xffffff }
] as const;
const WORLD_ACCENTS = LEVEL_PALETTES.map(palette => palette.primary);
const DETROIT_STREETS = [
  'GRATIOT', 'MACK', 'E. WARREN', 'JEFFERSON', 'HARPER', 'VAN DYKE', 'CONNER', 'CHALMERS',
  'CADIEUX', 'KERCHEVAL', '6 MILE', '7 MILE', '8 MILE', 'WOODWARD', 'MORANG', 'KELLY',
  'E. MCNICHOLS', 'MT. ELLIOTT', 'ALTER', 'LAFAYETTE', 'HAYES', 'FRENCH', 'MCCLELLAN', 'E. FOREST'
] as const;
const WESTSIDE_STREETS = [
  'LIVERNOIS', 'GRAND RIVER', 'JOY RD', 'DEXTER', 'DAVISON', 'CHICAGO', 'TIREMAN', 'W. WARREN',
  'PLYMOUTH', 'FENKELL', 'W. MCNICHOLS', 'GREENFIELD', 'WYOMING', 'SCHAEFER', 'MCGRAW',
  'PURITAN', 'MEYERS', 'EVERGREEN', 'LAHSER', 'W. GRAND BLVD', 'FULLERTON', 'SCHOOLCRAFT', 'W. 7 MILE', 'W. 8 MILE'
] as const;
const ENEMY_KINDS: EnemyKind[] = ['tax', 'reaper', 'chaos', 'envy', 'police'];
type VillainTactic = (typeof VILLAIN_WAVES)[number]['tactic'];
const LEVEL_PLAYER_SPEED = [1, 1.06, 0.98, 1.08, 1, 1.04, 1.08, 1.05, 1.1, 1.14] as const;
const LEVEL_VILLAIN_SPEED = [1, 1.04, 0.88, 1.08, 1, 1.04, 1.08, 1.16, 1.12, 1.24] as const;
const TIME_ATTACK_LEVEL_MS = [110_000, 105_000, 100_000, 95_000, 95_000, 90_000, 90_000, 85_000, 85_000, 90_000] as const;
const DISTRICT_CAPTAINS = new Map<number, EnemyKind>([[1, 'chaos'], [3, 'police'], [5, 'reaper'], [7, 'police'], [9, 'chaos']]);
const controls: { directions: [CardinalDirection | null, CardinalDirection | null]; activate: boolean } = { directions: [null, null], activate: false };
let sceneRef: { scene: Phaser.Scenes.ScenePlugin; disposeAudio: () => void; saveProgressCheckpoint: () => void; restartCurrentLevel: () => void } | null = null;

function createMover(tile: GridPoint, speed: number): GridMover {
  return { tile: { ...tile }, next: null, progress: 0, direction: 'none', queued: 'none', speed };
}

function copyPoint(point: GridPoint): GridPoint { return { x: point.x, y: point.y }; }

export function createGameRuntime(parent: HTMLElement, options: RuntimeOptions): GameRuntimeHandle {
  const values = [...options.draw.main, ...(options.draw.special === undefined ? [] : [options.draw.special])];
  const portalRunSeed = values.reduce((seed, value, index) => Math.imul(seed ^ (value + index * 37), 0x45d9f3b) >>> 0, 0x313777);
  const pressedCodes = new Set<string>();

  class MazeScene extends Phaser.Scene {
    private maze: MazeDefinition = createMazeDefinition();
    private player!: Phaser.GameObjects.Sprite;
    private player2?: Phaser.GameObjects.Sprite;
    private playerShadows: Array<Phaser.GameObjects.Ellipse | undefined> = [];
    private playerLabels: Array<Phaser.GameObjects.Text | undefined> = [];
    private forceFields: Array<Phaser.GameObjects.Arc | undefined> = [];
    private forceFieldUntil: [number, number] = [0, 0];
    private playerMover: GridMover = createMover(this.maze.playerSpawn, 5.7);
    private player2Mover: GridMover = createMover(this.maze.player2Spawn, 5.7);
    private villains: Villain[] = [];
    private worldObjects: Phaser.GameObjects.GameObject[] = [];
    private cityBackground?: Phaser.GameObjects.Image;
    private cityNear?: Phaser.GameObjects.Image;
    private cityWash?: Phaser.GameObjects.Rectangle;
    private cityDepthLights: Phaser.GameObjects.Rectangle[] = [];
    private streetDecor: Array<Phaser.GameObjects.Image | Phaser.GameObjects.Text> = [];
    private pelletObjects = new Map<string, Phaser.GameObjects.GameObject>();
    private powerPellets = new Set<string>();
    private portalPoints: GridPoint[] = [];
    private portalPairs: PortalPair[] = [];
    private portalLinks = new Map<string, GridPoint>();
    private activePortalKeys = new Set<string>();
    private portalVisuals = new Map<string, PortalVisual>();
    private portalGateSeed = portalRunSeed;
    private portalWaveIndex = 0;
    private activePortalPair = -1;
    private previousPortalPair = -1;
    private nextPortalGateChangeAt = 0;
    private portalCooldownUntil: [number, number] = [0, 0];
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private world = 0;
    private score = 0;
    private playerScores: [number, number] = [0, 0];
    private playerLives: [number, number] = [GAME_BALANCE.startingLives, GAME_BALANCE.startingLives];
    private playerShields: [boolean, boolean] = [true, true];
    private downedPlayers: [boolean, boolean] = [false, false];
    private reviveProgress: [number, number] = [0, 0];
    private activePlayer: 0 | 1 = 0;
    private pellets = 0;
    private lives = GAME_BALANCE.startingLives;
    private combo = 1;
    private revealed: Array<number | null> = Array(values.length).fill(null);
    private nextReveal = 0;
    private initialPellets = 0;
    private worldCollected = 0;
    private worldRevealStart = 0;
    private frightenedUntil = 0;
    private frightenedCombo = 0;
    private villainTactic: VillainTactic = 'scatter';
    private villainWaveIndex = 0;
    private villainWaveRemainingMs: number = VILLAIN_WAVES[0].durationMs;
    private luckyRushUntil = 0;
    private hitUntil = 0;
    private hasMoved = false;
    private shielded = true;
    private warning = '';
    private warningUntil = 0;
    private blockedFeedbackUntil = 0;
    private villainEncounters = 0;
    private powerUpsUsed = 0;
    private usedPortal = false;
    private revivesCompleted = 0;
    private bossHealth = 0;
    private bossMaxHealth = 0;
    private bossLabel = '';
    private districtBossKind?: EnemyKind;
    private lastCheckpointAt = 0;
    private worldStartScore = 0;
    private lastStormCycle = -1;
    private completed = false;
    private roundReadyUntil = 0;
    private lastPelletAt = 0;
    private lastCollector: 0 | 1 | null = null;
    private lastTeamCollectAt = 0;
    private gamepadPowerPressed = false;
    private audio?: AudioContext;
    private quotas: number[] = [];
    private activeBonus?: StreetBonus;
    private nextBonusAt = 0;
    private bonusSpawnIndex = 0;
    private bonusEffect?: StreetBonusKind;
    private bonusEffectTier?: BonusTier;
    private bonusEffectUntil = 0;
    private doubleScoreUntil = 0;
    private bonusesCollected = 0;
    private lastSpeedTrailAt = 0;
    private bestCombo = 1;
    private teamCombo = 0;
    private missedBonuses = 0;
    private eventsCompleted = 0;
    private levelGrades: Array<'S' | 'A' | 'B' | 'C'> = [];
    private nextDetroitEventAt = 0;
    private eventActiveUntil = 0;
    private eventName = '';
    private bonusCueArmed = true;
    private lastHudTick = -1;
    private focusDimmed = false;
    private levelTimeRemainingMs: number = TIME_ATTACK_LEVEL_MS[0];
    private timeAttackBonus = 0;
    private portalComboUntil = 0;
    private portalComboChain = 0;
    private levelMissionStats: LevelMissionStats = { ...EMPTY_MISSION_STATS };
    private missionRewardsClaimed = new Set<string>();
    private missionsCompleted = 0;
    private readonly portraitMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
    private mobileCameraFocus?: Phaser.GameObjects.Zone;

    constructor() { super('lotto-grid-maze'); }

    preload(): void {
      const base = import.meta.env.BASE_URL;
      this.load.spritesheet('mascot', `${base}assets/mascot/mascot-atlas.webp`, { frameWidth: 181, frameHeight: 181 });
      this.load.spritesheet('player2Dog', `${base}assets/heroes/player2-dog-atlas.webp`, { frameWidth: 256, frameHeight: 256 });
      this.load.spritesheet('villains', `${base}assets/villains/villains-atlas.webp`, { frameWidth: 362, frameHeight: 362 });
      this.load.spritesheet('envy', `${base}assets/villains/envy-crew-strip.webp`, { frameWidth: 362, frameHeight: 724 });
      this.load.spritesheet('police', `${base}assets/villains/jackpot-patrol-strip.webp`, { frameWidth: 362, frameHeight: 724 });
      this.load.image('mindCoin', `${base}assets/ui/icons/mind-coin.png`);
      this.load.image('loveHeart', `${base}assets/ui/icons/clarity-heart.png`);
      this.load.image('detroitStreetSign', `${base}assets/ui/detroit-street-sign-blank.webp`);
      this.load.image('bonusCash', `${base}assets/bonuses/cash-bonus.webp`);
      this.load.image('bonusTicket', `${base}assets/bonuses/lottery-ticket-bonus.webp`);
      this.load.image('bonusScratch', `${base}assets/bonuses/scratch-off-bonus.webp`);
      this.load.image('world1', `${base}assets/environments/world-1-detroit-city.webp`);
      this.load.image('world2', `${base}assets/environments/world-2-dream-oracle-temple.webp`);
      this.load.image('world3', `${base}assets/environments/world-3-jackpot-vault.webp`);
    }

    create(): void {
      sceneRef = this;
      controls.directions = [null, null]; controls.activate = false;
      this.quotas = Array.from({ length: MAZE_LEVEL_COUNT }, () => 0);
      values.forEach((_, index) => { const level = values.length === 1 ? MAZE_LEVEL_COUNT - 1 : Math.round((index * (MAZE_LEVEL_COUNT - 1)) / (values.length - 1)); this.quotas[level] += 1; });
      const checkpoint = options.initialCheckpoint;
      if (checkpoint) {
        this.world = checkpoint.world; this.score = checkpoint.score; this.activePlayer = checkpoint.activePlayer;
        this.playerScores = [...checkpoint.playerScores] as [number, number]; this.playerLives = [...checkpoint.playerLives] as [number, number]; this.playerShields = [...checkpoint.playerShields] as [boolean, boolean];
        this.lives = checkpoint.lives; this.shielded = checkpoint.shielded; this.revealed = [...checkpoint.revealed]; this.nextReveal = checkpoint.nextReveal;
        this.pellets = checkpoint.pellets; this.villainEncounters = checkpoint.villainEncounters; this.powerUpsUsed = checkpoint.powerUpsUsed;
        this.bonusesCollected = checkpoint.bonusesCollected ?? 0;
        this.bestCombo = checkpoint.bestCombo ?? 1;
        this.eventsCompleted = checkpoint.eventsCompleted ?? 0;
        this.missedBonuses = checkpoint.missedBonuses ?? 0;
        this.levelGrades = [...(checkpoint.levelGrades ?? [])];
        this.bossHealth = checkpoint.bossHealth ?? 0;
        this.missionsCompleted = checkpoint.missionsCompleted ?? 0;
      }
      this.playerShadows[0] = this.add.ellipse(0, 0, 30, 10, 0x000000, 0.58).setDepth(19);
      this.player = this.add.sprite(0, 0, 'mascot', 0).setDisplaySize(this.portraitMobile ? 58 : 52, this.portraitMobile ? 58 : 52).setDepth(20);
      this.forceFields[0] = this.add.circle(0, 0, 27, 0x43dcff, 0.06).setStrokeStyle(2, 0x9bf6ff, 0.95).setDepth(22).setVisible(false);
      if (options.playStyle === 'coop') {
        this.playerShadows[1] = this.add.ellipse(0, 0, 38, 10, 0x000000, 0.58).setDepth(19);
        this.player2 = this.add.sprite(0, 0, 'player2Dog', 20).setDisplaySize(this.portraitMobile ? 74 : 68, this.portraitMobile ? 59 : 54).setDepth(21);
        this.forceFields[1] = this.add.circle(0, 0, 27, 0xff5dcb, 0.05).setStrokeStyle(2, 0xffa1e7, 0.95).setDepth(23).setVisible(false);
      }
      this.playerLabels[0] = this.add.text(0, 0, '', {}).setVisible(false);
      if (this.player2) this.playerLabels[1] = this.add.text(0, 0, '', {}).setVisible(false);
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,I,J,K,L,SPACE,P,M') as Record<string, Phaser.Input.Keyboard.Key>;
      this.keys.M.on('down', () => { options.muted = !options.muted; });
      if (this.portraitMobile) {
        this.mobileCameraFocus = this.add.zone(this.pixelX(this.maze.playerSpawn.x), this.pixelY(this.maze.playerSpawn.y), 1, 1);
        this.cameras.main.setRoundPixels(true).setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT).setZoom(options.playStyle === 'coop' ? 1.08 : 1.14).startFollow(this.mobileCameraFocus, true, 0.12, 0.12);
      }
      this.createWorld();
    }

    private createWorld(): void {
      this.activeBonus?.container.destroy(); this.activeBonus = undefined;
      this.worldObjects.forEach(object => object.destroy()); this.worldObjects = [];
      this.villains.forEach(villain => { villain.sprite.destroy(); villain.shadow.destroy(); villain.label.destroy(); }); this.villains = [];
      this.portalVisuals.clear(); this.activePortalKeys.clear();
      this.pelletObjects.clear(); this.powerPellets.clear(); this.maze = createMazeDefinition(this.world);
      const portalNetwork = createPortalNetwork(this.maze, this.world, portalRunSeed);
      this.portalPoints = portalNetwork.portals;
      this.portalPairs = portalNetwork.pairs;
      this.portalLinks = portalNetwork.links;
      this.portalGateSeed = (portalRunSeed ^ Math.imul(this.world + 1, 0x9e3779b9)) >>> 0;
      this.portalWaveIndex = 0;
      this.activePortalPair = -1;
      this.previousPortalPair = -1;
      this.nextPortalGateChangeAt = 0;
      this.portalCooldownUntil = [0, 0];
      this.portalComboUntil = 0; this.portalComboChain = 0;
      this.cityDepthLights = [];
      this.streetDecor = [];
      this.worldCollected = options.initialCheckpoint?.world === this.world ? options.initialCheckpoint.worldCollected ?? 0 : 0;
      this.worldRevealStart = this.quotas.slice(0, this.world).reduce((sum, quota) => sum + quota, 0); this.frightenedUntil = 0; this.frightenedCombo = 0;
      this.usedPortal = false;
      this.bonusEffect = undefined; this.bonusEffectTier = undefined; this.bonusEffectUntil = 0; this.doubleScoreUntil = 0; this.forceFieldUntil = [0, 0];
      this.forceFields.forEach(field => field?.setVisible(false));
      this.nextBonusAt = this.time.now + STREET_BONUS_SPAWN_INTERVAL_MS;
      this.bonusCueArmed = true;
      this.nextDetroitEventAt = this.time.now + DETROIT_EVENT_INTERVAL_MS;
      this.eventActiveUntil = 0; this.eventName = ''; this.lastHudTick = -1;
      this.districtBossKind = DISTRICT_CAPTAINS.get(this.world);
      this.bossMaxHealth = this.districtBossKind ? this.world === MAZE_LEVEL_COUNT - 1 ? 3 : 2 : 0;
      this.bossHealth = this.bossMaxHealth ? options.initialCheckpoint?.world === this.world ? options.initialCheckpoint.bossHealth ?? this.bossMaxHealth : this.bossMaxHealth : 0;
      this.bossLabel = this.bossMaxHealth ? this.world === MAZE_LEVEL_COUNT - 1 ? 'VAULT BOSS' : `DISTRICT ${this.world + 1} CAPTAIN` : '';
      const restoringWorld = options.initialCheckpoint?.world === this.world;
      this.levelTimeRemainingMs = restoringWorld ? options.initialCheckpoint?.levelTimeRemainingMs ?? TIME_ATTACK_LEVEL_MS[this.world] : TIME_ATTACK_LEVEL_MS[this.world];
      this.levelMissionStats = restoringWorld ? { ...EMPTY_MISSION_STATS, ...options.initialCheckpoint?.levelMissionStats } : { ...EMPTY_MISSION_STATS };
      this.missionRewardsClaimed = new Set(restoringWorld ? options.initialCheckpoint?.missionRewardsClaimed ?? [] : []);
      this.worldStartScore = this.score;
      const treatment = DETROIT_LEVELS[this.world] ?? DETROIT_LEVELS[0];
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      this.forceFields.forEach(field => field?.setFillStyle(palette.powerUp, 0.055).setStrokeStyle(2, palette.powerUp, 0.95));
      const background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'world1').setDisplaySize(GAME_WIDTH + 34, GAME_HEIGHT + 34).setAlpha(0.72).setDepth(-10);
      background.setCrop(80 + (this.world * 67) % 620, 0, 868, 900);
      const cityNear = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'world1').setDisplaySize(GAME_WIDTH + 58, GAME_HEIGHT + 58).setAlpha(0.12).setDepth(-7).setBlendMode(Phaser.BlendModes.SCREEN);
      cityNear.setCrop(110 + (this.world * 67) % 580, 55, 760, 790);
      const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x02060a, 0.28).setDepth(-9);
      const colorWash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, treatment.wash, 0.13).setDepth(-8);
      const lightLeft = this.add.rectangle(88, GAME_HEIGHT / 2, 82, GAME_HEIGHT * 1.2, WORLD_ACCENTS[this.world], 0.045).setAngle(-5).setDepth(-6).setData('baseX', 88).setData('depth', 1);
      const lightRight = this.add.rectangle(GAME_WIDTH - 82, GAME_HEIGHT / 2, 72, GAME_HEIGHT * 1.2, palette.secondary, 0.045).setAngle(6).setDepth(-6).setData('baseX', GAME_WIDTH - 82).setData('depth', -1);
      this.cityBackground = background; this.cityNear = cityNear; this.cityWash = colorWash; this.cityDepthLights = [lightLeft, lightRight];
      this.worldObjects.push(background, shade, colorWash, cityNear, lightLeft, lightRight);
      this.drawRoadSurface();
      this.createLevelAtmosphere();
      const cityLabel = this.add.text(GAME_WIDTH / 2, 6, `DETROIT • ${treatment.name.toUpperCase()}`, { fontFamily: 'monospace', fontSize: '10px', color: '#ffd76a', letterSpacing: 1.5, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(6);
      this.worldObjects.push(cityLabel);
      this.applyPlayerStyle();
      this.drawMaze(); this.createPellets(); this.createVillains(); this.resetMovers(this.time.now, 2300);
      this.setWarning(`${options.runVariant === 'timeAttack' ? 'TIME ATTACK • ' : options.runVariant === 'daily' ? 'DAILY DETROIT • ' : ''}${options.playStyle === 'coop' ? 'CO-OP • ' : options.playStyle === 'alternating' ? `PLAYER ${this.activePlayer + 1} • ` : ''}LEVEL ${this.world + 1} READY!`, 2300);
      this.emitSnapshot();
    }

    private drawRoadSurface(): void {
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      const roads = this.add.graphics().setDepth(-4);
      roads.fillStyle(palette.road, 0.72);
      for (let y = 0; y < this.maze.height; y += 1) for (let x = 0; x < this.maze.width; x += 1) {
        if (this.maze.rows[y][x] === '#') continue;
        roads.fillRect(ORIGIN_X + x * TILE - 1, ORIGIN_Y + y * TILE - 1, TILE + 2, TILE + 2);
      }
      this.worldObjects.push(roads);
    }

    private createLevelAtmosphere(): void {
      const accent = WORLD_ACCENTS[this.world];
      if (this.world === 2) {
        for (let index = 0; index < 4; index += 1) {
          const fog = this.add.ellipse(70 + index * 135, 120 + index * 105, 230, 46, 0xbdeeff, 0.055).setDepth(-3);
          this.worldObjects.push(fog);
          if (!options.reducedMotion) this.tweens.add({ targets: fog, x: fog.x + (index % 2 ? -90 : 90), alpha: 0.1, duration: 4200 + index * 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }
      }
      if (this.world === 3 || this.world === 6) {
        const pulse = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 68, GAME_HEIGHT - 46, accent, 0.025).setStrokeStyle(3, accent, 0.15).setDepth(-2);
        this.worldObjects.push(pulse);
        if (!options.reducedMotion) this.tweens.add({ targets: pulse, alpha: 0.14, duration: this.world === 3 ? 760 : 1250, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (this.world === 5) {
        for (const x of [120, 260, 400]) {
          const light = this.add.rectangle(x, GAME_HEIGHT / 2, 36, GAME_HEIGHT * 1.2, 0xff70ca, 0.04).setAngle(x / 22 - 12).setDepth(-2);
          this.worldObjects.push(light);
          if (!options.reducedMotion) this.tweens.add({ targets: light, angle: light.angle + 12, alpha: 0.1, duration: 1700 + x, yoyo: true, repeat: -1 });
        }
      }
      if (this.world === 8) {
        for (let index = 0; index < 34; index += 1) {
          const rain = this.add.rectangle((index * 47) % GAME_WIDTH, (index * 83) % GAME_HEIGHT, 1.2, 16, 0x8eeaff, 0.18).setAngle(12).setDepth(4);
          this.worldObjects.push(rain);
          if (!options.reducedMotion) this.tweens.add({ targets: rain, y: GAME_HEIGHT + 24, x: rain.x + 36, duration: 850 + index * 17, repeat: -1 });
        }
      }
      if (this.world === 9) {
        const finale = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffd45d, 0.025).setDepth(3);
        this.worldObjects.push(finale);
        if (!options.reducedMotion) this.tweens.add({ targets: finale, alpha: 0.12, duration: 520, yoyo: true, repeat: -1 });
      }
    }

    private drawMaze(): void {
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      const accent = palette.primary;
      const outerStreet = palette.secondary;
      const innerStreet = palette.primary;
      const walls = this.add.graphics().setDepth(2);
      const drawWall = (left: number, top: number, width: number, height: number, radius = 8, fill = true) => {
        if (fill) { walls.fillStyle(0x03070b, 0.88); walls.fillRoundedRect(left, top, width, height, radius); }
        walls.lineStyle(3, accent, 0.28); walls.strokeRoundedRect(left, top, width, height, radius);
        walls.lineStyle(2.2, outerStreet, 0.94); walls.strokeRoundedRect(left + 1.5, top + 1.5, width - 3, height - 3, Math.max(2, radius - 1));
        walls.lineStyle(1.2, innerStreet, 0.92); walls.strokeRoundedRect(left + 4.5, top + 4.5, width - 9, height - 9, Math.max(2, radius - 4));
      };
      drawWall(ORIGIN_X + 2, ORIGIN_Y + 2, this.maze.width * TILE - 4, this.maze.height * TILE - 4, 13, false);
      this.drawDetroitRoadMarkings(walls);
      // A larger gutter makes one-tile turns look open enough for the oversized
      // character sprites, matching the forgiving logical collision grid.
      this.maze.wallBlocks.forEach(block => {
        const gutter = block.width === 1 || block.height === 1 ? 6 : 8;
        drawWall(ORIGIN_X + block.x * TILE + gutter, ORIGIN_Y + block.y * TILE + gutter, block.width * TILE - gutter * 2, block.height * TILE - gutter * 2, 6);
      });
      drawWall(this.pixelX(7) - TILE / 2 + 8, this.pixelY(9) - TILE / 2 + 8, TILE * 7 - 16, TILE * 5 - 16, 8);
      this.worldObjects.push(walls);
      this.createPortals();
      const door = this.add.rectangle(this.pixelX(10), this.pixelY(9), TILE - 3, 4, 0xffb8d9, 1).setDepth(5);
      this.worldObjects.push(door);
      this.createDetroitStreetLabels();
    }

    private createPortals(): void {
      const makePortal = (point: GridPoint, color: number, orbitColor: number, direction: 'left' | 'right', labelText: string, sidePortal = false): PortalVisual => {
        const portal = this.add.container(this.pixelX(point.x), this.pixelY(point.y)).setDepth(12);
        const size = sidePortal ? 1.12 : 1;
        const backplate = this.add.ellipse(0, 0, 38 * size, 50 * size, 0x02030a, 0.98).setStrokeStyle(5, 0x02030a, 0.94);
        const halo = this.add.ellipse(0, 0, 39 * size, 51 * size, color, 0.18).setStrokeStyle(4, color, 0.58);
        const outer = this.add.ellipse(0, 0, 31 * size, 43 * size, 0x000000, 0).setStrokeStyle(3.5, color, 1);
        const middle = this.add.ellipse(0, 0, 24 * size, 36 * size, 0x000000, 0).setStrokeStyle(2.5, orbitColor, 1);
        const core = this.add.ellipse(0, 0, 15 * size, 28 * size, 0x01020a, 1).setStrokeStyle(1.5, 0xffffff, 0.62);
        const rimTop = this.add.ellipse(direction === 'left' ? 2 : -2, -1, 8 * size, 23 * size, color, 0.25);
        const orbit = this.add.container(0, 0);
        const sparkA = this.add.circle(0, -22 * size, 2.4, 0xffffff, 1);
        const sparkB = this.add.circle(0, 22 * size, 2.1, orbitColor, 1);
        const sparkC = this.add.circle(direction === 'left' ? -15 * size : 15 * size, 0, 1.9, color, 1);
        const pairLabel = this.add.text(0, 0, labelText, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: sidePortal ? '9px' : '7px', color: '#ffffff', stroke: '#020207', strokeThickness: 2 }).setOrigin(0.5);
        const directionMark = sidePortal
          ? this.add.text(direction === 'left' ? 22 : -22, 0, direction === 'left' ? '<' : '>', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '11px', color: '#ffffff', stroke: '#020207', strokeThickness: 2 }).setOrigin(0.5)
          : null;
        orbit.add([sparkA, sparkB, sparkC]);
        portal.add([backplate, halo, rimTop, core, outer, middle, orbit, pairLabel]);
        if (directionMark) portal.add(directionMark);
        this.worldObjects.push(portal);
        if (!options.reducedMotion) {
          this.tweens.add({ targets: halo, scaleX: 1.12, scaleY: 1.07, alpha: 0.32, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
          this.tweens.add({ targets: middle, scaleX: 0.84, scaleY: 1.08, alpha: 0.68, duration: 430, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
          this.tweens.add({ targets: orbit, angle: direction === 'left' ? -360 : 360, duration: 1900, repeat: -1 });
        }
        return { container: portal, halo, core, outer, middle, orbit, label: pairLabel, labelText, color, orbitColor };
      };
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      const cosmetic = COSMETICS.find(item => item.id === options.cosmetic) ?? COSMETICS[0];
      const portalLeft = cosmetic.portalBoost || palette.portalLeft;
      const portalRight = cosmetic.portalBoost || palette.portalRight;
      const sidePair = tunnelPortalPair(this.maze);
      makePortal(sidePair.entry, portalLeft, portalRight, 'left', 'S', true);
      makePortal(sidePair.exit, portalRight, portalLeft, 'right', 'S', true);
      this.portalPoints.forEach((point, index) => {
        const first = index % 2 === 0;
        const visual = makePortal(point, first ? portalLeft : portalRight, first ? portalRight : portalLeft, first ? 'left' : 'right', `${Math.floor(index / 2) + 1}`);
        this.portalVisuals.set(tileKey(point), visual);
      });
      this.setActivePortalPair(-1, false);
      this.nextPortalGateChangeAt = this.time.now + portalGateDurationMs(this.portalGateSeed, this.portalWaveIndex, 'closed');
    }

    private applyPortalVisualState(visual: PortalVisual, active: boolean, animate = true): void {
      this.tweens.killTweensOf(visual.container);
      visual.orbit.setVisible(active);
      visual.label.setText(active ? visual.labelText : 'OFF').setColor(active ? '#ffffff' : '#8c9aa8').setFontSize(active ? 7 : 5);
      visual.halo.setFillStyle(active ? visual.color : 0x26343f, active ? 0.18 : 0.06).setStrokeStyle(active ? 4 : 2, active ? visual.color : 0x53606c, active ? 0.58 : 0.32);
      visual.core.setFillStyle(active ? 0x01020a : 0x07101a, 1).setStrokeStyle(1.5, active ? 0xffffff : 0x53606c, active ? 0.62 : 0.35);
      visual.outer.setStrokeStyle(active ? 3.5 : 2, active ? visual.color : 0x53606c, active ? 1 : 0.45);
      visual.middle.setStrokeStyle(active ? 2.5 : 2, active ? visual.orbitColor : 0x33414d, active ? 1 : 0.35);
      const scale = active ? 1 : 0.82;
      const alpha = active ? 1 : 0.58;
      if (animate && !options.reducedMotion) {
        this.tweens.add({ targets: visual.container, scaleX: scale, scaleY: scale, alpha, duration: 240, ease: active ? 'Back.Out' : 'Sine.Out' });
      } else {
        visual.container.setScale(scale).setAlpha(alpha);
      }
    }

    private setActivePortalPair(pairIndex: number, animate = true): void {
      this.activePortalPair = pairIndex;
      this.activePortalKeys.clear();
      this.portalPairs.forEach((pair, index) => {
        const active = index === pairIndex;
        for (const point of [pair.entry, pair.exit]) {
          const key = tileKey(point);
          if (active) this.activePortalKeys.add(key);
          const visual = this.portalVisuals.get(key);
          if (visual) this.applyPortalVisualState(visual, active, animate);
        }
      });
    }

    private updatePortalGates(time: number): void {
      if (!this.portalPairs.length || time < this.nextPortalGateChangeAt) return;
      if (this.activePortalPair >= 0) {
        const sealedPair = this.activePortalPair;
        this.setActivePortalPair(-1);
        this.nextPortalGateChangeAt = time + portalGateDurationMs(this.portalGateSeed, this.portalWaveIndex, 'closed');
        this.setWarning(`PORTAL ${sealedPair + 1} SEALED • NETWORK REROUTING`, 850);
        return;
      }
      const pair = portalPairForWave(this.portalPairs.length, this.portalGateSeed, this.portalWaveIndex, this.previousPortalPair);
      this.previousPortalPair = pair;
      this.setActivePortalPair(pair);
      const openFor = portalGateDurationMs(this.portalGateSeed, this.portalWaveIndex, 'open');
      this.nextPortalGateChangeAt = time + openFor;
      this.portalWaveIndex += 1;
      this.setWarning(`PORTAL ${pair + 1} OPEN • ${Math.round(openFor / 1000)}s`, 1200);
      this.tone(620 + pair * 90, 0.12);
    }

    private drawDetroitRoadMarkings(roads: Phaser.GameObjects.Graphics): void {
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      roads.fillStyle(palette.lane, 0.3);
      for (let x = 1; x < this.maze.width - 1; x += 2) {
        roads.fillRect(this.pixelX(x) - 4, this.pixelY(1) - 1, 8, 2);
        roads.fillRect(this.pixelX(x) - 4, this.pixelY(this.maze.height - 2) - 1, 8, 2);
      }
      for (let y = 2; y < this.maze.height - 2; y += 2) {
        roads.fillRect(this.pixelX(1) - 1, this.pixelY(y) - 4, 2, 8);
        roads.fillRect(this.pixelX(this.maze.width - 2) - 1, this.pixelY(y) - 4, 2, 8);
      }
      roads.fillStyle(palette.secondary, 0.22);
      for (let stripe = -3; stripe <= 3; stripe += 1) roads.fillRect(this.pixelX(10) + stripe * 3 - 1, this.pixelY(19) - 8, 2, 16);

      // Each map gets a distinct colored cross-route. Only walkable tiles are
      // marked, so the treatment reinforces the route rather than covering signs.
      const routeRow = 2 + (this.world * 3) % (this.maze.height - 4);
      const routeColumn = 2 + (this.world * 4) % (this.maze.width - 4);
      roads.fillStyle(palette.primary, 0.28);
      for (let x = 1; x < this.maze.width - 1; x += 1) {
        if (this.maze.rows[routeRow][x] !== '#') roads.fillRect(this.pixelX(x) - 5, this.pixelY(routeRow) - 1, 10, 2);
      }
      roads.fillStyle(palette.secondary, 0.24);
      for (let y = 1; y < this.maze.height - 1; y += 1) {
        if (this.maze.rows[y][routeColumn] !== '#') roads.fillRect(this.pixelX(routeColumn) - 1, this.pixelY(y) - 5, 2, 10);
      }
    }

    private createDetroitStreetLabels(): void {
      const streets = this.world === 0 ? [
        { name: 'GRATIOT', x: 3.5, y: 3, size: 7 },
        { name: 'MACK', x: 7.5, y: 3, size: 7 },
        { name: 'E. WARREN', x: 13.5, y: 3, size: 6 },
        { name: 'JEFFERSON', x: 17.5, y: 3, size: 6 },
        { name: 'HARPER', x: 3.5, y: 5.5, size: 7 },
        { name: 'VAN DYKE', x: 17.5, y: 5.5, size: 7 },
        { name: 'CONNER', x: 4, y: 9, size: 7 },
        { name: 'CHALMERS', x: 17, y: 9, size: 6 },
        { name: '6\nM\nI\nL\nE', x: 5, y: 13.5, size: 5 },
        { name: '7\nM\nI\nL\nE', x: 16, y: 13.5, size: 5 },
        { name: '8\nM\nI\nL\nE', x: 8, y: 16.5, size: 5 },
        { name: 'W\nO\nO\nD\nW\nA\nR\nD', x: 13, y: 16.5, size: 5 },
        { name: 'CADIEUX', x: 4, y: 21, size: 7 },
        { name: 'KERCHEVAL', x: 17, y: 21, size: 6 }
      ].map(street => ({ ...street, vertical: street.name.includes('\n'), name: street.name.replace(/\n/g, ' ') })) : [...this.maze.wallBlocks]
        .filter(block => block.width * block.height >= 2)
        .sort((a, b) => a.y - b.y || a.x - b.x || (b.width * b.height) - (a.width * a.height))
        .map((block, index) => {
          const streetSet: readonly string[] = this.world >= 4 ? WESTSIDE_STREETS : DETROIT_STREETS;
          const street = streetSet[(index + this.world * 3) % streetSet.length];
          const vertical = block.width <= 2 && block.height >= 3;
          return { name: street, x: block.x + block.width / 2, y: block.y + block.height / 2, size: vertical ? 6 : block.width >= 3 ? 8 : 7, vertical };
        });
      streets.forEach(street => {
        const x = ORIGIN_X + street.x * TILE;
        const y = ORIGIN_Y + street.y * TILE;
        const labelSize = Math.max(street.size, this.portraitMobile ? 12 : 9);
        const signLength = Phaser.Math.Clamp(street.name.length * (street.size * .72) + 22, 50, street.vertical ? 74 : 112);
        const sign = this.add.image(x, y, 'detroitStreetSign').setDisplaySize(signLength, 23).setDepth(5);
        if (street.vertical) sign.setAngle(90);
        const plaque = this.add.text(
          x,
          y,
          street.name,
          {
            fontFamily: 'Arial Black, Bahnschrift SemiBold, Arial, Helvetica, sans-serif',
            fontSize: `${labelSize}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#001b14',
            strokeThickness: 0.8,
            align: 'center'
          }
        ).setOrigin(0.5).setDepth(6).setResolution(4).setShadow(0, 1, '#00120b', 1, true, true);
        const maxLabelWidth = signLength - 16;
        plaque.setScale(Math.min(1, maxLabelWidth / plaque.width), 1);
        if (street.vertical) plaque.setAngle(90);
        sign.setData('streetDecor', true); plaque.setData('streetDecor', true);
        this.streetDecor.push(sign, plaque);
        this.worldObjects.push(sign, plaque);
      });
    }

    private createPellets(): void {
      const checkpoint = options.initialCheckpoint?.world === this.world ? options.initialCheckpoint : null;
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      const heartSpacing = heartGridSpacingForLevel(this.world);
      const remaining = checkpoint?.remainingHeartKeys ? new Set(checkpoint.remainingHeartKeys) : null;
      const remainingPower = checkpoint?.remainingPowerKeys ? new Set(checkpoint.remainingPowerKeys) : null;
      const powerHeartCount = this.maze.rows.reduce((sum, row) => sum + [...row].filter(token => token === 'o').length, 0);
      const regularHeartCap = this.world === 0 ? Math.max(0, LEVEL_ONE_HEART_CAP - powerHeartCount) : Number.POSITIVE_INFINITY;
      let regularHeartTotal = 0;
      let total = 0;
      for (let y = 0; y < this.maze.height; y += 1) for (let x = 0; x < this.maze.width; x += 1) {
        const token = this.maze.rows[y][x]; if (token !== '.' && token !== 'o') continue;
        const key = tileKey({ x, y });
        if (token === 'o') {
          total += 1;
          if (remaining && !remaining.has(key)) continue;
          const orb = this.add.image(this.pixelX(x), this.pixelY(y), 'mindCoin').setDisplaySize(28, 28).setDepth(8).setTint(palette.powerUp);
          if (!options.reducedMotion) this.tweens.add({ targets: orb, scaleX: orb.scaleX * 1.25, scaleY: orb.scaleY * 1.25, duration: 520, yoyo: true, repeat: -1 });
          this.pelletObjects.set(key, orb); if (!remainingPower || remainingPower.has(key)) this.powerPellets.add(key); this.worldObjects.push(orb);
        } else {
          const sidePortal = y === this.maze.tunnelRow && (x === 0 || x === this.maze.width - 1);
          if (sidePortal || this.portalLinks.has(key) || (x + y * 2) % heartSpacing !== 0) continue;
          if (regularHeartTotal >= regularHeartCap) continue;
          regularHeartTotal += 1;
          total += 1;
          if (remaining && !remaining.has(key)) continue;
          const pellet = this.add.image(this.pixelX(x), this.pixelY(y), 'loveHeart').setDisplaySize(HEART_SIZE, HEART_SIZE).setDepth(7).setData('pellet', true);
          this.pelletObjects.set(key, pellet); this.worldObjects.push(pellet);
        }
      }
      this.initialPellets = total;
      if (checkpoint?.remainingHeartKeys) this.worldCollected = Math.max(checkpoint.worldCollected ?? 0, total - this.pelletObjects.size);
    }

    private createVillains(): void {
      const releaseDelay = [1800, 3600, 5400, 7200, 9000];
      ENEMY_KINDS.slice(0, villainCountForLevel(this.world)).forEach((kind, index) => {
        const texture = kind === 'envy' ? 'envy' : kind === 'police' ? 'police' : 'villains';
        const baseFrame = kind === 'tax' ? 0 : kind === 'reaper' ? 4 : kind === 'chaos' ? 8 : 0;
        const shadow = this.add.ellipse(0, 0, kind === 'envy' || kind === 'police' ? 28 : 30, 9, 0x000000, 0.56).setDepth(17);
        const sprite = this.add.sprite(0, 0, texture, baseFrame).setDepth(18);
        if (kind === 'envy' || kind === 'police') sprite.setDisplaySize(42, 55); else sprite.setDisplaySize(48, 48);
        const label = this.add.text(0, 0, '', {}).setVisible(false);
        const spawn = this.maze.villainSpawns[index];
        const isBoss = kind === this.districtBossKind;
        const villain: Villain = { ...createMover(spawn, 4.15), kind, sprite, shadow, label, spawn: copyPoint(spawn), releaseAt: this.time.now + releaseDelay[index], mode: 'normal', baseFrame, isBoss };
        if (isBoss) sprite.setDisplaySize(kind === 'envy' || kind === 'police' ? 54 : this.world === MAZE_LEVEL_COUNT - 1 ? 62 : 57, kind === 'envy' || kind === 'police' ? 70 : this.world === MAZE_LEVEL_COUNT - 1 ? 62 : 57).setDepth(19);
        this.applyVillainOutline(villain);
        this.villains.push(villain);
      });
    }

    private resetMovers(now: number, readyDelay = 1200): void {
      this.resetVillainWaves();
      Object.assign(this.playerMover, createMover(this.maze.playerSpawn, 5.7));
      this.positionSprite(this.player, this.playerMover);
      if (this.player2) {
        Object.assign(this.player2Mover, createMover(this.maze.player2Spawn, 5.7));
        this.positionSprite(this.player2, this.player2Mover);
      }
      this.roundReadyUntil = now + readyDelay;
      this.villains.forEach((villain, index) => {
        Object.assign(villain, createMover(villain.spawn, 4.15), { releaseAt: this.roundReadyUntil + 1400 + index * 1500, mode: 'normal' as VillainMode });
        this.applyVillainOutline(villain);
        this.positionSprite(villain.sprite, villain);
        villain.sprite.setAlpha(0); villain.shadow.setAlpha(0); villain.label.setAlpha(0);
      });
      this.hasMoved = false; this.hitUntil = this.roundReadyUntil + 2800;
    }

    update(time: number, delta: number): void {
      if (this.completed) return;
      const dt = Math.min(delta / 1000, 0.05);
      this.updateCityDepth();
      this.updateGameplayFocus();
      const requested1 = this.gamepadDirection(0) ?? this.keyboardDirection(0) ?? controls.directions[0];
      const requested2 = options.playStyle === 'coop' ? this.gamepadDirection(1) ?? this.keyboardDirection(1) ?? controls.directions[1] : null;
      if (requested1 && !this.downedPlayers[0]) this.queuePlayerDirection(requested1, 0);
      if (requested2 && !this.downedPlayers[1]) this.queuePlayerDirection(requested2, 1);
      if (this.warningUntil && time >= this.warningUntil) { this.warning = ''; this.warningUntil = 0; this.emitSnapshot(); }
      this.updatePortalGates(time);
      if (time < this.roundReadyUntil) {
        this.positionSprite(this.player, this.playerMover); this.animatePlayer(this.player, this.playerMover, time);
        if (this.player2) { this.positionSprite(this.player2, this.player2Mover); this.animatePlayer(this.player2, this.player2Mover, time); }
        this.updateMobileCameraFocus();
        this.villains.forEach(villain => { this.positionSprite(villain.sprite, villain); this.animateVillain(villain, time); villain.sprite.setAlpha(0); villain.shadow.setAlpha(0); villain.label.setAlpha(0); });
        return;
      }
      if (options.runVariant === 'timeAttack' && this.hasMoved) {
        this.levelTimeRemainingMs -= Math.min(delta, 100);
        if (this.levelTimeRemainingMs <= 0) this.handleTimeAttackExpired(time);
      }
      if (this.portalComboUntil && time >= this.portalComboUntil) { this.portalComboUntil = 0; this.portalComboChain = 0; }
      this.updateDetroitEvent(time);
      const powerDown = this.bindingPowerDown() || this.gamepadPowerDown();
      if (controls.activate || (powerDown && !this.gamepadPowerPressed)) { controls.activate = false; this.activatePowerUp(); }
      this.gamepadPowerPressed = powerDown;
      const advancePlayer = (sprite: Phaser.GameObjects.Sprite, mover: GridMover, playerIndex: 0 | 1) => {
        if (this.downedPlayers[playerIndex]) { mover.direction = 'none'; mover.next = null; this.positionSprite(sprite, mover); return; }
        const trafficPulse = this.world === 3 && Math.floor(time / 1100) % 2 === 0 ? 1.13 : 1;
        const riverFlow = this.world === 6 && (mover.direction === 'left' || mover.direction === 'right') ? 1.12 : 1;
        mover.speed = (time < this.luckyRushUntil ? 7.2 : 5.7) * LEVEL_PLAYER_SPEED[this.world] * trafficPulse * riverFlow * options.gameSpeed;
        const arrivals = this.advanceMover(mover, dt, state => chooseForgivingDirection(this.maze, state.tile, state.queued, state.direction));
        arrivals.forEach(tile => {
          this.collectNearby(tile, time, playerIndex);
          const destination = this.teleportPlayerAtPortal(mover, tile, time, playerIndex);
          if (destination) this.collectNearby(destination, time, playerIndex);
        });
        this.positionSprite(sprite, mover); this.animatePlayer(sprite, mover, time);
      };
      advancePlayer(this.player, this.playerMover, 0);
      if (this.player2) advancePlayer(this.player2, this.player2Mover, 1);
      this.updateMobileCameraFocus();
      this.updateStreetBonuses(time, dt);
      this.updateHeroBonusFx(time);
      this.updateCoopRevive(dt);
      if (this.world === 8) {
        const stormCycle = Math.floor(time / 9000);
        if (stormCycle !== this.lastStormCycle) { this.lastStormCycle = stormCycle; this.frightenedUntil = Math.max(this.frightenedUntil, time + 1600); this.setWarning('NEON STORM • VILLAINS JAMMED', 1200); }
      }
      this.updateVillainWave(time, delta); this.updateVillains(time, dt); this.resolveCollisions(time);
      if (options.playStyle === 'coop' && this.teamCombo > 0 && time - this.lastTeamCollectAt > 3500) this.teamCombo = 0;
      const hudTick = Math.floor(time / 1000);
      if (hudTick !== this.lastHudTick) { this.lastHudTick = hudTick; this.emitSnapshot(); }
    }

    private updateGameplayFocus(): void {
      const shouldDim = this.hasMoved && this.time.now >= this.roundReadyUntil;
      if (shouldDim === this.focusDimmed) return;
      this.focusDimmed = shouldDim;
      this.cityBackground?.setAlpha(shouldDim ? 0.5 : 0.72);
      this.cityNear?.setAlpha(shouldDim ? 0.055 : 0.12);
      this.cityWash?.setAlpha(shouldDim ? 0.08 : 0.13);
      this.streetDecor.forEach(object => object.setAlpha(shouldDim ? 0.62 : 1));
    }

    private updateMobileCameraFocus(): void {
      if (!this.mobileCameraFocus) return;
      const targetX = this.player2 ? (this.player.x + this.player2.x) / 2 : this.player.x;
      const targetY = this.player2 ? (this.player.y + this.player2.y) / 2 : this.player.y;
      this.mobileCameraFocus.setPosition(targetX, targetY);
    }

    private handleTimeAttackExpired(time: number): void {
      this.levelTimeRemainingMs = Math.max(45_000, TIME_ATTACK_LEVEL_MS[this.world] - 20_000);
      const penalty = Math.min(1500, this.score);
      this.score -= penalty;
      const owner = options.playStyle === 'coop' ? 0 : this.activePlayer;
      this.playerScores[owner] = Math.max(0, this.playerScores[owner] - penalty);
      this.combo = 1; this.portalComboChain = 0; this.portalComboUntil = 0;
      this.resetMovers(time, 1600);
      this.setWarning(`TIME EXPIRED • -${penalty} • CLOCK RESET`, 1800);
      this.saveProgressCheckpoint();
    }

    private updateMissionProgress(owner: 0 | 1): void {
      const newlyCompleted = evaluateDetroitMissions(this.world, this.levelMissionStats)
        .filter(mission => mission.complete && !this.missionRewardsClaimed.has(mission.id));
      newlyCompleted.forEach(mission => {
        this.missionRewardsClaimed.add(mission.id);
        this.missionsCompleted += 1;
        this.score += mission.reward;
        this.playerScores[owner] += mission.reward;
        this.setWarning(`MISSION COMPLETE • ${mission.label} • +${mission.reward}`, 1450);
        this.tone(900 + this.missionsCompleted * 18, 0.13);
      });
    }

    private updateDetroitEvent(time: number): void {
      if (this.eventName && time >= this.eventActiveUntil) { this.eventName = ''; this.eventActiveUntil = 0; }
      if (!this.hasMoved) return;
      if (time < this.nextDetroitEventAt) return;
      const event = eventForLevel(this.world);
      this.eventName = event.name; this.eventActiveUntil = time + DETROIT_EVENT_DURATION_MS;
      this.nextDetroitEventAt = time + DETROIT_EVENT_INTERVAL_MS; this.eventsCompleted += 1;
      if (event.effect === 'double-score') this.doubleScoreUntil = Math.max(this.doubleScoreUntil, this.eventActiveUntil);
      if (event.effect === 'villain-jam') { this.frightenedUntil = Math.max(this.frightenedUntil, this.eventActiveUntil); this.reverseVillains(); }
      if (event.effect === 'hero-rush') this.luckyRushUntil = Math.max(this.luckyRushUntil, this.eventActiveUntil);
      if (event.effect === 'shield-team') {
        this.playerShields = [true, options.playerCount === 2 ? true : this.playerShields[1]];
        this.shielded = true;
      }
      if (event.effect === 'bonus-drop' && !this.activeBonus) this.spawnStreetBonus(time);
      this.setWarning(`${event.name} • ${event.callout}`, 2300);
      this.tone(820, 0.14); this.time.delayedCall(120, () => this.tone(1030, 0.12));
      this.saveProgressCheckpoint();
    }

    private updateStreetBonuses(time: number, dt: number): void {
      if (this.bonusEffect && time >= this.bonusEffectUntil) {
        this.bonusEffect = undefined; this.bonusEffectTier = undefined; this.bonusEffectUntil = 0; this.emitSnapshot();
      }
      if (this.activeBonus && time >= this.activeBonus.expiresAt) {
        this.activeBonus.container.destroy(); this.activeBonus = undefined; this.missedBonuses += 1;
        this.nextBonusAt = time + STREET_BONUS_SPAWN_INTERVAL_MS; this.bonusCueArmed = true;
        this.setWarning('STREET BONUS MISSED • NEXT DROP IN 30', 1200);
      }
      const runHasStarted = this.hasMoved || this.pellets > 0;
      const secondsToBonus = Math.ceil((this.nextBonusAt - time) / 1000);
      if (!this.activeBonus && runHasStarted && this.bonusCueArmed && secondsToBonus > 0 && secondsToBonus <= 5) {
        this.bonusCueArmed = false;
        this.setWarning(`STREET BONUS IN ${secondsToBonus} • WATCH THE ARROW`, 1200);
        this.tone(760, 0.09); this.time.delayedCall(100, () => this.tone(980, 0.09));
        if (options.haptics) navigator.vibrate?.([35, 30, 55]);
      }
      if (!this.activeBonus && runHasStarted && time >= this.nextBonusAt) this.spawnStreetBonus(time);
      if (!this.activeBonus) return;
      this.activeBonus.speed = STREET_BONUS_SPEED_TILES_PER_SECOND * options.gameSpeed;
      this.advanceMover(this.activeBonus, dt, mover => this.chooseStreetBonusDirection(mover, time));
      this.positionStreetBonus(this.activeBonus, time);
      const pulse = this.activeBonus.expiresAt - time < 2200 ? 0.58 + Math.sin(time / 80) * 0.28 : 1;
      this.activeBonus.container.setAlpha(pulse);
      const players: Array<{ sprite: Phaser.GameObjects.Sprite; index: 0 | 1 }> = [{ sprite: this.player, index: 0 }];
      if (this.player2) players.push({ sprite: this.player2, index: 1 });
      for (const player of players) {
        if (this.downedPlayers[player.index] || Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, this.activeBonus.container.x, this.activeBonus.container.y) > TILE * 2.15) continue;
        this.collectStreetBonus(time, player.index); break;
      }
    }

    private chooseStreetBonusDirection(mover: GridMover, time: number): CardinalDirection | null {
      const directions = validDirections(this.maze, mover.tile);
      if (!directions.length) return null;
      const forward = directions.filter(direction => mover.direction === 'none' || direction !== OPPOSITE[mover.direction]);
      const choices = forward.length ? forward : directions;
      return choices[(this.bonusSpawnIndex * 3 + mover.tile.x + mover.tile.y + Math.floor(time / 1700)) % choices.length];
    }

    private positionStreetBonus(bonus: StreetBonus, time: number): void {
      let x = bonus.tile.x; let y = bonus.tile.y;
      if (bonus.next) {
        if (bonus.tile.x === 0 && bonus.next.x === this.maze.width - 1 && bonus.direction === 'left') x = -bonus.progress;
        else if (bonus.tile.x === this.maze.width - 1 && bonus.next.x === 0 && bonus.direction === 'right') x = this.maze.width - 1 + bonus.progress;
        else x += (bonus.next.x - bonus.tile.x) * bonus.progress;
        y += (bonus.next.y - bonus.tile.y) * bonus.progress;
      }
      if (x < -0.5) x += this.maze.width; if (x > this.maze.width - 0.5) x -= this.maze.width;
      bonus.container.setPosition(this.pixelX(x), this.pixelY(y));
      bonus.sprite.setY(Math.sin(time / 150) * 3.5);
      bonus.sprite.setAngle(Math.sin(time / 260) * 3);
    }

    private compassDirection(fromX: number, fromY: number, toX: number, toY: number): CompassDirection {
      const angle = Phaser.Math.RadToDeg(Math.atan2(toY - fromY, toX - fromX));
      const directions: CompassDirection[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
      return directions[Math.round((angle + 360) / 45) % 8];
    }

    private syncGateReady(): boolean {
      if (options.playStyle !== 'coop' || !this.player2 || !this.activeBonus) return false;
      const bonus = this.activeBonus.container;
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, bonus.x, bonus.y) <= TILE * 4.5
        && Phaser.Math.Distance.Between(this.player2.x, this.player2.y, bonus.x, bonus.y) <= TILE * 4.5;
    }

    private spawnStreetBonus(time: number): void {
      const candidates: GridPoint[] = [];
      for (let y = 1; y < this.maze.height - 1; y += 1) for (let x = 1; x < this.maze.width - 1; x += 1) {
        if (this.maze.rows[y][x] === '#') continue;
        const tile = { x, y };
        const playerDistances = [this.distanceTiles(tile, this.playerMover.tile)];
        if (this.player2) playerDistances.push(this.distanceTiles(tile, this.player2Mover.tile));
        const nearestPlayer = Math.min(...playerDistances);
        const awayFromPlayers = playerDistances.every(distance => distance >= 3) && nearestPlayer <= 6;
        const awayFromVillains = this.maze.villainSpawns.every(spawn => this.distanceTiles(tile, spawn) >= 3);
        if (awayFromPlayers && awayFromVillains && !this.powerPellets.has(tileKey(tile))) candidates.push(tile);
      }
      if (!candidates.length) { this.nextBonusAt = time + 3000; this.bonusCueArmed = true; return; }
      const kind = STREET_BONUS_ORDER[(this.world + this.bonusSpawnIndex) % STREET_BONUS_ORDER.length];
      const tier = bonusTierForSpawn(this.world, this.bonusSpawnIndex, portalRunSeed);
      this.bonusSpawnIndex += 1;
      const definition = STREET_BONUSES[kind];
      const tierDefinition = BONUS_TIERS[tier];
      const powerColor = this.currentPowerColor();
      const tile = Phaser.Utils.Array.GetRandom(candidates);
      const x = this.pixelX(tile.x); const y = this.pixelY(tile.y);
      const ring = this.add.circle(0, 1, tier === 'gold' ? 20 : tier === 'silver' ? 18.5 : 17, tierDefinition.color, 0.12).setStrokeStyle(tier === 'gold' ? 2.8 : 1.8, tierDefinition.color, 0.98);
      const sprite = this.add.image(0, 0, definition.texture).setDepth(1).setTint(0xffffff, powerColor, 0xffffff, powerColor);
      if (kind === 'cash') sprite.setDisplaySize(32, 26);
      else if (kind === 'ticket') sprite.setDisplaySize(36, 24);
      else sprite.setDisplaySize(30, 30);
      const label = this.add.text(0, 20, `${tierDefinition.label} ${definition.pickupLabel}`, {
        fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '6px', color: tierDefinition.colorCss,
        backgroundColor: '#050812', padding: { x: 2, y: 1 }, stroke: '#050812', strokeThickness: 1
      }).setOrigin(0.5).setDepth(2);
      const container = this.add.container(x, y, [ring, sprite, label]).setDepth(14).setScale(0.72).setAlpha(0);
      this.activeBonus = { ...createMover(tile, STREET_BONUS_SPEED_TILES_PER_SECOND), kind, container, sprite, expiresAt: time + STREET_BONUS_SPAWN_INTERVAL_MS, tier };
      this.bonusCueArmed = false;
      if (options.reducedMotion) container.setScale(1).setAlpha(1);
      else this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, alpha: 1, duration: 320, ease: 'Back.Out' });
      this.setWarning(`${tierDefinition.label.toUpperCase()} MOVING BONUS • ${definition.label} • CATCH IT!`, 1400);
      this.tone(kind === 'cash' ? 520 : kind === 'ticket' ? 690 : 420, 0.12);
    }

    private collectStreetBonus(time: number, playerIndex: 0 | 1): void {
      const bonus = this.activeBonus; if (!bonus) return;
      const definition = STREET_BONUSES[bonus.kind];
      const tierDefinition = BONUS_TIERS[bonus.tier];
      const award = Math.round(definition.score * tierDefinition.scoreMultiplier);
      const duration = Math.round(definition.durationMs * tierDefinition.durationMultiplier);
      const owner = this.scoringPlayer(playerIndex);
      const x = bonus.container.x; const y = bonus.container.y;
      const syncGate = this.syncGateReady();
      bonus.container.destroy(); this.activeBonus = undefined; this.nextBonusAt = time + STREET_BONUS_SPAWN_INTERVAL_MS; this.bonusCueArmed = true;
      this.bonusesCollected += 1; this.powerUpsUsed += 1;
      this.levelMissionStats.bonuses += 1;
      this.score += award; this.playerScores[owner] += award;
      if (options.playStyle === 'coop' && syncGate) {
        this.score += 313; this.playerScores[0] += 157; this.playerScores[1] += 156; this.teamCombo = Math.min(10, this.teamCombo + 2);
      }
      this.bonusEffect = bonus.kind; this.bonusEffectTier = bonus.tier; this.bonusEffectUntil = time + duration;
      if (bonus.kind === 'cash') {
        this.doubleScoreUntil = time + duration;
        this.setWarning(`${tierDefinition.label.toUpperCase()} CASH • +${award} • DOUBLE HEART POINTS`, 1700);
      } else if (bonus.kind === 'ticket') {
        this.luckyRushUntil = Math.max(this.luckyRushUntil, time + duration);
        this.setWarning(`${tierDefinition.label.toUpperCase()} TICKET • +${award} • HERO SPEED BOOST`, 1700);
      } else {
        const shieldOwner = options.playStyle === 'alternating' ? this.activePlayer : playerIndex;
        this.playerShields[shieldOwner] = true;
        if (options.playStyle !== 'coop') this.shielded = true;
        this.forceFieldUntil[playerIndex] = time + duration;
        this.setWarning(`${tierDefinition.label.toUpperCase()} SCRATCH-OFF • +${award} • FORCE FIELD`, 1700);
      }
      if (syncGate) this.setWarning(`313 SYNC GATE • ${definition.label} • TEAM +313`, 1800);
      this.spawnStreetBonusFx(x, y, bonus.kind, award, playerIndex, bonus.tier);
      this.updateMissionProgress(owner);
      this.saveProgressCheckpoint(); this.emitSnapshot();
    }

    private spawnStreetBonusFx(x: number, y: number, kind: StreetBonusKind, award: number, playerIndex: 0 | 1, tier: BonusTier): void {
      const definition = STREET_BONUSES[kind];
      const powerColor = BONUS_TIERS[tier].color;
      const color = Phaser.Display.Color.IntegerToColor(powerColor);
      const icon = this.add.image(x, y, definition.texture).setDisplaySize(kind === 'ticket' ? 42 : 36, kind === 'scratch' ? 36 : 32).setDepth(35).setTint(0xffffff, powerColor, 0xffffff, powerColor);
      const label = this.add.text(x, y - 20, `${BONUS_TIERS[tier].label.toUpperCase()} ${definition.label} +${award}`, {
        fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '10px', color: BONUS_TIERS[tier].colorCss, stroke: '#020207', strokeThickness: 3
      }).setOrigin(0.5).setDepth(36);
      const collector = playerIndex === 1 && this.player2 ? this.player2 : this.player;
      collector.setTint(powerColor);
      this.time.delayedCall(620, () => this.applyPlayerStyle());
      if (options.reducedMotion) { this.time.delayedCall(420, () => { icon.destroy(); label.destroy(); }); return; }
      this.cameras.main.flash(130, color.red, color.green, color.blue, false);
      this.tweens.add({ targets: icon, y: y - 36, scaleX: icon.scaleX * 1.45, scaleY: icon.scaleY * 1.45, alpha: 0, duration: 720, ease: 'Cubic.Out', onComplete: () => icon.destroy() });
      this.tweens.add({ targets: label, y: y - 62, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => label.destroy() });
      for (let index = 0; index < 7; index += 1) {
        const spark = this.add.circle(collector.x, collector.y, 2 + index % 2, powerColor, 0.9).setDepth(34);
        const angle = Phaser.Math.DegToRad(index * (360 / 7));
        this.tweens.add({ targets: spark, x: collector.x + Math.cos(angle) * 38, y: collector.y + Math.sin(angle) * 32, alpha: 0, duration: 420, onComplete: () => spark.destroy() });
      }
      this.tone(kind === 'cash' ? 880 : kind === 'ticket' ? 1040 : 620, 0.18);
    }

    private updateHeroBonusFx(time: number): void {
      const sprites = [this.player, this.player2] as const;
      this.forceFields.forEach((field, index) => {
        const sprite = sprites[index]; if (!field || !sprite) return;
        const visible = time < this.forceFieldUntil[index] && !this.downedPlayers[index];
        field.setPosition(sprite.x, sprite.y).setVisible(visible);
        if (visible) field.setScale(1 + Math.sin(time / 180) * 0.045);
      });
      if (time >= this.luckyRushUntil || time - this.lastSpeedTrailAt < 110) return;
      this.lastSpeedTrailAt = time;
      for (const [index, sprite] of sprites.entries()) {
        if (!sprite || this.downedPlayers[index]) continue;
        const trail = this.add.ellipse(sprite.x, sprite.y + 9, 22, 8, this.currentPowerColor(), index === 1 ? 0.25 : 0.34).setDepth(18);
        this.tweens.add({ targets: trail, alpha: 0, scaleX: 0.25, duration: options.reducedMotion ? 120 : 300, onComplete: () => trail.destroy() });
      }
    }

    private updateCoopRevive(dt: number): void {
      if (options.playStyle !== 'coop' || !this.player2) return;
      const sprites = [this.player, this.player2] as const;
      for (const target of [0, 1] as const) {
        if (!this.downedPlayers[target]) { this.reviveProgress[target] = 0; continue; }
        const helper = target === 0 ? 1 : 0;
        if (this.downedPlayers[helper]) continue;
        const closeEnough = Phaser.Math.Distance.Between(sprites[target].x, sprites[target].y, sprites[helper].x, sprites[helper].y) <= TILE * 1.55;
        this.reviveProgress[target] = Phaser.Math.Clamp(this.reviveProgress[target] + (closeEnough ? dt : -dt * 0.45), 0, 1.4);
        if (this.reviveProgress[target] < 1.4) continue;
        this.downedPlayers[target] = false; this.reviveProgress[target] = 0;
        this.revivesCompleted += 1;
        this.playerLives[target] = Math.max(1, this.playerLives[target]); this.playerShields[target] = true;
        sprites[target].setAlpha(1);
        const bonus = 500; this.score += bonus; this.playerScores[helper] += bonus;
        this.hitUntil = this.time.now + 900;
        this.setWarning(`P${helper + 1} REVIVED P${target + 1} • TEAMWORK +${bonus}`, 1500);
        this.saveProgressCheckpoint();
        this.tone(620, 0.14); this.time.delayedCall(100, () => this.tone(820, 0.16));
      }
    }

    private updateCityDepth(): void {
      if (!this.cityBackground || !this.cityNear || !this.cityWash) return;
      const pointer = this.input.activePointer;
      const heroX = this.player2 ? (this.player.x + this.player2.x) / 2 : this.player.x;
      const heroY = this.player2 ? (this.player.y + this.player2.y) / 2 : this.player.y;
      const sourceX = pointer.x >= 0 && pointer.x <= GAME_WIDTH ? pointer.x : heroX;
      const sourceY = pointer.y >= 0 && pointer.y <= GAME_HEIGHT ? pointer.y : heroY;
      const xDepth = options.reducedMotion ? 0 : Phaser.Math.Clamp((sourceX / GAME_WIDTH - 0.5) * 2, -1, 1);
      const yDepth = options.reducedMotion ? 0 : Phaser.Math.Clamp((sourceY / GAME_HEIGHT - 0.5) * 2, -1, 1);
      this.cityBackground.x = Phaser.Math.Linear(this.cityBackground.x, GAME_WIDTH / 2 + xDepth * 8, 0.055);
      this.cityBackground.y = Phaser.Math.Linear(this.cityBackground.y, GAME_HEIGHT / 2 + yDepth * 5, 0.055);
      this.cityNear.x = Phaser.Math.Linear(this.cityNear.x, GAME_WIDTH / 2 - xDepth * 15, 0.075);
      this.cityNear.y = Phaser.Math.Linear(this.cityNear.y, GAME_HEIGHT / 2 - yDepth * 9, 0.075);
      this.cityWash.x = Phaser.Math.Linear(this.cityWash.x, GAME_WIDTH / 2 + xDepth * 4, 0.05);
      this.cityDepthLights.forEach(light => {
        const baseX = light.getData('baseX') as number; const depth = light.getData('depth') as number;
        light.x = Phaser.Math.Linear(light.x, baseX + xDepth * 14 * depth, 0.065);
      });
    }

    private keyboardDirection(playerIndex: 0 | 1): CardinalDirection | null {
      const bindings = options.playStyle === 'coop' ? (playerIndex === 0 ? options.p1Bindings : options.p2Bindings) : options.playStyle === 'alternating' && this.activePlayer === 1 ? options.p2Bindings : options.p1Bindings;
      if (pressedCodes.has(bindings.left)) return 'left'; if (pressedCodes.has(bindings.right)) return 'right';
      if (pressedCodes.has(bindings.up)) return 'up'; if (pressedCodes.has(bindings.down)) return 'down';
      return null;
    }

    private bindingPowerDown(): boolean {
      const p1 = pressedCodes.has(options.p1Bindings.power);
      const p2 = options.playerCount === 2 && pressedCodes.has(options.p2Bindings.power);
      return p1 || p2;
    }

    private gamepadDirection(playerIndex: 0 | 1): CardinalDirection | null {
      const gamepad = navigator.getGamepads?.()[playerIndex]; if (!gamepad) return null;
      const horizontal = gamepad.axes[0] ?? 0; const vertical = gamepad.axes[1] ?? 0;
      if (gamepad.buttons[14]?.pressed || horizontal < -0.45) return 'left';
      if (gamepad.buttons[15]?.pressed || horizontal > 0.45) return 'right';
      if (gamepad.buttons[12]?.pressed || vertical < -0.45) return 'up';
      if (gamepad.buttons[13]?.pressed || vertical > 0.45) return 'down';
      return null;
    }

    private gamepadPowerDown(): boolean { return Array.from(navigator.getGamepads?.() ?? []).some(gamepad => Boolean(gamepad?.buttons[0]?.pressed)); }

    private queuePlayerDirection(direction: CardinalDirection, playerIndex: 0 | 1): void {
      const mover = playerIndex === 0 ? this.playerMover : this.player2Mover;
      if (!mover.next && !stepTile(this.maze, mover.tile, direction)) {
        const fallback = validDirections(this.maze, mover.tile)[0];
        const sprite = playerIndex === 0 ? this.player : this.player2;
        const canShowFeedback = this.time.now >= this.blockedFeedbackUntil;
        if (sprite && canShowFeedback) {
          const horizontal = direction === 'left' || direction === 'right';
          this.tweens.add({ targets: sprite, x: sprite.x + (horizontal ? (direction === 'left' ? -3 : 3) : 0), y: sprite.y + (!horizontal ? (direction === 'up' ? -3 : 3) : 0), duration: 70, yoyo: true, ease: 'Sine.Out' });
        }
        if (canShowFeedback) {
          this.blockedFeedbackUntil = this.time.now + 240;
          if (fallback && this.time.now >= this.roundReadyUntil) this.setWarning(`ROAD CLOSED • TRY ${fallback.toUpperCase()}`, 520);
        }
      }
      if (!this.hasMoved) {
        this.hasMoved = true; this.hitUntil = this.time.now + 1200;
        this.nextBonusAt = this.time.now + STREET_BONUS_SPAWN_INTERVAL_MS;
        this.nextDetroitEventAt = this.time.now + DETROIT_EVENT_INTERVAL_MS;
        this.bonusCueArmed = true; this.emitSnapshot();
      }
      if (mover.direction !== 'none' && OPPOSITE[mover.direction] === direction && mover.next) {
        const old = mover.tile; mover.tile = mover.next; mover.next = old;
        mover.progress = 1 - mover.progress; mover.direction = direction;
      } else if (mover.next && shouldSnapLateTurn(this.maze, mover.tile, direction, mover.direction, mover.progress)) {
        // Pull the hero back to the intersection by at most 48% of a tile. This
        // is visually tiny, but removes the frustrating missed-corner stop.
        mover.next = null; mover.progress = 0; mover.direction = 'none';
      }
      mover.queued = direction;
    }

    private advanceMover(mover: GridMover, dt: number, choose: (mover: GridMover) => CardinalDirection | null): GridPoint[] {
      let distance = mover.speed * dt; const arrivals: GridPoint[] = [];
      while (distance > 0) {
        if (!mover.next) {
          const direction = choose(mover); if (!direction) { mover.direction = 'none'; break; }
          const next = stepTile(this.maze, mover.tile, direction); if (!next) { mover.direction = 'none'; break; }
          if ((mover === this.playerMover || mover === this.player2Mover) && Math.abs(next.x - mover.tile.x) > 1) {
            this.usedPortal = true;
            if (this.world === 4) { this.luckyRushUntil = Math.max(this.luckyRushUntil, this.time.now + 1800); this.setWarning('WESTSIDE PORTAL BOOST', 750); }
          }
          mover.direction = direction; mover.next = next;
        }
        const remaining = 1 - mover.progress; const step = Math.min(distance, remaining);
        mover.progress += step; distance -= step;
        if (mover.progress >= 0.999999) { mover.tile = mover.next; mover.next = null; mover.progress = 0; arrivals.push(copyPoint(mover.tile)); }
      }
      return arrivals;
    }

    private teleportPlayerAtPortal(mover: GridMover, tile: GridPoint, time: number, playerIndex: 0 | 1): GridPoint | null {
      if (time < this.portalCooldownUntil[playerIndex]) return null;
      const sourceKey = tileKey(tile);
      if (!this.activePortalKeys.has(sourceKey)) return null;
      const destination = this.portalLinks.get(sourceKey);
      if (!destination) return null;
      const source = { ...tile };
      mover.tile = { ...destination };
      mover.next = null;
      mover.progress = 0;
      this.portalCooldownUntil[playerIndex] = time + 850;
      this.usedPortal = true;
      this.portalComboChain = time < this.portalComboUntil ? Math.min(4, this.portalComboChain + 1) : 1;
      this.portalComboUntil = time + 4500;
      this.levelMissionStats.portals += 1;
      const pair = Math.floor(Math.max(0, this.portalPoints.findIndex(point => tileKey(point) === tileKey(source))) / 2) + 1;
      this.spawnPortalJumpFx(source, destination, playerIndex);
      this.setWarning(`P${playerIndex + 1} PORTAL ${pair} • HEARTS x${1 + this.portalComboChain}`, 1100);
      this.tone(460 + pair * 110, 0.11);
      this.updateMissionProgress(this.scoringPlayer(playerIndex));
      return destination;
    }

    private spawnPortalJumpFx(source: GridPoint, destination: GridPoint, playerIndex: 0 | 1): void {
      const palette = LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0];
      const color = playerIndex === 1 ? palette.portalRight : palette.portalLeft;
      [source, destination].forEach((point, index) => {
        const ring = this.add.ellipse(this.pixelX(point.x), this.pixelY(point.y), 20, 29, 0x000000, 0).setStrokeStyle(3, color, 0.95).setDepth(31);
        if (options.reducedMotion) this.time.delayedCall(180, () => ring.destroy());
        else this.tweens.add({ targets: ring, scaleX: 2.1, scaleY: 1.7, alpha: 0, duration: 420 + index * 80, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
      });
    }

    private updateVillains(time: number, dt: number): void {
      this.villains.forEach((villain, index) => {
        if (time < villain.releaseAt) {
          this.positionSprite(villain.sprite, villain);
          this.animateVillain(villain, time);
          return;
        }
        if (villain.mode === 'returning') {
          villain.mode = time < this.frightenedUntil ? 'frightened' : 'normal';
          this.applyVillainOutline(villain);
        }
        const previousMode = villain.mode;
        villain.mode = time < this.frightenedUntil ? 'frightened' : villain.mode === 'frightened' ? 'normal' : villain.mode;
        if (previousMode !== villain.mode) this.applyVillainOutline(villain);
        const patrolSurge = this.world === 7 && villain.kind === 'police' ? 1.28 : 1;
        villain.speed = (villain.mode === 'frightened' ? 3.15 : 4.05 + Math.min(this.world, 6) * 0.15 + (villain.kind === 'police' ? 0.25 : 0)) * LEVEL_VILLAIN_SPEED[this.world] * patrolSurge * options.gameSpeed;
        this.advanceMover(villain, dt, mover => this.chooseVillainDirection(villain, mover.tile, time, index));
        this.positionSprite(villain.sprite, villain); this.animateVillain(villain, time);
      });
    }

    private resetVillainWaves(): void {
      this.villainWaveIndex = 0;
      this.villainTactic = VILLAIN_WAVES[0].tactic;
      this.villainWaveRemainingMs = VILLAIN_WAVES[0].durationMs;
    }

    private updateVillainWave(time: number, deltaMs: number): void {
      if (!this.hasMoved || time < this.roundReadyUntil || time < this.frightenedUntil) return;
      if (!Number.isFinite(this.villainWaveRemainingMs)) return;
      this.villainWaveRemainingMs -= Math.min(deltaMs, 50);
      if (this.villainWaveRemainingMs > 0) return;

      const previousTactic = this.villainTactic;
      this.villainWaveIndex = Math.min(this.villainWaveIndex + 1, VILLAIN_WAVES.length - 1);
      const nextWave = VILLAIN_WAVES[this.villainWaveIndex];
      this.villainTactic = nextWave.tactic;
      this.villainWaveRemainingMs = nextWave.durationMs;
      if (previousTactic !== this.villainTactic) this.reverseVillains();
    }

    private chooseVillainDirection(villain: Villain, tile: GridPoint, time: number, index: number): CardinalDirection {
      if (villain.mode === 'frightened') {
        const choices = validDirections(this.maze, tile).filter(direction => villain.direction === 'none' || direction !== OPPOSITE[villain.direction]);
        return choices[(Math.floor(time / 420) + index * 3) % Math.max(1, choices.length)] ?? 'left';
      }
      const corners = [{ x: 1, y: 1 }, { x: this.maze.width - 2, y: 1 }, { x: 1, y: this.maze.height - 2 }, { x: this.maze.width - 2, y: this.maze.height - 2 }];
      if (this.villainTactic === 'scatter') {
        const cornerByKind: Record<EnemyKind, GridPoint> = {
          tax: corners[1],
          reaper: corners[0],
          chaos: corners[3],
          envy: corners[2],
          police: this.portalPoints[Math.floor(time / 2400) % Math.max(1, this.portalPoints.length)] ?? { x: 0, y: this.maze.tunnelRow }
        };
        return shortestDirection(this.maze, tile, cornerByKind[villain.kind], villain.direction);
      }
      const chaseMover = this.nearestPlayerMover(villain.tile);
      let target = chaseMover.tile;
      if (villain.kind === 'reaper') target = projectTile(this.maze, chaseMover.tile, chaseMover.direction, 4);
      if (villain.kind === 'chaos') target = projectTile(this.maze, chaseMover.tile, chaseMover.direction, 2);
      if (villain.kind === 'envy') target = this.distanceTiles(villain.tile, chaseMover.tile) < 6 ? corners[2] : chaseMover.tile;
      if (villain.kind === 'police') {
        const projected = projectTile(this.maze, chaseMover.tile, chaseMover.direction, 6);
        const portal = this.portalPoints[(Math.floor(time / 3000) + index) % Math.max(1, this.portalPoints.length)] ?? { x: 0, y: this.maze.tunnelRow };
        target = this.pelletObjects.size < this.initialPellets * 0.35 ? chaseMover.tile : Math.floor(time / 3000) % 2 ? projected : portal;
      }
      return shortestDirection(this.maze, tile, target, villain.direction);
    }

    private nearestPlayerMover(tile: GridPoint): GridMover {
      if (!this.player2) return this.playerMover;
      if (this.downedPlayers[0]) return this.player2Mover;
      if (this.downedPlayers[1]) return this.playerMover;
      return this.distanceTiles(tile, this.player2Mover.tile) < this.distanceTiles(tile, this.playerMover.tile) ? this.player2Mover : this.playerMover;
    }

    private scoringPlayer(playerIndex: 0 | 1): 0 | 1 { return options.playStyle === 'alternating' ? this.activePlayer : playerIndex; }

    private collectNearby(tile: GridPoint, time: number, playerIndex: 0 | 1): void {
      const nearby = [tile, ...validDirections(this.maze, tile).map(direction => stepTile(this.maze, tile, direction)).filter((point): point is GridPoint => Boolean(point))];
      const collectionWorld = this.world;
      for (const point of nearby) {
        this.collectAt(point, time, playerIndex);
        if (this.completed || this.world !== collectionWorld) break;
      }
    }

    private collectAt(tile: GridPoint, time: number, playerIndex: 0 | 1): void {
      const key = tileKey(tile); const pellet = this.pelletObjects.get(key); if (!pellet) return;
      const comboWindow = this.world === 5 ? 2800 : 1800;
      if (this.lastPelletAt && time - this.lastPelletAt > comboWindow) this.combo = 1;
      this.lastPelletAt = time;
      const isPower = this.powerPellets.delete(key);
      let award = (isPower ? 75 : HEART_BASE_SCORE) * this.combo;
      if (time < this.portalComboUntil) award *= 1 + this.portalComboChain;
      if (time < this.doubleScoreUntil) award *= 2;
      const teamPass = options.playStyle === 'coop' && this.lastCollector !== null && this.lastCollector !== playerIndex && time - this.lastTeamCollectAt < 1500;
      if (teamPass) award += 25 * this.combo;
      if (options.playStyle === 'coop') this.teamCombo = teamPass ? Math.min(10, this.teamCombo + 1) : time - this.lastTeamCollectAt > 2600 ? 0 : this.teamCombo;
      this.lastCollector = playerIndex; this.lastTeamCollectAt = time;
      pellet.destroy(); this.pelletObjects.delete(key); this.pellets += 1; this.worldCollected += 1;
      const owner = this.scoringPlayer(playerIndex);
      this.score += award; this.playerScores[owner] += award;
      this.spawnCollectFx(tile, award, isPower, this.combo, playerIndex);
      if (teamPass && !isPower) this.setWarning(`TEAMWORK PASS • +${25 * this.combo}`, 650);
      if (isPower) {
        this.frightenedUntil = time + MIND_COIN_FRIGHTENED_MS[this.world]; this.frightenedCombo = 0; this.setWarning('MIND COIN ACTIVE — VILLAINS VULNERABLE!', 1600); this.tone(240, 0.22);
        this.reverseVillains();
      } else { this.tone(620 + this.combo * 18, 0.035); }
      this.combo = Math.min(7, this.combo + 1); this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.levelMissionStats.hearts += 1;
      this.levelMissionStats.bestStreak = Math.max(this.levelMissionStats.bestStreak, this.combo);
      this.updateMissionProgress(owner);
      this.revealNumbers(owner); this.emitSnapshot();
      if (time - this.lastCheckpointAt > 500 || this.pelletObjects.size === 0) { this.lastCheckpointAt = time; this.saveProgressCheckpoint(); }
      if (this.pelletObjects.size === 0) {
        if (this.bossHealth > 0) this.setWarning(`${this.bossLabel} REMAINS • ${this.bossHealth}/${this.bossMaxHealth} • USE MIND COINS`, 2200);
        else this.completeWorld();
      }
    }

    private spawnCollectFx(tile: GridPoint, award: number, power: boolean, combo: number, playerIndex: 0 | 1): void {
      const x = this.pixelX(tile.x); const y = this.pixelY(tile.y);
      const icon = this.add.image(x, y, power ? 'mindCoin' : 'loveHeart').setDisplaySize(power ? 34 : 14, power ? 34 : 14).setDepth(32);
      if (power) icon.setTint(this.currentPowerColor());
      const label = this.add.text(x, y - 8, power ? `MIND COIN +${award}` : `+${award}${combo > 1 ? `  ×${combo}` : ''}`, {
        fontFamily: 'Arial Black, Arial, sans-serif', fontSize: power ? '11px' : '9px', color: power ? this.currentPowerColorCss() : '#fff3a8', stroke: '#020207', strokeThickness: 3
      }).setOrigin(0.5).setDepth(34);
      if (options.reducedMotion) {
        this.time.delayedCall(260, () => { icon.destroy(); label.destroy(); }); return;
      }
      this.tweens.add({ targets: icon, scaleX: icon.scaleX * (power ? 3.1 : 2.1), scaleY: icon.scaleY * (power ? 3.1 : 2.1), alpha: 0, duration: power ? 520 : 280, ease: 'Quad.Out', onComplete: () => icon.destroy() });
      this.tweens.add({ targets: label, y: y - (power ? 42 : 28), alpha: 0, duration: power ? 760 : 540, ease: 'Cubic.Out', onComplete: () => label.destroy() });
      if (power) {
        this.cameras.main.flash(180, 55, 220, 255, false);
        const collector = playerIndex === 1 && this.player2 ? this.player2 : this.player;
        this.tweens.add({ targets: collector, scaleX: collector.scaleX * 1.28, scaleY: collector.scaleY * 1.28, duration: 170, yoyo: true, repeat: 1 });
        this.villains.forEach(villain => this.tweens.add({ targets: villain.sprite, alpha: 0.35, duration: 110, yoyo: true, repeat: 2 }));
      }
    }

    private revealNumbers(playerIndex: 0 | 1): void {
      const quota = this.quotas[this.world]; const localRevealed = this.nextReveal - this.worldRevealStart;
      if (localRevealed < quota && this.worldCollected >= Math.ceil((this.initialPellets * (localRevealed + 1)) / (quota + 1))) {
        const bonus = 500 * this.combo;
        this.revealed[this.nextReveal] = values[this.nextReveal]; this.nextReveal += 1; this.score += bonus; this.playerScores[playerIndex] += bonus;
        this.setWarning(`LUCKY NUMBER ${values[this.nextReveal - 1]} LOCKED`, 1200); this.tone(440 + this.nextReveal * 70, 0.16);
      }
    }

    saveProgressCheckpoint(): void {
      if (this.completed) return;
      options.onCheckpoint({
        version: 1, savedAt: new Date().toISOString(), world: this.world, draw: options.draw, playStyle: options.playStyle,
        runVariant: options.runVariant,
        score: this.score, activePlayer: this.activePlayer, playerScores: [...this.playerScores] as [number, number],
        playerLives: [...this.playerLives] as [number, number], playerShields: [...this.playerShields] as [boolean, boolean],
        lives: this.lives, shielded: this.shielded, revealed: [...this.revealed], nextReveal: this.nextReveal,
        pellets: this.pellets, villainEncounters: this.villainEncounters, powerUpsUsed: this.powerUpsUsed, bonusesCollected: this.bonusesCollected,
        remainingHeartKeys: [...this.pelletObjects.keys()], remainingPowerKeys: [...this.powerPellets], worldCollected: this.worldCollected,
        bossHealth: this.bossHealth, bestCombo: this.bestCombo, eventsCompleted: this.eventsCompleted,
        missedBonuses: this.missedBonuses, levelGrades: [...this.levelGrades],
        levelTimeRemainingMs: this.levelTimeRemainingMs, levelMissionStats: { ...this.levelMissionStats },
        missionRewardsClaimed: [...this.missionRewardsClaimed], missionsCompleted: this.missionsCompleted
      });
    }

    restartCurrentLevel(): void {
      if (this.completed) return;
      const penalty = Math.min(250, this.score);
      this.score -= penalty;
      const owner = options.playStyle === 'coop' ? 0 : this.activePlayer;
      this.playerScores[owner] = Math.max(0, this.playerScores[owner] - penalty);
      this.combo = 1; this.luckyRushUntil = 0;
      this.resetMovers(this.time.now, 1500);
      this.setWarning(`LEVEL RESET • -${penalty} • SAFE SPAWN`, 1500);
      this.saveProgressCheckpoint();
    }

    private completeWorld(): void {
      while (this.nextReveal < this.worldRevealStart + this.quotas[this.world]) { this.revealed[this.nextReveal] = values[this.nextReveal]; this.nextReveal += 1; }
      if (options.runVariant === 'timeAttack') {
        const clockBonus = Math.max(0, Math.ceil(this.levelTimeRemainingMs / 1000) * 50);
        this.timeAttackBonus += clockBonus;
        this.score += clockBonus;
        if (options.playStyle === 'coop') { this.playerScores[0] += Math.ceil(clockBonus / 2); this.playerScores[1] += Math.floor(clockBonus / 2); }
        else this.playerScores[this.activePlayer] += clockBonus;
      }
      const completionBonus = 2500 + this.lives * 500;
      this.score += completionBonus;
      if (options.playStyle === 'coop') {
        this.playerScores[0] += Math.ceil(completionBonus / 2);
        this.playerScores[1] += Math.floor(completionBonus / 2);
      } else this.playerScores[this.activePlayer] += completionBonus;
      const levelScore = this.score - this.worldStartScore;
      const levelGrade: 'S' | 'A' | 'B' | 'C' = levelScore >= 11_000 ? 'S' : levelScore >= 8_000 ? 'A' : levelScore >= 5_500 ? 'B' : 'C';
      this.levelGrades[this.world] = levelGrade;
      this.emitSnapshot();
      if (this.world < MAZE_LEVEL_COUNT - 1) {
        const completedLevelIndex = this.world;
        let advanced = false;
        const continueRun = () => {
          if (advanced || this.completed) return;
          advanced = true;
          this.scene.resume();
          this.world += 1;
          if (options.playStyle === 'alternating') this.selectPlayer(this.activePlayer === 0 ? 1 : 0);
          this.syncActivePlayer();
          this.createWorld();
          this.saveProgressCheckpoint();
        };
        this.scene.pause();
        options.onLevelBreak(completedLevelIndex, continueRun);
        return;
      }
      this.completed = true; this.setWarning('JACKPOT MAZE COMPLETE!', 1800);
      this.syncActivePlayer();
      this.time.delayedCall(900, () => options.onComplete({
        score: this.score, villainEncounters: this.villainEncounters, powerUpsUsed: this.powerUpsUsed,
        playerScores: [...this.playerScores] as [number, number], heartsCollected: this.pellets,
        bonusesCollected: this.bonusesCollected, bestCombo: this.bestCombo, missedBonuses: this.missedBonuses,
        eventsCompleted: this.eventsCompleted, levelGrades: [...this.levelGrades],
        missionsCompleted: this.missionsCompleted, timeAttackBonus: this.timeAttackBonus
      }));
    }

    private resolveCollisions(time: number): void {
      if (!this.hasMoved || time < this.hitUntil) return;
      const players: Array<{ sprite: Phaser.GameObjects.Sprite; index: 0 | 1 }> = [{ sprite: this.player, index: 0 }];
      if (this.player2) players.push({ sprite: this.player2, index: 1 });
      for (const player of players) {
        if (this.downedPlayers[player.index]) continue;
        for (const villain of this.villains) {
          if (time < villain.releaseAt || villain.mode === 'returning') continue;
          if (Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, villain.sprite.x, villain.sprite.y) > TILE * 0.72) continue;
          const owner = this.scoringPlayer(player.index);
          if (options.playStyle !== 'alternating') this.activePlayer = player.index;
          if (villain.mode === 'frightened') {
            if (villain.isBoss && this.bossHealth > 0) {
              this.bossHealth -= 1;
              const bossAward = 1777; this.score += bossAward; this.playerScores[owner] += bossAward;
              Object.assign(villain, createMover(villain.spawn, 4.15), { releaseAt: time + BOSS_RECOVERY_MS, mode: 'returning' as VillainMode });
              this.positionSprite(villain.sprite, villain);
              this.setWarning(this.bossHealth > 0 ? `${this.bossLabel} HIT • ${this.bossHealth}/${this.bossMaxHealth} • +${bossAward}` : `${this.bossLabel} DEFEATED • +${bossAward}`, 1700);
              if (this.bossHealth === 0) {
                this.levelMissionStats.villains += 1;
                this.updateMissionProgress(owner);
              }
              this.tone(this.bossHealth > 0 ? 520 : 1040, .24); this.saveProgressCheckpoint(); this.emitSnapshot();
              if (this.bossHealth === 0 && this.pelletObjects.size === 0) this.completeWorld();
              return;
            }
            const award = [200, 400, 800, 1600][Math.min(this.frightenedCombo, 3)]; this.frightenedCombo += 1; this.score += award; this.playerScores[owner] += award;
            Object.assign(villain, createMover(villain.spawn, 4.15), { releaseAt: time + VILLAIN_RECOVERY_MS[this.world], mode: 'returning' as VillainMode });
            this.levelMissionStats.villains += 1;
            this.positionSprite(villain.sprite, villain); this.setWarning(`${villain.kind.toUpperCase()} DEFEATED • ${award}`, 900); this.tone(860, 0.12); this.updateMissionProgress(owner); this.emitSnapshot(); return;
          }
          this.villainEncounters += 1;
          if (options.playStyle === 'coop') {
            if (this.playerShields[player.index]) {
              this.playerShields[player.index] = false;
              this.forceFieldUntil[player.index] = 0;
              this.forceFields[player.index]?.setVisible(false);
              this.hitUntil = time + 1100;
              this.villainTone(villain.kind);
              this.setWarning(`P${player.index + 1} SHIELD CRACKED • ${villain.kind.toUpperCase()} ALERT`, 1300);
              this.emitSnapshot(); return;
            }
            this.playerLives[player.index] = Math.max(0, this.playerLives[player.index] - 1);
            this.downedPlayers[player.index] = true;
            this.reviveProgress[player.index] = 0;
            player.sprite.setAlpha(0.34);
            const mover = player.index === 0 ? this.playerMover : this.player2Mover;
            mover.direction = 'none'; mover.next = null;
            this.combo = 1; this.hitUntil = time + 1000;
            this.villainTone(villain.kind);
            if (options.screenShake && !options.reducedMotion) this.cameras.main.shake(100, 0.003);
            if (this.downedPlayers[0] && this.downedPlayers[1]) {
              const penalty = Math.min(1000, this.score);
              this.score -= penalty;
              this.playerScores = [Math.max(0, this.playerScores[0] - Math.ceil(penalty / 2)), Math.max(0, this.playerScores[1] - Math.floor(penalty / 2))];
              this.playerLives = [GAME_BALANCE.startingLives, GAME_BALANCE.startingLives];
              this.playerShields = [true, true]; this.downedPlayers = [false, false]; this.reviveProgress = [0, 0];
              this.player.setAlpha(1); this.player2?.setAlpha(1);
              this.resetMovers(time, 1900);
              this.setWarning('TEAM WIPE • SHIELDS RESTORED • REGROUP!', 1900);
            } else {
              this.setWarning(`P${player.index + 1} DOWN • TEAMMATE STAND CLOSE TO REVIVE`, 1800);
            }
            this.emitSnapshot(); return;
          }
          if (this.shielded) {
            this.shielded = false;
            this.playerShields[this.activePlayer] = false;
            this.forceFieldUntil[player.index] = 0;
            this.forceFields[player.index]?.setVisible(false);
            this.hitUntil = time + 1200;
            this.villainTone(villain.kind);
            this.setWarning(`${options.playerCount === 2 ? `P${owner + 1} • ` : ''}${villain.kind.toUpperCase()} cracked the Gold Mind shield!`, 1300); this.emitSnapshot(); return;
          }
          this.lives -= 1; this.combo = 1; this.hitUntil = time + 1800;
          const hitWarning = GAME_BALANCE.villainWarnings[villain.kind]; this.villainTone(villain.kind);
          if (options.screenShake && !options.reducedMotion) this.cameras.main.shake(100, 0.003);
          if (this.lives <= 0) {
            this.lives = GAME_BALANCE.startingLives;
            const penalty = Math.min(1000, this.score);
            this.score -= penalty; this.playerScores[owner] = Math.max(0, this.playerScores[owner] - penalty);
          }
          if (options.playStyle === 'alternating') { this.switchPlayer(time, hitWarning); return; }
          this.setWarning(hitWarning, 1500); this.resetMovers(time); this.emitSnapshot(); return;
        }
      }
    }

    activatePowerUp(): void {
      this.powerUpsUsed += 1;
      if (options.playStyle === 'coop') {
        const needsShield = this.playerShields.some((ready, index) => !ready && !this.downedPlayers[index]);
        if (needsShield) {
          this.playerShields = this.playerShields.map((ready, index) => this.downedPlayers[index] ? ready : true) as [boolean, boolean];
          this.setWarning('TEAM MIND SHIELDS RESTORED', 1200);
        } else {
          this.luckyRushUntil = this.time.now + 5000;
          this.setWarning('TEAM MIND COIN RUSH • SPEED BOOSTED!', 1200);
        }
        this.chargeDistrictCaptain();
        this.tone(777, 0.18); this.saveProgressCheckpoint(); this.emitSnapshot(); return;
      }
      if (!this.shielded) {
        this.shielded = true;
        this.playerShields[this.activePlayer] = true;
        this.setWarning('MIND COIN SHIELD RESTORED', 1200);
      }
      else { this.luckyRushUntil = this.time.now + 5000; this.setWarning('MIND COIN RUSH — SPEED BOOSTED!', 1200); }
      this.chargeDistrictCaptain();
      this.tone(777, 0.18); this.saveProgressCheckpoint(); this.emitSnapshot();
    }

    private chargeDistrictCaptain(): void {
      if (this.bossHealth <= 0) return;
      this.frightenedUntil = Math.max(this.frightenedUntil, this.time.now + 4200);
      this.frightenedCombo = 0;
      this.reverseVillains();
      this.setWarning(`${this.bossLabel} VULNERABLE • HIT NOW!`, 1300);
    }

    private reverseVillains(): void {
      this.villains.forEach(villain => {
        if (!villain.next || villain.direction === 'none') return;
        const old = villain.tile; villain.tile = villain.next; villain.next = old; villain.progress = 1 - villain.progress; villain.direction = OPPOSITE[villain.direction];
      });
    }

    private animatePlayer(sprite: Phaser.GameObjects.Sprite, mover: GridMover, time: number): void {
      const playerIndex: 0 | 1 = sprite === this.player2 ? 1 : 0;
      const dogHero = sprite.texture.key === 'player2Dog';
      const moving = mover.direction !== 'none';
      if (dogHero) {
        const frame = this.downedPlayers[playerIndex] ? 0 : moving ? 12 + Math.floor(time / 95) % 6 : 20;
        sprite.setFrame(frame);
        if (mover.direction === 'left') sprite.setFlipX(true);
        else if (mover.direction === 'right') sprite.setFlipX(false);
      } else {
        const rows: Record<GridDirection, number> = { none: 0, down: 1, up: 2, left: 4, right: 3 };
        const frame = moving ? rows[mover.direction] * 8 + Math.floor(time / 105) % 8 : Math.floor(time / 210) % 8;
        sprite.setFlipX(false).setFrame(frame);
      }
      if (this.bonusEffect === 'cash' && time < this.bonusEffectUntil) sprite.setTint(0xffe49b);
      else if (this.bonusEffect === 'ticket' && time < this.bonusEffectUntil) sprite.setTint(playerIndex === 1 ? 0xffb0e8 : 0xa9f7ff);
      else if (time < this.forceFieldUntil[playerIndex]) sprite.setTint(playerIndex === 1 ? 0xffc2ed : 0xc5fbff);
      else {
        const cosmetic = COSMETICS.find(item => item.id === options.cosmetic) ?? COSMETICS[0];
        sprite.setTint(dogHero ? cosmetic.dogTint : cosmetic.heroTint);
      }
    }

    private animateVillain(villain: Villain, time: number): void {
      if (!this.hasMoved || time < this.roundReadyUntil) {
        villain.sprite.setAlpha(0); villain.shadow.setAlpha(0); villain.label.setAlpha(0);
        return;
      }
      if (time < villain.releaseAt) {
        if (villain.mode === 'returning') {
          villain.sprite.setFrame(villain.baseFrame).setTint(0x74bfff).setAlpha(0.42 + Math.sin(time / 170) * 0.08);
          villain.shadow.setAlpha(0.2); villain.label.setAlpha(0);
        } else {
          villain.sprite.setAlpha(0); villain.shadow.setAlpha(0); villain.label.setAlpha(0);
        }
        return;
      }
      const cycle = villain.kind === 'chaos' ? 1 : villain.kind === 'envy' || villain.kind === 'police' ? 5 : 4;
      villain.sprite.setFrame(villain.baseFrame + Math.floor(time / 170) % cycle);
      if (villain.mode === 'frightened') villain.sprite.setTint(0x778cff).setAlpha(0.9); else villain.sprite.clearTint().setAlpha(1);
    }

    private positionSprite(sprite: Phaser.GameObjects.Sprite, mover: GridMover): void {
      let x = mover.tile.x; let y = mover.tile.y;
      if (mover.next) {
        if (mover.tile.x === 0 && mover.next.x === this.maze.width - 1 && mover.direction === 'left') x = -mover.progress;
        else if (mover.tile.x === this.maze.width - 1 && mover.next.x === 0 && mover.direction === 'right') x = this.maze.width - 1 + mover.progress;
        else x += (mover.next.x - mover.tile.x) * mover.progress;
        y += (mover.next.y - mover.tile.y) * mover.progress;
      }
      if (x < -0.5) x += this.maze.width; if (x > this.maze.width - 0.5) x -= this.maze.width;
      sprite.setPosition(this.pixelX(x), this.pixelY(y));
      const villain = this.villains.find(candidate => candidate.sprite === sprite);
      if (villain) {
        const moving = villain.direction !== 'none';
        villain.shadow.setPosition(sprite.x + (moving ? 1 : 0), sprite.y + (villain.kind === 'envy' || villain.kind === 'police' ? 21 : 18)).setScale(moving ? 1.08 : 1, moving ? 0.82 : 1).setAlpha(villain.mode === 'frightened' ? 0.34 : 0.56);
        villain.label.setPosition(sprite.x, sprite.y - (villain.isBoss ? 31 : villain.kind === 'envy' || villain.kind === 'police' ? 28 : 24)).setAlpha(villain.mode === 'frightened' ? .62 : 1);
      }
      const playerIndex: 0 | 1 | null = sprite === this.player ? 0 : sprite === this.player2 ? 1 : null;
      if (playerIndex !== null) {
        const revivePercent = Math.round(this.reviveProgress[playerIndex] / 1.4 * 100);
        const moving = mover.direction !== 'none';
        this.playerShadows[playerIndex]?.setPosition(sprite.x + (moving ? 1 : 0), sprite.y + 19).setScale(moving ? 1.08 : 1, moving ? 0.84 : 1).setAlpha(this.downedPlayers[playerIndex] ? 0.25 : 0.58);
        this.playerLabels[playerIndex]?.setText(this.downedPlayers[playerIndex] ? `P${playerIndex + 1} REVIVE ${revivePercent}%` : options.playStyle === 'coop' ? `P${playerIndex + 1}` : '').setPosition(sprite.x, sprite.y - 25).setAlpha(this.downedPlayers[playerIndex] ? 0.72 : 1);
      }
    }

    private currentPowerColor(): number { return (LEVEL_PALETTES[this.world] ?? LEVEL_PALETTES[0]).powerUp; }
    private currentPowerColorCss(): string { return `#${this.currentPowerColor().toString(16).padStart(6, '0')}`; }
    private pixelX(x: number): number { return ORIGIN_X + x * TILE + TILE / 2; }
    private pixelY(y: number): number { return ORIGIN_Y + y * TILE + TILE / 2; }
    private distanceTiles(a: GridPoint, b: GridPoint): number { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

    private syncActivePlayer(): void {
      if (options.playStyle === 'coop') {
        this.lives = Math.max(this.playerLives[0], this.playerLives[1]);
        this.shielded = this.playerShields[0] || this.playerShields[1];
        return;
      }
      this.playerLives[this.activePlayer] = this.lives; this.playerShields[this.activePlayer] = this.shielded;
      if (options.playStyle === 'solo') this.playerScores[0] = this.score;
    }

    private selectPlayer(player: 0 | 1): void {
      this.syncActivePlayer(); this.activePlayer = player;
      this.lives = this.playerLives[player]; this.shielded = this.playerShields[player];
      this.combo = 1; this.luckyRushUntil = 0; this.lastPelletAt = 0; this.applyPlayerStyle();
    }

    private switchPlayer(now: number, reason: string): void {
      this.selectPlayer(this.activePlayer === 0 ? 1 : 0); this.resetMovers(now, 1900);
      this.setWarning(`${reason} • PLAYER ${this.activePlayer + 1} UP — PASS THE CONTROLS!`, 1900);
    }

    private applyPlayerStyle(): void {
      if (!this.player) return;
      const dogTurn = options.playStyle === 'alternating' && this.activePlayer === 1;
      const cosmetic = COSMETICS.find(item => item.id === options.cosmetic) ?? COSMETICS[0];
      this.player.setTexture(dogTurn ? 'player2Dog' : 'mascot', dogTurn ? 20 : 0).setDisplaySize(dogTurn ? 68 : 52, dogTurn ? 54 : 52).setFlipX(false).setTint(dogTurn ? cosmetic.dogTint : cosmetic.heroTint);
      this.playerShadows[0]?.setDisplaySize(dogTurn ? 38 : 30, 10);
      if (this.player2) this.player2.setTexture('player2Dog', 20).setDisplaySize(68, 54).setFlipX(false).setTint(cosmetic.dogTint);
      try {
        this.player.postFX.clear();
        this.player2?.postFX.clear();
      } catch { /* WebGL FX unavailable */ }
    }

    private applyVillainOutline(villain: Villain): void {
      try {
        villain.sprite.postFX.clear();
      } catch { /* WebGL FX unavailable */ }
    }

    private setWarning(message: string, duration: number): void { this.warning = message; this.warningUntil = this.time.now + duration; this.emitSnapshot(); }
    private emitSnapshot(): void {
      this.syncActivePlayer();
      const now = this.time.now;
      const bonusSeconds = Math.max(0, Math.ceil(((this.activeBonus?.expiresAt ?? this.nextBonusAt) - now) / 1000));
      const bonusDirection = this.activeBonus ? this.compassDirection(this.player.x, this.player.y, this.activeBonus.container.x, this.activeBonus.container.y) : undefined;
      const teammateDirections = this.player2 ? [
        this.compassDirection(this.player.x, this.player.y, this.player2.x, this.player2.y),
        this.compassDirection(this.player2.x, this.player2.y, this.player.x, this.player.y)
      ] as [CompassDirection, CompassDirection] : undefined;
      options.onSnapshot({ world: this.world, score: this.score, playerCount: options.playerCount, activePlayer: this.activePlayer, playerScores: [...this.playerScores] as [number, number], playerLives: [...this.playerLives] as [number, number], playerShields: [...this.playerShields] as [boolean, boolean], downedPlayers: [...this.downedPlayers] as [boolean, boolean], reviveProgress: [...this.reviveProgress] as [number, number], coins: this.pellets, remainingHearts: this.pelletObjects.size, lives: this.lives, combo: this.combo, revealed: [...this.revealed], totalSlots: values.length,
        specialIndex: options.draw.special === undefined ? undefined : values.length - 1, warning: this.warning,
        powerUp: this.bonusEffect ? `${STREET_BONUSES[this.bonusEffect].label} • ${STREET_BONUSES[this.bonusEffect].effect}` : this.shielded ? 'Mind Coin Shield • READY' : this.time.now < this.luckyRushUntil ? 'Mind Coin Rush • ACTIVE' : 'Shield recharging',
        hasMoved: this.hasMoved, usedPortal: this.usedPortal, powerUpsUsed: this.powerUpsUsed, villainEncounters: this.villainEncounters,
        revivesCompleted: this.revivesCompleted, bossHealth: this.bossHealth, bossMaxHealth: this.bossMaxHealth,
        mechanic: DETROIT_LEVELS[this.world]?.mechanic ?? '', bonusEffect: this.bonusEffect, bonusesCollected: this.bonusesCollected,
        bestCombo: this.bestCombo, teamCombo: this.teamCombo, heartsCollected: this.pellets, levelHeartsTotal: this.initialPellets,
        bonusSeconds, bonusActive: Boolean(this.activeBonus), bonusDirection, syncGateReady: this.syncGateReady(), teammateDirections,
        eventName: this.eventName || undefined, eventSeconds: this.eventName ? Math.max(0, Math.ceil((this.eventActiveUntil - now) / 1000)) : Math.max(0, Math.ceil((this.nextDetroitEventAt - now) / 1000)),
        eventsCompleted: this.eventsCompleted, missedBonuses: this.missedBonuses,
        runVariant: options.runVariant, timeAttackSeconds: Math.max(0, Math.ceil(this.levelTimeRemainingMs / 1000)),
        portalCombo: now < this.portalComboUntil ? 1 + this.portalComboChain : 0,
        portalComboSeconds: now < this.portalComboUntil ? Math.max(0, Math.ceil((this.portalComboUntil - now) / 1000)) : 0,
        bonusTier: this.bonusEffectTier ?? this.activeBonus?.tier, missions: evaluateDetroitMissions(this.world, this.levelMissionStats),
        missionsCompleted: this.missionsCompleted, bossLabel: this.bossLabel || undefined });
    }

    private tone(frequency: number, duration: number): void {
      if (options.muted || options.effectsVolume <= 0) return;
      try {
        this.audio ??= new AudioContext(); const oscillator = this.audio.createOscillator(); const gain = this.audio.createGain();
        oscillator.type = 'triangle'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(Math.max(0.001, 0.075 * options.effectsVolume), this.audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + duration); oscillator.connect(gain).connect(this.audio.destination); oscillator.start(); oscillator.stop(this.audio.currentTime + duration);
      } catch { /* audio unavailable */ }
    }

    private villainTone(kind: EnemyKind): void {
      const patterns: Record<EnemyKind, number[]> = {
        tax: [210, 155], reaper: [155, 110, 82], chaos: [280, 170, 330], envy: [240, 200], police: [660, 440, 660, 440]
      };
      patterns[kind].forEach((frequency, index) => this.time.delayedCall(index * 85, () => this.tone(frequency, 0.12)));
    }

    disposeAudio(): void { this.audio?.close().catch(() => undefined); }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: '#020207',
    render: { antialias: true, powerPreference: 'high-performance' }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: MazeScene
  });
  let runtimePaused = false;
  const setPausedState = (paused: boolean) => {
    if (!sceneRef || runtimePaused === paused) return;
    runtimePaused = paused;
    if (paused) { sceneRef.saveProgressCheckpoint(); sceneRef.scene.pause(); } else sceneRef.scene.resume();
    options.onPausedChange(paused);
  };
  const handleRuntimeKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, select, textarea, button')) return;
    pressedCodes.add(event.code);
    if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); setPausedState(!runtimePaused); }
  };
  const handleRuntimeKeyUp = (event: KeyboardEvent) => { pressedCodes.delete(event.code); };
  const gamepadStartDown = () => Array.from(navigator.getGamepads?.() ?? []).some(gamepad => Boolean(gamepad?.buttons[9]?.pressed));
  let gamepadStartHeld = gamepadStartDown();
  const gamepadPausePoll = window.setInterval(() => {
    const startPressed = gamepadStartDown();
    if (startPressed && !gamepadStartHeld) setPausedState(!runtimePaused);
    gamepadStartHeld = startPressed;
  }, 100);
  window.addEventListener('keydown', handleRuntimeKey);
  window.addEventListener('keyup', handleRuntimeKeyUp);

  return {
    destroy: () => { window.removeEventListener('keydown', handleRuntimeKey); window.removeEventListener('keyup', handleRuntimeKeyUp); window.clearInterval(gamepadPausePoll); sceneRef?.disposeAudio(); sceneRef = null; game.destroy(true); },
    setDirection: (direction, player = 0) => { if (direction) controls.directions[player] = direction; },
    activatePowerUp: () => { controls.activate = true; },
    setPaused: setPausedState,
    setEffectsVolume: volume => { options.effectsVolume = volume; },
    setMuted: muted => { options.muted = muted; },
    setHaptics: enabled => { options.haptics = enabled; },
    setBindings: (player, bindings) => { if (player === 0) options.p1Bindings = bindings; else options.p2Bindings = bindings; },
    saveCheckpoint: () => sceneRef?.saveProgressCheckpoint(),
    restartLevel: () => sceneRef?.restartCurrentLevel()
  };
}
