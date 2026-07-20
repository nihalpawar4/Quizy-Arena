'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import {
  spinLuckyWheel,
  canSpinWheel,
  WHEEL_SEGMENTS,
  type WheelSegment,
} from '@/lib/firebase/rewards';
import type { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface LuckyWheelProps {
  uid: string | undefined;
  lastSpinAt: Timestamp | null | undefined;
}

export function LuckyWheel({ uid, lastSpinAt }: LuckyWheelProps) {
  const addToast = useUIStore((s) => s.addToast);
  const [canSpin, setCanSpin] = useState(() => canSpinWheel(lastSpinAt));
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<WheelSegment | null>(null);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  useEffect(() => {
    setCanSpin(canSpinWheel(lastSpinAt));
  }, [lastSpinAt]);

  const handleSpin = useCallback(async () => {
    if (!uid || isSpinning || !canSpin) return;
    setIsSpinning(true);
    setLastResult(null);

    try {
      const result = await spinLuckyWheel(uid);
      if (!result) {
        addToast({ message: 'Already spun today', variant: 'warning' });
        setCanSpin(false);
        setIsSpinning(false);
        return;
      }

      const { segmentIndex, segment } = result;
      const spins = 5;
      const targetAngle = 360 - (segmentIndex * segmentAngle + segmentAngle / 2);
      const newRotation = rotation + spins * 360 + targetAngle;

      setRotation(newRotation);

      setTimeout(() => {
        setLastResult(segment);
        setCanSpin(false);
        setIsSpinning(false);
        addToast({
          message: 'You won!',
          description: segment.label,
          variant: 'success',
        });
      }, 4000);
    } catch {
      addToast({ message: 'Failed to spin wheel', variant: 'error' });
      setIsSpinning(false);
    }
  }, [uid, isSpinning, canSpin, rotation, segmentAngle, addToast]);

  return (
    <section>
      <div className="rounded-2xl bg-surface shadow-sm p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Wheel */}
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-md" />
            <div className="relative">
              {/* Pointer */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary drop-shadow-sm" />
              </div>

              <div
                className={cn(
                  'relative h-52 w-52 rounded-full overflow-hidden shadow-lg',
                  'ring-4 ring-surface',
                  isSpinning && 'transition-transform duration-[4000ms] ease-out',
                )}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <svg viewBox="0 0 200 200" className="h-full w-full">
                  {WHEEL_SEGMENTS.map((seg, i) => {
                    const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                    const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                    const x1 = 100 + 95 * Math.cos(startAngle);
                    const y1 = 100 + 95 * Math.sin(startAngle);
                    const x2 = 100 + 95 * Math.cos(endAngle);
                    const y2 = 100 + 95 * Math.sin(endAngle);
                    const largeArc = segmentAngle > 180 ? 1 : 0;
                    const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                    const tx = 100 + 60 * Math.cos(midAngle);
                    const ty = 100 + 60 * Math.sin(midAngle);

                    return (
                      <g key={seg.label}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={i % 2 === 0 ? seg.color : `${seg.color}CC`}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="white"
                          fontSize="8"
                          fontWeight="600"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${(i + 0.5) * segmentAngle}, ${tx}, ${ty})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="100" cy="100" r="18" fill="var(--arena-surface)" />
                  <circle cx="100" cy="100" r="14" fill="var(--arena-primary)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Info + Action */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Lucky Wheel</h3>
              {canSpin ? (
                <Badge variant="success">Free spin!</Badge>
              ) : (
                <Badge variant="default">Spun today</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-4">
              {canSpin
                ? 'Spin once daily for coins, diamonds, or bonus XP!'
                : lastResult
                  ? `You won ${lastResult.label}. Come back tomorrow!`
                  : 'Come back tomorrow for another free spin!'}
            </p>
            <Button
              onClick={handleSpin}
              isLoading={isSpinning}
              disabled={!canSpin || !uid}
              className="min-w-[140px]"
            >
              {canSpin ? 'Spin Now' : 'Spun Today'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
