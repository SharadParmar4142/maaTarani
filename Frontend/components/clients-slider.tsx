"use client"

import { useEffect, useRef } from "react"

const clients = [
  "Shapoorji Pallonji Group",
  "Tata Metallics",
  "Royal Infra Construction",
  "Gautum Cement Works",
  "Allied Infra",
  "Kazstroy Service (KSS)",
  "Kalpataru Power Transmission",
  "Vinayak Ferrocon Industries",
  "Rameshwaram Industries",
  "Bhushan Steel",
  "Rameshwaram Projects",
  "Megotia Construction",
  "Gayatri Construction",
  "Dilip Buildcon",
  "Agarwal Infra",
  "JUSCO (A TATA Enterprise)",
  "Tracks and Towers Infratech Ltd.",
  "L&T Infrastructure",
  "NALCO, Damanjodi",
  "Kaizen",
  "N.C.C.",
  "RUNGTA MINES",
  "Tata Steels",
  "IOCL",
  "NTPC",
  "Fertilizer Corporation of India",
  "NBCC",
  "ITD Cementation",
  "JMC",
  "G R Infrastructure",
  "Iron Triangle",
  "KVR Construction",
  "D D Builders",
]

export function ClientsSlider() {
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
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#c41e3a]">OUR KEY CLIENTS</h2>
        
        <p className="text-center text-lg text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
          Since our inception, we have been committed to delivering exceptional service in the procurement of cement and admixtures, fostering long-term relationships with our valued clients. As every procurement division must evaluate multiple factors, we take the onus upon ourselves to secure the best possible rates for all their cement and admixture requirements, while ensuring timely supply through continuous coordination and follow-ups. We also manage quality-related concerns end to end, giving companies complete peace of mind—this is why our clients continue to trust and work with us. Here are a few of our prominent clients:
        </p>

        <div ref={scrollRef} className="flex gap-6 overflow-hidden whitespace-nowrap">
          {/* Duplicate clients for seamless loop */}
          {[...clients, ...clients].map((client, index) => (
            <div
              key={index}
              className="shrink-0 bg-background border border-border rounded-lg px-6 py-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-foreground font-medium">{client}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
