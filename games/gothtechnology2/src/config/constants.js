export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const GROUND_Y = 588;
export const ROUND_SECONDS = 99;
export const GRAVITY = 2100;
export const WORLD = {
  left: 170,
  right: 1110,
  floor: GROUND_Y
};

export const MOTIONS = [
  "IDLE",
  "READY_STANCE",
  "WALK_FORWARD",
  "WALK_BACK",
  "RUN_FORWARD",
  "RUN_BACK",
  "DASH_FORWARD",
  "DASH_BACK",
  "JUMP_START",
  "JUMP_RISE",
  "JUMP_PEAK",
  "JUMP_FALL",
  "LANDING",
  "CROUCH_IDLE",
  "CROUCH_WALK",
  "BLOCK_HIGH",
  "BLOCK_LOW",
  "LIGHT_PUNCH",
  "HEAVY_PUNCH",
  "LIGHT_KICK",
  "HEAVY_KICK",
  "AIR_ATTACK",
  "CROUCH_ATTACK",
  "COMBO_1",
  "COMBO_2",
  "SPECIAL_START",
  "SPECIAL_PROJECTILE",
  "SPECIAL_RECOVER",
  "SUPER_CHARGE",
  "SUPER_RELEASE",
  "THROW_GRAB",
  "THROW_FINISH",
  "HURT_LIGHT",
  "HURT_HEAVY",
  "KNOCKDOWN",
  "GET_UP",
  "TAUNT",
  "VICTORY",
  "DEFEAT"
];

export const PHASE = {
  TITLE: "title",
  LOADING: "loading",
  GAME_SELECT: "gameSelect",
  SELECT: "select",
  VERSUS: "versus",
  FIGHT: "fight",
  PAUSE: "pause",
  KO: "ko",
  ROUND_END: "roundEnd",
  MATCH_END: "matchEnd"
};

export const COLORS = {
  ink: "#050403",
  panel: "rgba(8, 7, 6, 0.72)",
  gold: "#d8aa45",
  goldBright: "#ffd66d",
  blue: "#9ed8ff",
  red: "#e05a45",
  white: "#f8f1d4",
  smoke: "rgba(183, 217, 232, 0.28)"
};
