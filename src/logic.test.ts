import { describe, expect, it } from 'vitest'
import { detectNewRecords, sessionVolume } from './analytics'
import { BicepsCurlAnalyzer, type PoseFrame } from './technique'
import type { ExerciseSet, WorkoutSession } from './types'
import { estimatedOneRepMax, isSameWeek, volume } from './utils'

const set = (weight: number, reps: number, completed = true): ExerciseSet => ({ id: `${weight}-${reps}`, exerciseId: 'curl', setNumber: 1, weight, reps, completed, timestamp: '2026-08-15T10:00:00.000Z' })

describe('training calculations', () => {
  it('calculates volume and estimated 1RM', () => {
    expect(volume(12, 10)).toBe(120)
    expect(estimatedOneRepMax(12, 10)).toBeCloseTo(16)
  })

  it('detects only records that beat the existing history', () => {
    const records = detectNewRecords('curl', [set(12, 10)], [], '2026-08-15')
    expect(records.map((record) => record.type)).toEqual(['weight', 'reps', 'volume', 'estimated1RM'])
    expect(detectNewRecords('curl', [set(12, 10)], records, '2026-08-16')).toHaveLength(0)
  })

  it('sums completed session volume only', () => {
    const session: WorkoutSession = { id: 'session', routineId: 'routine', date: '2026-08-15', startedAt: '2026-08-15T10:00:00Z', durationSeconds: 100, completed: true, notes: '', exercises: [{ exerciseId: 'curl', sets: [set(10, 10), set(10, 8, false)] }] }
    expect(sessionVolume(session)).toBe(100)
  })

  it('recognizes a date in the current Monday-Sunday week', () => {
    expect(isSameWeek('2026-08-10', new Date('2026-08-15T12:00:00Z'))).toBe(true)
    expect(isSameWeek('2026-08-09', new Date('2026-08-15T12:00:00Z'))).toBe(false)
  })
})

describe('biceps curl analyzer', () => {
  const pose = (angleState: 'down' | 'up'): PoseFrame => { const wristY = angleState === 'up' ? .4 : .9; return { timestamp: Date.now(), landmarks: [{ name: 'left_shoulder', x: .5, y: .2, visibility: 1 }, { name: 'left_elbow', x: .5, y: .55, visibility: 1 }, { name: 'left_wrist', x: .5, y: wristY, visibility: 1 }] } }
  it('counts a complete down-up-down cycle once', () => {
    const analyzer = new BicepsCurlAnalyzer()
    analyzer.analyze(pose('down'))
    analyzer.analyze(pose('up'))
    const result = analyzer.analyze(pose('down'))
    expect(result.reps).toBe(1)
    expect(analyzer.analyze(pose('down')).reps).toBe(1)
  })
})
