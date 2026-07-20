'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Brain, Target, Zap, Puzzle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { updateDocument, serverTimestamp } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/constants';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Quizy Arena',
    subtitle: 'Play. Think. Grow.',
    description:
      'Train your brain with premium cognitive games. Improve memory, logic, focus, and more.',
  },
  {
    id: 'skills',
    title: 'What do you want to improve?',
    subtitle: 'Pick 2–4 skills',
    description:
      'We\'ll recommend games based on your goals.',
  },
  {
    id: 'ready',
    title: 'You\'re all set!',
    subtitle: 'Let\'s play your first game',
    description:
      'Your brain training journey starts now.',
  },
] as const;

const skillIcons: Record<string, React.ReactNode> = {
  memory: <Brain className="h-5 w-5" />,
  logic: <Puzzle className="h-5 w-5" />,
  focus: <Target className="h-5 w-5" />,
  reaction: <Zap className="h-5 w-5" />,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = ONBOARDING_STEPS[step];
  const isLastStep = step === ONBOARDING_STEPS.length - 1;

  function toggleSkill(skillId: string) {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : prev.length < 4
          ? [...prev, skillId]
          : prev,
    );
  }

  async function handleComplete() {
    if (!firebaseUser) return;
    setIsSubmitting(true);

    try {
      // Mark arena profile as onboarded
      await updateDocument('arena_profiles', firebaseUser.uid, {
        isOnboarded: true,
        selectedSkillGoals: selectedSkills,
        updatedAt: serverTimestamp(),
      });

      // Add 'arena' to onboarded apps
      const currentApps = userProfile?.onboardedApps ?? [];
      if (!currentApps.includes('arena')) {
        await updateDocument('users', firebaseUser.uid, {
          onboardedApps: [...currentApps, 'arena'],
          updatedAt: serverTimestamp(),
        });
      }

      router.replace('/');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step
                  ? 'w-8 bg-primary'
                  : i < step
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-card-hover',
              )}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary-muted flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-text-primary mb-1">
            {currentStep.title}
          </h1>
          <p className="text-sm text-primary font-medium mb-2">
            {currentStep.subtitle}
          </p>
          <p className="text-sm text-text-secondary">
            {currentStep.description}
          </p>
        </div>

        {/* Skills Selection (step 1) */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary-muted text-primary'
                      : 'border-border bg-card text-text-secondary hover:border-border-hover',
                  )}
                >
                  <span style={{ color: skill.color }}>
                    {skillIcons[skill.id] || <span className="text-lg">●</span>}
                  </span>
                  <span className="text-sm font-medium">{skill.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isLastStep ? (
            <Button
              fullWidth
              onClick={handleComplete}
              isLoading={isSubmitting}
            >
              Start Playing
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedSkills.length < 2}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {step > 0 && !isLastStep && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
