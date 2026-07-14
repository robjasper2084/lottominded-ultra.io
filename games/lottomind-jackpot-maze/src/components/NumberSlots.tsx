import { LOTTERY_RULES } from '../config/lotteryRules';
import type { LotteryMode } from '../types/game';

export function NumberSlots({ mode, values, scrambled = false }: { mode: LotteryMode; values: Array<number | null>; scrambled?: boolean }) {
  const rule = LOTTERY_RULES[mode];
  const shown = scrambled ? [...values].reverse() : values;
  return (
    <div className="number-slots" aria-label="Collected lottery number slots">
      {shown.map((value, index) => {
        const special = Boolean(rule.special) && index === values.length - 1;
        return <span key={index} className={`number-slot ${special ? rule.special!.color : ''} ${value === null ? 'empty' : 'revealed'}`} aria-label={special ? rule.special!.label : `Number ${index + 1}`}>
          <span className="ball-number" aria-hidden="true">{value ?? '?'}</span>
        </span>;
      })}
    </div>
  );
}
