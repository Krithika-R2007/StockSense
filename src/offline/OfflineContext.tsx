import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { openDB } from 'idb'
import { syncPush } from '../api/endpoints'
import { useToast } from '../components/toast/ToastContext'

type PendingOp = { id: string; label: string; payload: unknown }

type OfflineContextValue = {
  online: boolean
  syncing: boolean
  pending: PendingOp[]
  queueOperation: (label: string, payload: unknown) => void
  syncNow: () => Promise<void>
  readOnly: boolean
  cachedSession: boolean
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

async function getDb() {
  return openDB('smart-inventory', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache')
      }
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' })
      }
    },
  })
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [pending, setPending] = useState<PendingOp[]>([])
  const [syncing, setSyncing] = useState(false)
  const [cachedSession, setCachedSession] = useState(false)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => {
      setOnline(false)
      setCachedSession(true)
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    if (!navigator.onLine) setCachedSession(true)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (online && pending.length > 0 && !syncing) {
      void syncNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  const queueOperation = useCallback(
    async (label: string, payload: unknown) => {
      const op: PendingOp = {
        id: crypto.randomUUID(),
        label,
        payload,
      }
      setPending((p) => [...p, op])
      try {
        const db = await getDb()
        await db.put('queue', op)
      } catch {
        /* idb optional */
      }
      if (!online) {
        toast(`${label} queued for sync`, 'warning')
      }
    },
    [online, toast],
  )

  const syncNow = useCallback(async () => {
    if (pending.length === 0) return
    setSyncing(true)
    toast(`Syncing ${pending.length} pending operations…`, 'info')
    try {
      const result = await syncPush(pending)
      setPending([])
      const db = await getDb().catch(() => null)
      if (db) await db.clear('queue')
      if (result.conflicts > 0) {
        toast(
          `✓ ${result.synced} synced. ⚠ ${result.conflicts} conflict requires review.`,
          'warning',
        )
      } else {
        toast(`✓ ${result.synced} synced successfully.`, 'success')
      }
    } finally {
      setSyncing(false)
    }
  }, [pending, toast])

  const value = useMemo(
    () => ({
      online,
      syncing,
      pending,
      queueOperation,
      syncNow,
      readOnly: !online,
      cachedSession,
    }),
    [online, syncing, pending, queueOperation, syncNow, cachedSession],
  )

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  )
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline requires OfflineProvider')
  return ctx
}
