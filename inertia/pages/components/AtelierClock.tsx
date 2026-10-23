import { useEffect, useState } from 'react'
import '../../css/atelier-clock.css'

export default function AtelierClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: number
    function tick() {
      window.clearTimeout(timer)
      setNow(new Date())
      if (!document.hidden) timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  const seconds = now.getSeconds()
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60
  const digital = [now.getHours(), now.getMinutes(), seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
  return (
    <aside className="atelier-clock" aria-label="Your local time">
      <div className="atelier-clock-face">
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <circle cx="50" cy="50" r="47" className="atelier-clock-rim" />
          {Array.from({ length: 60 }, (_, index) => (
            <line
              key={index}
              x1="50"
              y1={index % 5 ? 8 : 7}
              x2="50"
              y2={index % 5 ? 9 : 12}
              transform={`rotate(${index * 6} 50 50)`}
              className={index % 5 ? 'clock-minute-mark' : 'clock-hour-mark'}
            />
          ))}
          <line
            x1="50"
            y1="53"
            x2="50"
            y2="28"
            transform={`rotate(${hours * 30} 50 50)`}
            className="clock-hour-hand"
          />
          <line
            x1="50"
            y1="55"
            x2="50"
            y2="17"
            transform={`rotate(${minutes * 6} 50 50)`}
            className="clock-minute-hand"
          />
          <line
            x1="50"
            y1="58"
            x2="50"
            y2="14"
            transform={`rotate(${seconds * 6} 50 50)`}
            className="clock-second-hand"
          />
          <circle cx="50" cy="50" r="2.2" className="clock-pin" />
        </svg>
        <time dateTime={now.toISOString()} aria-label={`${digital}, local time`}>
          {digital}
        </time>
      </div>
      <span className="atelier-clock-caption">LOCAL TIME</span>
    </aside>
  )
}
