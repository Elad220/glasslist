'use client'

import { useEffect, useState } from 'react'
import { useSyncStatus, useOnlineStatus, usePendingChanges } from '@/lib/offline/hooks'

export default function TestSyncPage() {
  const isOnline = useOnlineStatus()
  const { syncing, lastSync, errors, forceSync } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  const [testData, setTestData] = useState<any>({})

  useEffect(() => {
    setTestData({
      isOnline,
      syncing,
      lastSync,
      errors,
      pendingCount
    })
  }, [isOnline, syncing, lastSync, errors, pendingCount])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Sync Status Test</h1>
        
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-2">Current Status</h2>
            <pre className="text-sm bg-black/20 p-2 rounded">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-2">Sync Actions</h2>
            <button
              onClick={() => forceSync()}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-2">Sync Icon Test</h2>
            <div className="flex items-center gap-2">
              <span>Sync Status:</span>
              <div className="flex items-center gap-1 p-1 bg-white/10 rounded border border-white/20">
                {!isOnline ? (
                  <span className="text-red-400">Offline</span>
                ) : syncing ? (
                  <span className="text-blue-400">Syncing...</span>
                ) : pendingCount > 0 ? (
                  <span className="text-orange-400">{pendingCount} Pending</span>
                ) : (
                  <span className="text-green-400">Synced</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 