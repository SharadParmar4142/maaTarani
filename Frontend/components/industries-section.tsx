"use client"

import Image from "next/image"

export function IndustriesSection() {
  const industries = [
    {
      title: "Commercial RMC",
      description: "Commercial RMC plants rely on consistent, high-performance materials to maintain uniform mix designs and meet diverse client specifications. MTCS supplies OPC cement, GGBS, and high-quality admixtures directly to leading RMC units. With optimized logistics, plant-level coordination, and dependable delivery schedules, we provide uninterrupted material flow that keeps commercial batching operations running smoothly and efficiently.",
      image: "/images/industriesServerBlock/CommercialRMC.png",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      title: "Mining Industry",
      description: "Mining operations require reliable, high-strength materials for critical applications such as roofing support, backfilling, shotcreting, and underground stabilization. MTCS supplies OPC cement tailored to these demanding mining environments across all operational needs. With dependable delivery schedules, on-ground coordination, and robust logistics planning, we provide uninterrupted cement supply that keeps mining activities running safely and efficiently.",
      image: "/images/industriesServerBlock/MiningIndustry.png",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      title: "Precast Manufactures",
      description: "Precast manufacturers across India rely on high-strength, consistent raw materials to achieve precision, durability, and faster project timelines. We supply OPC cement directly to leading precast units, ensuring uninterrupted production and uniform concrete performance. Through reliable logistics and plant-level coordination, MTCS delivers timely OPC shipments that keep precast operations running efficiently.",
      image: "/images/industriesServerBlock/Precast Manufactures.png",
      gradient: "from-gray-700 to-gray-900"
    },
    {
      title: "Infrastructure Projects",
      description: "Infrastructure projects such as tunnels, roads, bridges, and flagship buildings demand consistent material quality and reliable supply to maintain structural integrity and meet strict execution timelines. With coordinated logistics and on-ground support, we enable uninterrupted cement delivery that keeps large-scale infrastructure projects moving efficiently and without delay.",
      image: "/images/industriesServerBlock/infraProject.png",
      gradient: "from-gray-700 to-gray-900"
    }
  ]

  return (
    <section id="our-expertise" className="py-20 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#c41e3a] uppercase tracking-widest text-xl md:text-2xl lg:text-3xl font-bold mb-3 inline-block px-3 py-1 bg-[#fff6f7] rounded-full">OUR EXPERTISE</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Backed by a strong nationwide presence, we provide every critical construction input needed for continuous operations. These four core customer verticals rely on us for consistent quality and dependable supply.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 max-w-5xl mx-auto">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="group h-80 md:h-72 [perspective:1000px]"
            >
              <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Front Side */}
                <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 [backface-visibility:hidden] shadow-lg hover:shadow-2xl transition-shadow">
                  <div className="flex flex-col items-center justify-center h-full p-8 relative overflow-hidden">
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#c41e3a]/10 to-transparent rounded-bl-full" />
                    
                    {/* Image */}
                    <div className="relative w-24 h-24 mb-6 transform group-hover:scale-110 transition-transform duration-300 z-10">
                      <Image
                        src={industry.image}
                        alt={industry.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 text-center relative z-10 mb-3">
                      {industry.title}
                    </h3>
                    
                    {/* Hover indicator */}
                    <div className="text-sm text-[#c41e3a] font-medium flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      Learn more 
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Back Side */}
                <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 [backface-visibility:hidden] [transform:rotateY(180deg)] p-6 overflow-y-auto shadow-2xl border border-gray-700">
                  <div className="h-full flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">
                      {industry.title}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed flex-1">
                      {industry.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
