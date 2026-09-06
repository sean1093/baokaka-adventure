import { SPRITES } from '../../art/sprites';
import { SYMBOLS } from '../engine/symbols';
import type { Symbols } from '../engine/types';

type Props = { value: number; symbols: Symbols; className?: string };

/** One board symbol: the toy sprite in picture mode, the digit otherwise. Fills its box. */
export const Symbol = ({ value, symbols, className = '' }: Props) => {
  if (symbols === 'digits') {
    return <span className={`grid h-full w-full place-items-center font-bold leading-none ${className}`}>{value}</span>;
  }
  const Art = SPRITES[SYMBOLS[value - 1].sprite];
  return (
    <span className={`grid h-full w-full place-items-center ${className}`}>
      <span className="block h-[78%] w-[78%]">
        <Art />
      </span>
    </span>
  );
};
