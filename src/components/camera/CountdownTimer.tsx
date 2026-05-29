import { useState, useEffect, useCallback } from 'react'

interface CountdownTimerProps {
  seconds?: number
  onComplete: () => void
  onStart?: () => void
}

export default function CountdownTimer({
  seconds = 3,
  onComplete,
  onStart,
}: CountdownTimerProps) {
  const [count, setCount] = useState<number | null>(null)
  const [active, setActive] = useState(false)

  const start = useCallback(() => {
    setActive(true)
    setCount(seconds)
    onStart?.()
  }, [seconds, onStart])

  useEffect(() => {
    if (!active || count === null) return

    if (count === 0) {
      setActive(false)
      setCount(null)
      onComplete()
      return
    }

    const timer = setTimeout(() => setCount(c => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [count, active, onComplete])

  return (
    <div className="countdown-wrapper">
      {count !== null && (
        <div className="countdown-number" key={count}>
          {count === 0 ? '📸' : count}
        </div>
      )}
      <button
        className="btn-countdown-start"
        onClick={start}
        disabled={active}
      >
        {active ? 'get ready...' : 'start timer'}
      </button>
    </div>
  )
}