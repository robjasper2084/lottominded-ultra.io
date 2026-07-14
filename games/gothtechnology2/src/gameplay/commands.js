export const attackIntentFromActions = (actions = {}) => {
  if (actions.throw) return "throw";
  if (actions.super) return "super";
  if (actions.special) return "special";
  if (actions.lightPunch && actions.heavyPunch) return "combo1";
  if (actions.lightPunch && actions.lightKick) return "combo2";
  if (actions.lightPunch && actions.down) return "crouchAttack";
  if (actions.lightKick && !actions.grounded) return "airAttack";
  if (actions.heavyPunch) return "heavyPunch";
  if (actions.heavyKick) return "heavyKick";
  if (actions.lightPunch) return "lightPunch";
  if (actions.lightKick) return "lightKick";
  return null;
};

export const resolveCancelAttack = (currentAttack, nextAttack) => {
  if (currentAttack === "lightPunch" && nextAttack === "heavyPunch") return "combo1";
  if (currentAttack === "combo1" && nextAttack === "heavyKick") return "combo2";
  return nextAttack;
};
