"use client"

import { useState, useCallback } from "react"

export type NavigationState = {
  type: "home" | "playlist" | "search" | "mood"
  id?: string
  data?: any
}

export function useNavigationHistory(initialState: NavigationState) {
  const [history, setHistory] = useState<NavigationState[]>([initialState])
  const [currentIndex, setCurrentIndex] = useState(0)

  const navigate = useCallback(
    (state: NavigationState) => {
      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(state)
      setHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
      return state
    },
    [history, currentIndex],
  )

  const back = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      return history[currentIndex - 1]
    }
    return history[currentIndex]
  }, [history, currentIndex])

  const forward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
      return history[currentIndex + 1]
    }
    return history[currentIndex]
  }, [history, currentIndex])

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < history.length - 1

  const current = history[currentIndex]

  return {
    current,
    navigate,
    back,
    forward,
    canGoBack,
    canGoForward,
  }
}

