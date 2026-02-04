import { useState, useEffect } from 'react'
import { ActivityCard } from '../components/ActivityCard'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'

export function SwipeScreen() {
  const { 
    user, 
    activities, 
    getNextActivity, 
    recordInteraction, 
    nextActivity,
    signOut 
  } = useStore()
  
  const [currentActivity, setCurrentActivity] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [lastSwipedActivity, setLastSwipedActivity] = useState(null)
  
  useEffect(() => {
    if (activities.length > 0) {
      setCurrentActivity(getNextActivity())
    }
  }, [activities])
  
  async function handleSwipe(direction) {
    if (!currentActivity) return
    
    const activityId = currentActivity.id
    
    // Record interaction
    if (direction === 'right') {
      setLastSwipedActivity(currentActivity)
      setShowRatingModal(true)
      await recordInteraction(activityId, 'swiped_right')
    } else if (direction === 'left') {
      await recordInteraction(activityId, 'swiped_left')
    } else if (direction === 'up') {
      await recordInteraction(activityId, 'saved')
    }
    
    // Move to next activity
    nextActivity()
    setTimeout(() => {
      setCurrentActivity(getNextActivity())
    }, 300)
  }
  
  async function handleCompleted(rating) {
    if (lastSwipedActivity) {
      await recordInteraction(lastSwipedActivity.id, 'completed', rating)
    }
    setShowRatingModal(false)
    setLastSwipedActivity(null)
  }
  
  async function handleSkipped() {
    if (lastSwipedActivity) {
      await recordInteraction(lastSwipedActivity.id, 'skipped')
    }
    setShowRatingModal(false)
    setLastSwipedActivity(null)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Activity App</h1>
        <button
          onClick={signOut}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sign Out
        </button>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Stats Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
              <div className="text-gray-500">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(useStore.getState().userPreferences).length}
              </div>
              <div className="text-gray-500">Interests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {useStore.getState().recentInteractions.length}
              </div>
              <div className="text-gray-500">This Week</div>
            </div>
          </div>
        </div>
        
        {/* Card Stack */}
        <div className="flex-1 relative">
          <AnimatePresence>
            {currentActivity && (
              <ActivityCard
                key={currentActivity.id}
                activity={currentActivity}
                onSwipe={handleSwipe}
              />
            )}
          </AnimatePresence>
          
          {!currentActivity && activities.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Loading activities...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2 font-medium">How to use:</p>
            <div className="flex justify-center gap-6">
              <div>👈 Swipe left to skip</div>
              <div>👉 Swipe right to do it</div>
              <div>👆 Swipe up to save</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowRatingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-center">
                Did you complete this activity?
              </h3>
              
              <div className="mb-6">
                <p className="text-center text-gray-600 mb-4">
                  {lastSwipedActivity?.title}
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleCompleted(5)}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition"
                >
                  ✓ Yes, I did it!
                </button>
                
                <button
                  onClick={handleSkipped}
                  className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
                >
                  Not yet
                </button>
              </div>
              
              <button
                onClick={() => setShowRatingModal(false)}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
