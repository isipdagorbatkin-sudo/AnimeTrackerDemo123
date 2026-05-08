'use client'

import { useEffect, useRef } from 'react'

export function SakuraAnimation() {
  const animationFrameRef = useRef<number>()
  const petalsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const createPetal = () => {
      const petal = document.createElement('div')
      petal.className = 'sakura-petal'

      // Random properties
      const size = Math.random() * 8 + 4
      const startX = Math.random() * window.innerWidth
      const duration = Math.random() * 8 + 6
      const rotation = Math.random() * 360

      petal.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${startX}px;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, rgba(255, 182, 197, 0.8) 0%, rgba(255, 105, 180, 0.6) 100%);
        border-radius: 50% 0 50% 50%;
        opacity: ${Math.random() * 0.4 + 0.2};
        pointer-events: none;
        z-index: 9999;
        transform: rotate(${rotation}deg);
        will-change: transform, top, left;
      `

      document.body.appendChild(petal)
      petalsRef.current.push(petal)

      // Animate petal
      const startTime = performance.now()
      const animate = (currentTime: number) => {
        const elapsed = (currentTime - startTime) / 1000
        const progress = elapsed / duration

        if (progress >= 1) {
          petal.remove()
          const index = petalsRef.current.indexOf(petal)
          if (index > -1) {
            petalsRef.current.splice(index, 1)
          }
          return
        }

        const y = progress * (window.innerHeight + 40)
        const x = startX + Math.sin(progress * Math.PI * 2) * 50
        const rot = rotation + progress * 720

        petal.style.transform = `translate(${x - startX}px, ${y}px) rotate(${rot}deg)`

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Create petals periodically (less frequent for performance)
    const interval = setInterval(() => {
      // Limit total petals for performance
      if (petalsRef.current.length < 20) {
        createPetal()
      }
    }, 800)

    // Add CSS
    const style = document.createElement('style')
    style.textContent = `
      .sakura-petal {
        box-shadow: 0 0 3px rgba(255, 182, 193, 0.2);
      }
    `
    document.head.appendChild(style)

    return () => {
      clearInterval(interval)
      style.remove()
      // Remove all petals
      petalsRef.current.forEach(petal => petal.remove())
      petalsRef.current = []
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return null
}
