'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'

export default function TestDBPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      const testResults: any = {}

      try {
        // Test 1: Check if supabase client exists
        testResults.supabaseClient = supabase ? 'OK' : 'MISSING'

        // Test 2: Test authentication
        try {
          const { user, error } = await getCurrentUser()
          testResults.auth = user ? `OK (${user.id})` : `ERROR (${error})`
        } catch (error) {
          testResults.auth = `ERROR: ${error}`
        }

        // Test 3: Simple table query (no auth)
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('shopping_lists')
              .select('count', { count: 'exact', head: true })
            
            testResults.tableAccess = error ? `ERROR: ${error.message}` : `OK (${data} rows)`
          } catch (error) {
            testResults.tableAccess = `ERROR: ${error}`
          }

          // Test 4: Simple select query
          try {
            const { data, error } = await supabase
              .from('shopping_lists')
              .select('id, name')
              .limit(1)
            
            testResults.selectQuery = error ? `ERROR: ${error.message}` : `OK (${data?.length} rows)`
          } catch (error) {
            testResults.selectQuery = `ERROR: ${error}`
          }
        }

        setResults(testResults)
      } catch (error) {
        testResults.general = `ERROR: ${error}`
        setResults(testResults)
      } finally {
        setLoading(false)
      }
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Running database tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Connectivity Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="space-y-4">
            {Object.entries(results).map(([test, result]) => (
              <div key={test} className="flex justify-between items-center p-3 border rounded">
                <span className="font-medium">{test}:</span>
                <span className={`
                  px-3 py-1 rounded text-sm
                  ${String(result).startsWith('OK') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                `}>
                  {String(result)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• If all tests show "OK", the issue might be in the dashboard code</li>
              <li>• If table access shows errors, run the SQL fix script in Supabase</li>
              <li>• If auth shows errors, check your Supabase environment variables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 