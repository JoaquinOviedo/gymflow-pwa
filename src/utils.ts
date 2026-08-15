export const uid = (prefix = 'id') => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`
export const isoDate = (date = new Date()) => date.toISOString().slice(0, 10)
export const formatDate = (value: string) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
export const formatLongDate = (value: string) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
export const formatDuration = (seconds: number) => { const h = Math.floor(seconds / 3600).toString().padStart(2, '0'); const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'); const s = Math.floor(seconds % 60).toString().padStart(2, '0'); return `${h}:${m}:${s}` }
export const formatTimerShort = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
export const formatNumber = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value)
export const volume = (weight: number, reps: number) => weight * reps
export const estimatedOneRepMax = (weight: number, reps: number) => reps <= 1 ? weight : weight * (1 + reps / 30)
export const weekStart = (date = new Date()) => { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0, 0, 0, 0); return d }
export const isSameWeek = (dateString: string, reference = new Date()) => new Date(`${dateString}T12:00:00`) >= weekStart(reference)
