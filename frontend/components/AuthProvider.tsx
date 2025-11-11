'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)
  
  useEffect(() => {
    // Initialize auth when app starts
    initialize()
  }, [initialize])
  
  return <>{children}</>
}