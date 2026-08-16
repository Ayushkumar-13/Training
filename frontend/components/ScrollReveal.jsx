import { useEffect, useRef, useState } from 'react'

/**
 * Strict Section ScrollReveal Component
 * Only triggers reveal when the user actually scrolls down into the section's viewport area.
 */
export default function ScrollReveal({
  children,
  animation = 'fade-up', // 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in'
  delay = 0,
  duration = 800,
  threshold = 0.1,
  rootMargin = '0px 0px -80px 0px', // Ensures section is 80px inside viewport before animating
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (ref.current) observer.observe(ref.current)

    return () => {
      if (ref.current) observer.unobserve(ref.current)
    }
  }, [threshold, rootMargin])

  const getInitialHiddenStyle = () => {
    switch (animation) {
      case 'fade-up':
        return 'opacity-0 translate-y-16 scale-98'
      case 'fade-down':
        return 'opacity-0 -translate-y-16 scale-98'
      case 'fade-left':
        return 'opacity-0 translate-x-16'
      case 'fade-right':
        return 'opacity-0 -translate-x-16'
      case 'zoom-in':
        return 'opacity-0 scale-90 translate-y-6'
      default:
        return 'opacity-0 translate-y-16'
    }
  }

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`
      }}
      className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) transform ${
        isVisible
          ? 'opacity-100 translate-x-0 translate-y-0 scale-100 pointer-events-auto'
          : `${getInitialHiddenStyle()} pointer-events-none`
      } ${className}`}
    >
      {children}
    </div>
  )
}
