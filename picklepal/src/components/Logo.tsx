import Image from 'next/image';

interface LogoProps {
  size?: number;
  variant?: 'default' | 'inverse';
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({
  size = 40,
  variant = 'default',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const isInverse = variant === 'inverse';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Image
        src="/assets/logo-mark.svg"
        alt="DinkDay"
        width={size}
        height={size}
        className="shrink-0 -mr-1"
        priority
      />
      {showWordmark && (
        <span
          className={`font-bold tracking-tight leading-none text-[17px] ${
            isInverse ? 'text-white' : 'text-text-primary'
          }`}
        >
          ink
          <span className={isInverse ? 'text-white/80' : 'text-court-green'}>
            Day
          </span>
        </span>
      )}
    </div>
  );
}
