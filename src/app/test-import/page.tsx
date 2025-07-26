'use client'

import { useState } from 'react'
import { isDemoMode, createShoppingList, createManyItems } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'
import type { UnitType } from '@/lib/supabase/types'

export default function TestImportPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTest = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult('Starting import test...')
      addResult(`isDemoMode = ${isDemoMode}`)
      
      if (isDemoMode) {
        addResult('❌ Running in demo mode - database not available')
        addResult('To fix: Set up Supabase environment variables')
        return
      }

      addResult('✅ Not in demo mode - testing database connection...')
      
      // Test user authentication
      const { user } = await getCurrentUser()
      if (!user) {
        addResult('❌ No authenticated user found')
        addResult('To fix: Sign in to your account')
        return
      }
      
      addResult(`✅ User authenticated: ${user.email}`)
      
      // Test list creation
      addResult('Testing list creation...')
      const { data: newList, error: listError } = await createShoppingList({
        name: 'Test Import List',
        description: 'Test list for debugging',
        is_shared: false,
        user_id: user.id
      })
      
      if (listError) {
        addResult(`❌ List creation failed: ${listError}`)
        return
      }
      
      addResult(`✅ List created successfully: ${newList.id}`)
      
      // Test item creation
      addResult('Testing item creation...')
      const testItems = [
        {
          list_id: newList.id,
          name: 'Test Item 1',
          amount: 1,
          unit: 'pcs' as UnitType,
          category: 'Test',
          notes: null,
          is_checked: false,
          position: 0
        },
        {
          list_id: newList.id,
          name: 'Test Item 2',
          amount: 2,
          unit: 'pcs' as UnitType,
          category: 'Test',
          notes: null,
          is_checked: true,
          position: 1
        }
      ]
      
      const { data: createdItems, error: itemsError } = await createManyItems(testItems)
      
      if (itemsError) {
        addResult(`❌ Item creation failed: ${itemsError}`)
        return
      }
      
      addResult(`✅ Items created successfully: ${createdItems?.length || 0} items`)
      addResult('🎉 All tests passed! Import should work correctly.')
      
    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Import Test Page</h1>
        
        <div className="mb-6">
          <button 
            onClick={runTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Running Test...' : 'Run Import Test'}
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          <div className="space-y-1 text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Click "Run Import Test" to start...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <h2 className="font-semibold mb-2">What This Test Does:</h2>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Checks if you're in demo mode</li>
            <li>Tests user authentication</li>
            <li>Tests list creation in database</li>
            <li>Tests item creation in database</li>
            <li>Shows exactly where any issues occur</li>
          </ul>
        </div>
      </div>
    </div>
  )
}