import type { Size, UnitKind } from './types';

/** Box shape per board size: 4 = 2x2, 6 = 2 rows by 3 columns, 9 = 3x3 */
export const GEOMETRY: Record<Size, { boxRows: number; boxCols: number }> = {
  4: { boxRows: 2, boxCols: 2 },
  6: { boxRows: 2, boxCols: 3 },
  9: { boxRows: 3, boxCols: 3 },
};

export type Unit = { kind: UnitKind; index: number; cells: number[] };

export type Grid = {
  size: Size;
  boxRows: number;
  boxCols: number;
  /** Bitmask with the low `size` bits set */
  full: number;
  units: Unit[];
  /** Box index of every cell */
  boxOf: number[];
  /** Every other cell sharing a row, column or box with this one */
  peers: number[][];
};

const cache: Partial<Record<Size, Grid>> = {};

/** Precomputed geometry for a board size; built once per size. */
export function grid(size: Size): Grid {
  const cached = cache[size];
  if (cached) return cached;

  const { boxRows, boxCols } = GEOMETRY[size];
  const boxOf = Array.from({ length: size * size }, (_, cell) => {
    const row = Math.floor(cell / size);
    const col = cell % size;
    return Math.floor(row / boxRows) * (size / boxCols) + Math.floor(col / boxCols);
  });

  const units: Unit[] = [];
  for (let index = 0; index < size; index += 1) {
    units.push({ kind: 'row', index, cells: Array.from({ length: size }, (_, col) => index * size + col) });
  }
  for (let index = 0; index < size; index += 1) {
    units.push({ kind: 'col', index, cells: Array.from({ length: size }, (_, row) => row * size + index) });
  }
  for (let index = 0; index < size; index += 1) {
    units.push({ kind: 'box', index, cells: boxOf.flatMap((box, cell) => (box === index ? [cell] : [])) });
  }

  const peers = Array.from({ length: size * size }, (_, cell) => {
    const set = new Set<number>();
    for (const unit of units) {
      if (unit.cells.includes(cell)) for (const other of unit.cells) if (other !== cell) set.add(other);
    }
    return [...set];
  });

  const built: Grid = { size, boxRows, boxCols, full: (1 << size) - 1, units, boxOf, peers };
  cache[size] = built;
  return built;
}

export const rowOf = (size: Size, cell: number): number => Math.floor(cell / size);
export const colOf = (size: Size, cell: number): number => cell % size;

/** Bit for a symbol value 1..size */
export const bit = (value: number): number => 1 << (value - 1);

/** Values whose bits are set, ascending */
export function bitsToValues(mask: number, size: Size): number[] {
  const values: number[] = [];
  for (let value = 1; value <= size; value += 1) if (mask & bit(value)) values.push(value);
  return values;
}
