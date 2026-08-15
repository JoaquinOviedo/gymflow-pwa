import type { Exercise, RoutineExercise, WorkoutRoutine } from './types'
import { uid } from './utils'

export interface ExcelImportResult { routines: WorkoutRoutine[]; exercises: Exercise[]; sourceSheet: string }

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const text = (value: unknown) => value === null || value === undefined ? '' : String(value).trim()
const isDayHeader = (value: string) => /^dia\s*\d+/i.test(value)
const isSectionHeader = (value: string) => /^(variantes de ejercicios|ejercicios eliminados)$/i.test(value)
const extractWeight = (value: unknown) => { if (typeof value === 'number' && Number.isFinite(value)) return value; const raw = text(value); return /^\s*\d+(?:[.,]\d+)?\s*(?:kg)?\s*$/i.test(raw) ? Number(raw.replace(',', '.').replace(/kg/i, '').trim()) : undefined }
const extractPrescription = (name: string) => { const match = name.match(/(\d+)\s*[x×]\s*(\d+)/i); const duration = name.match(/(\d+(?:[.,]\d+)?)\s*(?:'|”|"|min)/i); return { targetSets: match ? Math.max(1, Number(match[1])) : 3, repMin: match ? Number(match[2]) : duration ? 1 : 8, repMax: match ? Number(match[2]) : duration ? 1 : 12, label: name.replace(/\s*\d+\s*[x×]\s*\d+\s*/i, ' ').replace(/\s+/g, ' ').trim() } }

function findOrCreateExercise(name: string, exercises: Exercise[]) {
  const key = normalize(name).replace(/\b(mc|scott|polea|banda|maquina|máquina)\b/g, '').replace(/\s+/g, ' ').trim()
  const existing = exercises.find((exercise) => { const candidate = normalize(exercise.name).replace(/\b(mc|scott|polea|banda|maquina|máquina)\b/g, '').replace(/\s+/g, ' ').trim(); return candidate === key || candidate.includes(key) || key.includes(candidate) })
  if (existing) return existing
  const created: Exercise = { id: uid('exercise'), name, muscleGroup: inferMuscleGroup(name), description: 'Ejercicio importado desde tu plan personal.', instructions: ['Prepará la postura.', 'Mové con control.', 'Respirá de forma constante.'], type: 'strength', loadUnit: 'kg', cameraEnabled: false, custom: true }
  exercises.push(created)
  return created
}
function inferMuscleGroup(name: string): Exercise['muscleGroup'] { const value = normalize(name); if (/pecho|press|apertura|push/.test(value)) return 'Pecho'; if (/curl|biceps/.test(value)) return 'Bíceps'; if (/triceps|extension/.test(value)) return 'Tríceps'; if (/sentadilla|peso muerto|cuadriceps|isqui|glute|abductor|gemelo|air squat/.test(value)) return 'Piernas'; if (/hombro|militar|vuelo|rotador|wall slide/.test(value)) return 'Hombros'; if (/remo|jalon|face pull|espalda|dominada|pull over/.test(value)) return 'Espalda'; return 'Core' }

function buildRoutine(name: string, rows: unknown[][], exerciseColumn: number, loadColumn: number, currentColumn: number | undefined, start: number, end: number, exercises: Exercise[]): WorkoutRoutine | undefined {
  const routineExercises: RoutineExercise[] = []
  let blanks = 0
  for (let row = start; row <= end; row++) {
    const rawName = text(rows[row]?.[exerciseColumn])
    if (!rawName) { blanks += 1; if (blanks >= 2 && routineExercises.length) break; continue }
    blanks = 0
    if (isSectionHeader(rawName)) break
    if (isDayHeader(rawName) || /^pb$/i.test(rawName)) continue
    const parsed = extractPrescription(rawName); if (!parsed.label) continue
    const load = text(rows[row]?.[loadColumn]); const current = currentColumn === undefined ? '' : text(rows[row]?.[currentColumn]); const exercise = findOrCreateExercise(parsed.label, exercises)
    const startingWeight = extractWeight(rows[row]?.[currentColumn ?? loadColumn]) ?? extractWeight(rows[row]?.[loadColumn])
    routineExercises.push({ exerciseId: exercise.id, order: routineExercises.length, targetSets: parsed.targetSets, repMin: parsed.repMin, repMax: parsed.repMax, restSeconds: /estiramiento|stretch|cardio|bici|calentamiento|vuelta en calma/i.test(parsed.label) ? 45 : 90, startingWeight, startingLoad: current || load, notes: current && load && current !== load ? `Plan: ${load}. Peso actual: ${current}.` : load ? `Plan: ${load}.` : undefined })
  }
  return routineExercises.length ? { id: uid('routine'), name, description: 'Importada desde tu plan de Excel.', exercises: routineExercises, createdAt: new Date().toISOString() } : undefined
}

export async function parseWorkoutWorkbook(file: File): Promise<ExcelImportResult> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  const exercises: Exercise[] = []
  const routines: WorkoutRoutine[] = []
  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true })
    const dayHeaders: Array<{ row: number; name: string }> = []
    rows.forEach((row, index) => { const value = text(row[0]); if (isDayHeader(value)) dayHeaders.push({ row: index, name: value.replace(/\s+/g, ' ').trim().replace(/^Dia/i, 'Día') }) })
    dayHeaders.forEach((header, index) => { const routine = buildRoutine(header.name, rows, 0, 1, 2, header.row + 1, dayHeaders[index + 1]?.row ? dayHeaders[index + 1].row - 1 : rows.length - 1, exercises); if (routine) routines.push(routine) })
    const cardioRow = rows.findIndex((row) => /dia\s*2\s*cardio/i.test(text(row[4])))
    if (cardioRow >= 0) { const routine = buildRoutine('Día 2 · Cardio y movilidad', rows, 4, 5, undefined, cardioRow + 1, rows.length - 1, exercises); if (routine) routines.push(routine) }
    const stretchRow = rows.findIndex((row) => /dia\s*estiramiento/i.test(text(row[7])))
    if (stretchRow >= 0) { const routine = buildRoutine('Estiramiento', rows, 7, 8, undefined, stretchRow + 1, rows.length - 1, exercises); if (routine) routines.push(routine) }
    let catalogSection = ''
    rows.forEach((row) => { const value = text(row[0]); if (isSectionHeader(value)) { catalogSection = value; return } if (/^variantes/i.test(catalogSection) && value) findOrCreateExercise(extractPrescription(value).label, exercises) })
  })
  if (!routines.length) throw new Error('No encontré bloques de rutinas reconocibles en ese Excel.')
  return { routines, exercises, sourceSheet: workbook.SheetNames[0] ?? 'Excel' }
}
