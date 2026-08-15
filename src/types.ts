export type MuscleGroup = 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Bíceps' | 'Tríceps' | 'Core'
export type LoadUnit = 'kg' | 'lb'
export type Theme = 'light' | 'dark' | 'system'
export type Page = 'dashboard' | 'routines' | 'session' | 'calendar' | 'progress' | 'technique' | 'history' | 'settings'

export interface ExerciseAnalysisConfig { recommendedOrientation: string; requiredLandmarks: string[] }
export interface Exercise { id: string; name: string; muscleGroup: MuscleGroup; description: string; instructions: string[]; type: 'strength' | 'bodyweight'; loadUnit: LoadUnit; cameraEnabled: boolean; analysis?: ExerciseAnalysisConfig; custom?: boolean }
export interface RoutineExercise { exerciseId: string; order: number; targetSets: number; repMin: number; repMax: number; restSeconds: number; notes?: string; startingWeight?: number; startingLoad?: string }
export interface WorkoutRoutine { id: string; name: string; description: string; exercises: RoutineExercise[]; createdAt: string }
export interface ExerciseSet { id: string; exerciseId: string; setNumber: number; reps: number; weight: number; rir?: number; completed: boolean; timestamp: string }
export interface SessionExercise { exerciseId: string; sets: ExerciseSet[] }
export interface WorkoutSession { id: string; routineId: string; date: string; startedAt: string; endedAt?: string; durationSeconds: number; exercises: SessionExercise[]; notes: string; completed: boolean }
export type RecordType = 'weight' | 'reps' | 'volume' | 'estimated1RM'
export interface PersonalRecord { id: string; exerciseId: string; type: RecordType; value: number; weight: number; reps: number; date: string }
export interface BodyWeightEntry { id: string; date: string; weight: number }
export interface TechniqueAnalysis { id: string; exerciseId: string; date: string; reps: number; quality?: number; metrics: Record<string, number>; errors: string[]; observations: string[] }
export interface ActiveSession { sessionId: string; startedAt: string; pausedAt?: string; pausedSeconds: number }
export interface AppSettings { theme: Theme; unit: LoadUnit; autoRest: boolean; restSound: boolean; vibration: boolean; showSkeleton: boolean }
export interface AppState { exercises: Exercise[]; routines: WorkoutRoutine[]; sessions: WorkoutSession[]; records: PersonalRecord[]; bodyWeight: BodyWeightEntry[]; analyses: TechniqueAnalysis[]; activeSession?: ActiveSession; settings: AppSettings }
