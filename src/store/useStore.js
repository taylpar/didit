import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // User state
  user: null,
  loading: true,
  
  // Activities state
  activities: [],
  currentActivityIndex: 0,
  userPreferences: {},
  recentInteractions: [],
  
  // Initialize app
  initialize: async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      set({ user, loading: false })
      
      if (user) {
        await get().loadActivities()
        await get().loadUserPreferences()
      }
    } catch (error) {
      console.error('Init error:', error)
      set({ loading: false })
    }
  },
  
  // Auth functions
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error) {
      set({ user: data.user })
      // Initialize default preferences
      await get().initializeUserData()
    }
    return { data, error }
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      set({ user: data.user })
      await get().loadActivities()
      await get().loadUserPreferences()
    }
    return { data, error }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, activities: [], userPreferences: {}, recentInteractions: [] })
  },
  
  // Initialize user data
  initializeUserData: async () => {
    const user = get().user
    if (!user) return
    
    // Create user profile
    await supabase.from('profiles').upsert({
      id: user.id,
      onboarding_completed: false,
      preferences: {}
    })
  },
  
  // Load activities from database
  loadActivities: async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        set({ activities: data })
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  },
  
  // Load user preferences
  loadUserPreferences: async () => {
    const user = get().user
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
      
      if (data) {
        const prefs = {}
        data.forEach(p => {
          prefs[p.category] = p.preference_score
        })
        set({ userPreferences: prefs })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  },
  
  // Record activity interaction
  recordInteraction: async (activityId, interactionType, rating = null) => {
    const user = get().user
    if (!user) return
    
    try {
      const interaction = {
        user_id: user.id,
        activity_id: activityId,
        interaction_type: interactionType,
        rating,
        context: {
          hour: new Date().getHours(),
          day_of_week: new Date().getDay()
        }
      }
      
      await supabase.from('activity_interactions').insert(interaction)
      
      // Update local state
      set(state => ({
        recentInteractions: [activityId, ...state.recentInteractions].slice(0, 20)
      }))
      
      // If completed, update preferences
      if (interactionType === 'completed') {
        await get().updatePreferencesAfterCompletion(activityId)
      }
    } catch (error) {
      console.error('Error recording interaction:', error)
    }
  },
  
  // Update preferences after completion
  updatePreferencesAfterCompletion: async (activityId) => {
    const user = get().user
    const activities = get().activities
    const activity = activities.find(a => a.id === activityId)
    
    if (!user || !activity) return
    
    try {
      const category = activity.category
      const currentScore = get().userPreferences[category] || 0.5
      const newScore = Math.min(1, currentScore + 0.1) // Increase by 0.1, max 1.0
      
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        category,
        preference_score: newScore,
        completion_count: supabase.rpc('increment', { table: 'user_preferences' })
      })
      
      set(state => ({
        userPreferences: { ...state.userPreferences, [category]: newScore }
      }))
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  },
  
  // Get next activity (with basic recommendation logic)
  getNextActivity: () => {
    const activities = get().activities
    const currentIndex = get().currentActivityIndex
    const recentInteractions = get().recentInteractions
    const userPreferences = get().userPreferences
    
    // Filter out recently seen activities
    const unseenActivities = activities.filter(a => !recentInteractions.includes(a.id))
    
    if (unseenActivities.length === 0) {
      // Reset if we've seen everything
      set({ currentActivityIndex: 0, recentInteractions: [] })
      return activities[0]
    }
    
    // Simple scoring: prefer categories user likes
    const scored = unseenActivities.map(activity => {
      const categoryPref = userPreferences[activity.category] || 0.5
      const timeScore = getTimeScore(activity.category, new Date().getHours())
      const score = categoryPref * timeScore
      
      return { ...activity, score }
    })
    
    // Sort by score and return top one
    scored.sort((a, b) => b.score - a.score)
    return scored[0]
  },
  
  // Move to next card
  nextActivity: () => {
    set(state => ({
      currentActivityIndex: state.currentActivityIndex + 1
    }))
  }
}))

// Helper function: time-based scoring
function getTimeScore(category, hour) {
  const timePrefs = {
    exercise: [6, 7, 8, 17, 18, 19],
    food: [7, 8, 12, 13, 18, 19, 20],
    social: [11, 12, 17, 18, 19, 20, 21],
    creative: [9, 10, 14, 15, 16, 20, 21],
    recovery: [20, 21, 22],
    productivity: [9, 10, 11, 14, 15, 16]
  }
  
  const preferred = timePrefs[category] || []
  return preferred.includes(hour) ? 1.5 : 1.0
}
