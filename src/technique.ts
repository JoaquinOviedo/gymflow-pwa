export interface Landmark { name: string; x: number; y: number; z?: number; visibility?: number }
export interface PoseFrame { landmarks: Landmark[]; timestamp: number }
export interface TechniqueFeedback { reps: number; phase: string; quality?: number; confidence: number; metrics: Record<string, number>; warnings: string[]; message: string }
export interface ExerciseAnalyzer { analyze(frame: PoseFrame): TechniqueFeedback; reset(): void }

const get = (frame: PoseFrame, name: string) => frame.landmarks.find((point) => point.name === name)
const confidence = (frame: PoseFrame, names: string[]) => names.reduce((sum, name) => sum + (get(frame, name)?.visibility ?? 0), 0) / names.length
export const angle = (a: Landmark, b: Landmark, c: Landmark) => { const ab = { x: a.x - b.x, y: a.y - b.y }; const cb = { x: c.x - b.x, y: c.y - b.y }; const dot = ab.x * cb.x + ab.y * cb.y; const magnitudes = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y); return magnitudes ? Math.round(Math.acos(Math.min(1, Math.max(-1, dot / magnitudes))) * 180 / Math.PI) : 0 }

abstract class BaseAnalyzer implements ExerciseAnalyzer {
  protected reps = 0; protected phase = 'READY'; protected lowConfidence = false
  abstract analyze(frame: PoseFrame): TechniqueFeedback
  reset() { this.reps = 0; this.phase = 'READY'; this.lowConfidence = false }
  protected fallback(frame: PoseFrame, required: string[]): TechniqueFeedback { const conf = confidence(frame, required); this.lowConfidence = conf < 0.55; return { reps: this.reps, phase: this.phase, confidence: Math.round(conf * 100), metrics: {}, warnings: this.lowConfidence ? ['No puedo evaluar correctamente esta repetición.'] : [], message: this.lowConfidence ? 'Mejorá la luz y mantené todo el cuerpo visible.' : 'Preparado para analizar.' } }
}
export class BicepsCurlAnalyzer extends BaseAnalyzer {
  analyze(frame: PoseFrame) { const base = this.fallback(frame, ['left_shoulder','left_elbow','left_wrist']); const shoulder = get(frame, 'left_shoulder'); const elbow = get(frame, 'left_elbow'); const wrist = get(frame, 'left_wrist'); if (!shoulder || !elbow || !wrist || base.confidence < 55) return base; const elbowAngle = angle(shoulder, elbow, wrist); if (elbowAngle < 45 && this.phase !== 'UP') { this.phase = 'UP' } else if (elbowAngle > 155 && this.phase === 'UP') { this.phase = 'DOWN'; this.reps += 1 } else if (elbowAngle > 155) this.phase = 'DOWN'; return { ...base, reps: this.reps, phase: this.phase, metrics: { elbowAngle }, message: elbowAngle < 45 ? 'Contracción arriba.' : this.reps ? '✓ Repetición completa.' : 'Bajá con control.', warnings: elbowAngle > 145 && base.confidence > 70 ? ['Buscá un rango completo y controlado.'] : [] } }
}
export class SquatAnalyzer extends BaseAnalyzer {
  analyze(frame: PoseFrame) { const base = this.fallback(frame, ['left_hip','left_knee','left_ankle']); const hip = get(frame, 'left_hip'); const knee = get(frame, 'left_knee'); const ankle = get(frame, 'left_ankle'); if (!hip || !knee || !ankle || base.confidence < 55) return base; const kneeAngle = angle(hip, knee, ankle); if (kneeAngle < 100 && this.phase !== 'BOTTOM') this.phase = 'BOTTOM'; else if (kneeAngle > 160 && this.phase === 'BOTTOM') { this.phase = 'STANDING'; this.reps += 1 } else if (kneeAngle > 160) this.phase = 'STANDING'; return { ...base, reps: this.reps, phase: this.phase, metrics: { kneeAngle }, message: kneeAngle < 100 ? 'Buena profundidad.' : this.reps ? '✓ Subida completa.' : 'Descendé con control.', warnings: kneeAngle > 120 && this.phase === 'BOTTOM' ? ['Probá bajar un poco más.'] : [] } }
}
export class ShoulderPressAnalyzer extends BaseAnalyzer {
  analyze(frame: PoseFrame) { const base = this.fallback(frame, ['left_shoulder','left_elbow','left_wrist']); const shoulder = get(frame, 'left_shoulder'); const elbow = get(frame, 'left_elbow'); const wrist = get(frame, 'left_wrist'); if (!shoulder || !elbow || !wrist || base.confidence < 55) return base; const handAboveShoulder = wrist.y < shoulder.y - 0.08; if (handAboveShoulder && this.phase !== 'UP') this.phase = 'UP'; else if (!handAboveShoulder && this.phase === 'UP') { this.phase = 'DOWN'; this.reps += 1 } return { ...base, reps: this.reps, phase: this.phase, metrics: { wristHeight: Math.round((shoulder.y - wrist.y) * 100) }, message: handAboveShoulder ? 'Brazos arriba.' : this.reps ? '✓ Repetición completa.' : 'Empujá hacia arriba.', warnings: [] } }
}
export const analyzers: Record<string, () => ExerciseAnalyzer> = { squat: () => new SquatAnalyzer(), curl: () => new BicepsCurlAnalyzer(), press: () => new ShoulderPressAnalyzer() }
