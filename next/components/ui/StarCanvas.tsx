'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  color: string
}

interface ShootingStar {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
}

export const CustomStarCanvas = ({
  starCount = 400,
  colors = ['#ffffff', '#ffe9c4', '#d4fbff'], // Different shades
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Array<Star>>([])
  const shootingStarsRef = useRef<Array<ShootingStar>>([])
  const animationFrameRef = useRef<number>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    // Initialize Static Stars
    const initStars = () => {
      starsRef.current = Array.from({ length: starCount }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5, // Variable size
        opacity: Math.random(),
        speed: Math.random() * 0.05 + 0.01, // Twinkle speed
        // Added nullish coalescing (??) to satisfy strict TypeScript definitions
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff',
      }))
    }

    // Spawn a shooting star randomly
    const spawnShootingStar = () => {
      if (Math.random() > 0.98) {
        // 2% chance per frame
        shootingStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: 0, // Start at top
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
          opacity: 1,
        })
      }
    }

    const render = () => {
      // Clear canvas with a very slight trailing effect for smooth movement
      ctx.fillStyle = 'rgba(10, 10, 10, 1)' // Background color
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 1. Draw & Update Normal Stars (Twinkling + General slow drift)
      starsRef.current.forEach((star) => {
        // Twinkling logic
        star.opacity += star.speed
        if (star.opacity > 1 || star.opacity < 0.1) {
          star.speed = -star.speed // reverse fade
        }

        // General movement (drift up and left)
        star.x -= 0.1
        star.y -= 0.1

        // Wrap around screen
        if (star.x < 0) star.x = canvas.width
        if (star.y < 0) star.y = canvas.height

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${hexToRgb(star.color)}, ${star.opacity})`
        ctx.fill()
      })

      // 2. Draw & Update Shooting Stars
      spawnShootingStar()

      shootingStarsRef.current.forEach((sStar, index) => {
        sStar.x -= sStar.speed // Move left
        sStar.y += sStar.speed // Move down
        sStar.opacity -= 0.02 // Fade out over time

        const gradient = ctx.createLinearGradient(
          sStar.x,
          sStar.y,
          sStar.x + sStar.length,
          sStar.y - sStar.length
        )
        gradient.addColorStop(0, `rgba(255, 255, 255, ${sStar.opacity})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.beginPath()
        ctx.moveTo(sStar.x, sStar.y)
        ctx.lineTo(sStar.x + sStar.length, sStar.y - sStar.length)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Remove dead shooting stars
        if (sStar.opacity <= 0) {
          shootingStarsRef.current.splice(index, 1)
        }
      })

      animationFrameRef.current = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current)
    }
  }, [starCount, colors])

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none z-[-1]'
    />
  )
}

// Utility to convert hex to RGB for opacity control
const hexToRgb = (hex: string) => {
  const bigint = parseInt(hex.replace('#', ''), 16)
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`
}
