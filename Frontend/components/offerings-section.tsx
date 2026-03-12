"use client"

import { Package, Mountain, Building2 } from "lucide-react"

export function OfferingsSection() {
  const offerings = [
    {
      icon: Building2,
      title: "Cement & Concrete Inputs",
      description:
        "High-grade cement products and concrete additives from top brands. Ensuring structural integrity and longevity for all your construction projects.",
      items: [
        "OPC / PPC / PSC Cement",
        "GGBS & GGBFS",
        "Fly Ash (Dry & Wet)",
        "Admixture",
        "Construction Chemicals",
      ],
    },
    {
      icon: Package,
      title: "Industrial Products",
      description:
        "Comprehensive range of industrial supplies including machinery, tools, equipment, and raw materials. We source from leading manufacturers to ensure quality and reliability for your operations.",
      items: [
        "Phosphogypsum (Chemical Gypsum)",
        "Slag from steel plants",
        "Clinker",
        "Industrial Machinery",
        "Safety Equipment",
      ],
    },
    {
      icon: Mountain,
      title: "Minerals & Aggregates",
      description:
        "Premium quality minerals and aggregates for construction and industrial applications. Sourced from verified mines with proper documentation and quality certifications.",
      items: [
        "M-Sand",
        "Dust, metal aggregates",
        "Limestone",
        "Dolomite",
        "Mining Materials",
      ],
    }
  ]

  return (
    <section id="what-we-offer" className="py-20 bg-gray-50 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#c41e3a] uppercase tracking-widest text-xl md:text-2xl lg:text-3xl font-bold mb-3 inline-block px-3 py-1 bg-[#fff6f7] rounded-full">WHAT WE OFFER</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Product Categories</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            MTCS is the preferred partner for material supply because we source directly from certified manufacturers,
            ensuring consistent quality at every stage. Our optimised procurement and logistics routes enable highly
            competitive pricing, delivering both efficiency and value to every customer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offerings.map((offering, index) => {
            const Icon = offering.icon
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all p-8 relative overflow-hidden border border-gray-100 hover:border-[#c41e3a]/20"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#c41e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon in bottom right - subtle background */}
                <div className="absolute -bottom-6 -right-6 opacity-5">
                  <Icon className="w-40 h-40 text-[#c41e3a]" />
                </div>

                <div className="relative z-10">
                  {/* Icon Box */}
                  <div className="w-16 h-16 bg-gradient-to-br from-[#c41e3a] to-[#a01830] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-[#c41e3a] transition-colors">
                    {offering.title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">{offering.description}</p>

                  {/* Items List */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    {offering.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-[#c41e3a] rounded-full" />
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
