type Props = {
  value: number;
  max: number;
  /** auto = green/amber/red by ratio (HP); sky = always blue (XP) */
  tone?: 'auto' | 'sky';
  className?: string;
};

export const Bar = ({ value, max, tone = 'auto', className = 'h-3' }: Props) => {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const fill = tone === 'sky' ? 'bg-sky' : ratio > 0.5 ? 'bg-leaf' : ratio > 0.25 ? 'bg-sun' : 'bg-berry';
  return (
    <span className={`block w-full overflow-hidden rounded-full border-2 border-ink bg-white ${className}`}>
      <span className={`block h-full ${fill} transition-[width] duration-300`} style={{ width: `${ratio * 100}%` }} />
    </span>
  );
};
