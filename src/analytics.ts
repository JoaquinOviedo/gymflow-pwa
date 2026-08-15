import type { ExerciseSet, PersonalRecord, WorkoutSession } from './types'
import { estimatedOneRepMax, uid, volume } from './utils'

export function detectNewRecords(exerciseId: string, sets: ExerciseSet[], previous: PersonalRecord[], date: string): PersonalRecord[] {
  const valid = sets.filter((set) => set.completed && set.reps > 0)
  const next: PersonalRecord[] = []
  const types: Array<{ type: PersonalRecord['type']; value: (set: ExerciseSet) => number }> = [
    { type: 'weight', value: (set) => set.weight }, { type: 'reps', value: (set) => set.reps }, { type: 'volume', value: (set) => volume(set.weight, set.reps) }, { type: 'estimated1RM', value: (set) => estimatedOneRepMax(set.weight, set.reps) },
  ]
  types.forEach(({ type, value }) => { const best = valid.reduce<ExerciseSet | undefined>((winner, set) => !winner || value(set) > value(winner) ? set : winner, undefined); const old = previous.filter((record) => record.exerciseId === exerciseId && record.type === type).reduce((max, record) => Math.max(max, record.value), 0); if (best && value(best) > old) next.push({ id: uid('pr'), exerciseId, type, value: value(best), weight: best.weight, reps: best.reps, date }) })
  return next
}
export function sessionVolume(session: WorkoutSession) { return session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).reduce((sum, set) => sum + volume(set.weight, set.reps), 0) }
