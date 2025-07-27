'use client'

import { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'

interface TestAIComponentProps {
  userId: string
  apiKey: string
  analytics: any
  shoppingLists: any[]
}

export default function TestAIComponent({ 
  userId, 
  apiKey, 
  analytics, 
  shoppingLists 
}: TestAIComponentProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [demoData, setDemoData] = useState<string[]>([])

  useEffect(() => {
    console.log('TestAIComponent mounted with:', { userId, apiKey: !!apiKey, analytics: !!analytics, shoppingLists: shoppingLists?.length })
    
    // Simulate loading
    setTimeout(() => {
      setIsLoaded(true)
      setDemoData([
        'Test Insight 1: Your shopping patterns show consistency',
        'Test Insight 2: You frequently buy dairy products',
        'Test Insight 3: Your completion rate is excellent'
      ])
    }, 1000)
  }, [userId, analytics, shoppingLists])

  return (
    <div className="glass-card p-6 border-2 border-green-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-glass-heading">🧪 TEST AI Component</h3>
            <p className="text-sm text-glass-muted">This is a test component to verify rendering</p>
            <div className="text-xs text-green-500 mt-1">
              ✅ Component Loaded: {isLoaded ? 'YES' : 'NO'}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              📊 Props: userId={userId}, apiKey={apiKey ? 'YES' : 'NO'}, analytics={analytics ? 'YES' : 'NO'}, lists={shoppingLists?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {isLoaded ? (
        <div className="space-y-4">
          {demoData.map((insight, index) => (
            <div key={index} className="glass p-4 rounded-lg border border-green-200/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-glass-muted leading-relaxed">
                    {insight}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-6 rounded-lg text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-glass-muted">Loading test component...</p>
        </div>
      )}
    </div>
  )
}