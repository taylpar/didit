import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { useState } from 'react'

export function ActivityCard({ activity, onSwipe, style }) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  const controls = useAnimation()
  
  function handleDragEnd(event, info) {
    const offset = info.offset.x
    const velocity = info.velocity.x
    
    // Swipe right (Do it)
    if (offset > 100 || velocity > 500) {
      setExitX(1000)
      controls.start({ x: 1000, opacity: 0, transition: { duration: 0.2 } })
      setTimeout(() => onSwipe('right'), 200)
    }
    // Swipe left (Skip)
    else if (offset < -100 || velocity < -500) {
      setExitX(-1000)
      controls.start({ x: -1000, opacity: 0, transition: { duration: 0.2 } })
      setTimeout(() => onSwipe('left'), 200)
    }
    // Swipe up (Save for later)
    else if (info.offset.y < -100) {
      controls.start({ y: -1000, opacity: 0, transition: { duration: 0.2 } })
      setTimeout(() => onSwipe('up'), 200)
    }
    // Return to center
    else {
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } })
    }
  }
  
  if (!activity) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No more activities!</p>
          <p className="text-sm">Come back later for new suggestions</p>
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, opacity, ...style }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={controls}
    >
      <div className="bg-white rounded-3xl shadow-2xl h-full overflow-hidden flex flex-col">
        {/* Activity Image */}
        {activity.image_url && (
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
            <img 
              src={activity.image_url} 
              alt={activity.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!activity.image_url && (
          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-6xl">
              {getCategoryEmoji(activity.category)}
            </span>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {activity.category}
            </span>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {activity.title}
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-4 flex-1">
            {activity.description}
          </p>
          
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{activity.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>Energy: {activity.energy_level}/5</span>
            </div>
            {activity.location_type && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span className="capitalize">{activity.location_type}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Swipe Hints */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="absolute left-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xl rotate-12 shadow-lg"
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
          >
            DO IT! ✓
          </motion.div>
          <motion.div
            className="absolute right-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xl -rotate-12 shadow-lg"
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
          >
            SKIP ✗
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

function getCategoryEmoji(category) {
  const emojis = {
    exercise: '🏃',
    food: '🍽️',
    social: '👥',
    creative: '🎨',
    recovery: '🧘',
    productivity: '💼',
    learning: '📚',
    outdoor: '🌳'
  }
  return emojis[category] || '✨'
}
