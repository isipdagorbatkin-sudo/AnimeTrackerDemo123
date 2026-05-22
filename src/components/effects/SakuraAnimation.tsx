'use client'

import { useEffect, useRef } from 'react'

const ANIMATION_NAMES = {
  blow: ['blow-soft-left', 'blow-medium-left', 'blow-soft-right', 'blow-medium-right'],
  sway: ['sway-0', 'sway-1', 'sway-2', 'sway-3', 'sway-4', 'sway-5', 'sway-6', 'sway-7', 'sway-8'],
}

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function SakuraAnimation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const petalsRef = useRef<HTMLElement[]>([])
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .sakura-petal {
        position: fixed;
        pointer-events: none;
        z-index: 20;
        border-radius: 50% 0 50% 50%;
        box-shadow: 0 0 4px rgba(255, 182, 193, 0.08);
        will-change: transform, opacity;
      }

      @keyframes sakura-fall {
        0% { opacity: 0.42; top: -10%; }
        100% { opacity: 0; top: 110%; }
      }

      @keyframes sakura-sway-0 {
        0%, 100% { transform: rotate(-5deg); }
        40% { transform: rotate(28deg); }
      }

      @keyframes sakura-sway-1 {
        0%, 100% { transform: rotate(10deg); }
        40% { transform: rotate(43deg); }
      }

      @keyframes sakura-sway-2 {
        0%, 100% { transform: rotate(15deg); }
        40% { transform: rotate(56deg); }
      }

      @keyframes sakura-blow-soft-left {
        0% { margin-left: 0; }
        100% { margin-left: -50%; }
      }

      @keyframes sakura-blow-medium-left {
        0% { margin-left: 0; }
        100% { margin-left: -100%; }
      }

      @keyframes sakura-blow-soft-right {
        0% { margin-left: 0; }
        100% { margin-left: 50%; }
      }

      @keyframes sakura-blow-medium-right {
        0% { margin-left: 0; }
        100% { margin-left: 100%; }
      }
    `
    document.head.appendChild(style)
    styleRef.current = style

    const fallDuration = document.documentElement.clientHeight * 0.007 + 5

    function createPetal() {
      const petal = document.createElement('div')
      petal.className = 'sakura-petal'
      const height = randomInt(7, 12)
      const width = height - randomInt(1, 3)

      const colors = [
        'linear-gradient(120deg, rgba(230, 170, 181, 0.44), rgba(255, 205, 211, 0.36))',
        'linear-gradient(120deg, rgba(210, 139, 153, 0.34), rgba(242, 185, 196, 0.32))',
        'linear-gradient(120deg, rgba(198, 143, 154, 0.3), rgba(255, 182, 193, 0.34))',
      ]

      const startX = Math.random() * (document.documentElement.clientWidth - 100)
      const blowAnim = `sakura-${random(ANIMATION_NAMES.blow)}`
      const swayAnim = `sakura-${random(ANIMATION_NAMES.sway)}`
      const fallTime = fallDuration * (0.8 + Math.random() * 0.4)

      petal.style.cssText = `
        background: ${random(colors)};
        height: ${height}px;
        width: ${width}px;
        left: ${startX}px;
        top: -20px;
        opacity: ${0.18 + Math.random() * 0.22};
        animation:
          sakura-fall ${fallTime}s linear 0s 1,
          ${blowAnim} ${Math.max(fallTime - 20, 10)}s linear 0s infinite,
          ${swayAnim} ${randomInt(2, 4)}s linear 0s infinite;
      `

      document.body.appendChild(petal)
      petalsRef.current.push(petal)

      setTimeout(() => {
        petal.remove()
        const idx = petalsRef.current.indexOf(petal)
        if (idx > -1) petalsRef.current.splice(idx, 1)
      }, fallTime * 1000 + 500)
    }

    intervalRef.current = setInterval(() => {
      if (petalsRef.current.length < 9) {
        createPetal()
      }
    }, 850)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      petalsRef.current.forEach(p => p.remove())
      petalsRef.current = []
      if (styleRef.current) styleRef.current.remove()
    }
  }, [])

  return null
}
