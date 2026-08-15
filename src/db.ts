import type { AppState } from './types'

const DB_NAME = 'gymflow-db'
const STORE = 'app'
const KEY = 'state'
const FALLBACK_KEY = 'gymflow-state'

export async function loadState<T extends AppState>(fallback: T): Promise<T> {
  if (!('indexedDB' in window)) return readFallback(fallback)
  try {
    const db = await openDb()
    const value = await new Promise<T | undefined>((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(KEY); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    return value ?? fallback
  } catch { return readFallback(fallback) }
}
export async function saveState<T>(state: T) {
  try {
    if (!('indexedDB' in window)) throw new Error('IndexedDB unavailable')
    const db = await openDb()
    await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(state, KEY); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error) })
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(state))
  } catch { localStorage.setItem(FALLBACK_KEY, JSON.stringify(state)) }
}
function readFallback<T>(fallback: T): T { try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? '') as T } catch { return fallback } }
function openDb() { return new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) }) }
