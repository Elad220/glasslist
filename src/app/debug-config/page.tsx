'use client'

import { useEffect, useState } from 'react'
import { isDemoMode } from '@/lib/supabase/client'

export default function DebugConfigPage() {
  const [config, setConfig] = useState<any>({})

  useEffect(() => {
    setConfig({
      isDemoMode,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE
    })
  }, [])

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Configuration</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {config.supabaseUrl}</div>
              <div><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {config.supabaseKey}</div>
              <div><strong>NEXT_PUBLIC_DEMO_MODE:</strong> {config.demoMode}</div>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h2 className="font-semibold mb-2">Runtime Status</h2>
            <div className="space-y-2 text-sm">
              <div><strong>isDemoMode:</strong> {config.isDemoMode ? 'true' : 'false'}</div>
              <div><strong>Database Available:</strong> {config.isDemoMode ? 'No (Demo Mode)' : 'Yes'}</div>
            </div>
          </div>

          <div className="p-4 border rounded bg-yellow-50">
            <h2 className="font-semibold mb-2 text-yellow-800">Issue Analysis</h2>
            <div className="text-sm text-yellow-700">
              {config.isDemoMode ? (
                <div>
                  <p><strong>Problem:</strong> You're running in demo mode!</p>
                  <p><strong>Solution:</strong> Set up your Supabase environment variables:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Create a <code>.env.local</code> file</li>
                    <li>Add your Supabase URL and key</li>
                    <li>Set <code>NEXT_PUBLIC_DEMO_MODE=false</code></li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p><strong>Status:</strong> Not in demo mode - database should be available</p>
                  <p>If import still doesn't work, check your Supabase configuration and RLS policies.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded bg-blue-50">
            <h2 className="font-semibold mb-2 text-blue-800">Next Steps</h2>
            <div className="text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Check if you're in demo mode above</li>
                <li>If in demo mode, set up your Supabase environment</li>
                <li>If not in demo mode, check browser console for errors</li>
                <li>Verify your Supabase database has the correct tables and policies</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}