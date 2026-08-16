import type { SkillId } from '@/lib/constants';
import type { ArenaProfileDocument } from './types';

const SKILL_FIELD_MAP: Record<SkillId, keyof ArenaProfileDocument> = {
  memory: 'skillMemory',
  logic: 'skillLogic',
  focus: 'skillFocus',
  reaction: 'skillReaction',
  creativity: 'skillCreativity',
  problemSolving: 'skillProblemSolving',
  patternRecognition: 'skillPatternRecognition',
  decisionMaking: 'skillDecisionMaking',
};

export function skillIdToArenaField(skillId: string): keyof ArenaProfileDocument {
  return SKILL_FIELD_MAP[skillId as SkillId] ?? (`skill${skillId.charAt(0).toUpperCase()}${skillId.slice(1)}` as keyof ArenaProfileDocument);
}

export function readSkillValue(
  profile: ArenaProfileDocument | null | undefined,
  skillId: SkillId,
): number {
  if (!profile) return 0;
  const field = skillIdToArenaField(skillId);
  const value = profile[field];
  return typeof value === 'number' ? value : 0;
}

export function buildSkillsRecord(profile: ArenaProfileDocument | null | undefined): Record<SkillId, number> {
  return {
    memory: readSkillValue(profile, 'memory'),
    logic: readSkillValue(profile, 'logic'),
    focus: readSkillValue(profile, 'focus'),
    reaction: readSkillValue(profile, 'reaction'),
    creativity: readSkillValue(profile, 'creativity'),
    problemSolving: readSkillValue(profile, 'problemSolving'),
    patternRecognition: readSkillValue(profile, 'patternRecognition'),
    decisionMaking: readSkillValue(profile, 'decisionMaking'),
  };
}
