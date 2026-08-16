import { useEffect, useRef, useState } from 'react'

/**
 * Text Scroll-Reveal Component
 * Only reveals text word-by-word when the section scrolls into the viewport.
 */
export default function ScrollRevealText({
  text,
  className = '',
  delay = 0,
  as: Component = 'h2'
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
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (ref.current) observer.observe(ref.current)

    return () => {
      if (ref.current) observer.unobserve(ref.current)
    }
  }, [])

  const words = typeof text === 'string' ? text.split(' ') : []

  return (
    <Component ref={ref} className={`overflow-hidden inline-flex flex-wrap gap-x-2 ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          style={{
            transitionDuration: '700ms',
            transitionDelay: `${delay + idx * 60}ms`
          }}
          className={`inline-block transition-all ease-out transform ${
            isVisible
              ? 'opacity-100 translate-y-0 filter-none'
              : 'opacity-0 translate-y-10 blur-xs'
          }`}
        >
          {word}
        </span>
      ))}
    </Component>
  )
}
