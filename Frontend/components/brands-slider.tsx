"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

const brands = [
  { name: "Ambuja Cement", image: "/images/sliding/ambujaCement.jpg" },
  { name: "Asian Paints", image: "/images/sliding/asianpaints.jpg" },
  { name: "Jindal Cement", image: "/images/sliding/jindalCement.jpg" },
  { name: "Nuvoco", image: "/images/sliding/nuvoco.jpg" },
  { name: "Sagar", image: "/images/sliding/sagar.jpg" },
  { name: "Shree", image: "/images/sliding/shree.jpg" },
]

export function BrandsSlider() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId: number
    let scrollPosition = 0

    const scroll = () => {
      scrollPosition += 1
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <section className="py-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#c41e3a]">
          BRANDS WE DEAL IN
        </h2>

        <div ref={scrollRef} className="flex gap-8 overflow-hidden whitespace-nowrap">
          {/* Duplicate brands for seamless loop */}
          {[...brands, ...brands].map((brand, index) => (
            <div
              key={index}
              className="shrink-0 bg-white border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="relative w-40 h-40 flex items-center justify-center">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
