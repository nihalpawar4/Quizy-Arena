'use client';

import Image from 'next/image';

/**
 * Hero Banner — illustrated floating world for the homepage hero
 */
export function HeroBanner({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src="/illustrations/hero-banner.png"
        alt="Quizy Arena World"
        width={500}
        height={500}
        className="w-full h-auto arena-float"
        priority
      />
    </div>
  );
}
