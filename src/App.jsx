import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { AuthScreen } from './pages/AuthScreen'
import { SwipeScreen } from './pages/SwipeScreen'

export function App() {
  const { user, loading, initialize } = useStore()
  
  useEffect(() => {
    initialize()
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-xl font-medium">Loading Activity App...</div>
        </div>
      </div>
    )
  }
  
  return user ? <SwipeScreen /> : <AuthScreen />
}
