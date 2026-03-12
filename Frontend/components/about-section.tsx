"use client"

import { Target, Users, Shield, Award, Briefcase, TrendingUp } from "lucide-react"

export function AboutSection() {
  return (
    <section id="who-we-are" className="py-20 bg-white scroll-mt-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#c41e3a] uppercase tracking-widest 
text-xl md:text-2xl lg:text-3xl 
font-bold mb-3 inline-block px-3 py-1 bg-[#fff6f7] rounded-full">
  WHO WE ARE
</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">About MAA TARINI</h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Your trusted partner in delivering quality materials and services since 2015
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Our Mission */}
          <div className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all border border-gray-100 hover:border-[#c41e3a]/20">
            <div className="w-14 h-14 bg-gradient-to-br from-[#c41e3a] to-[#a01830] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              To be the most trusted partner in delivering quality materials and services to government sectors and
              private enterprises. We strive to maintain excellence in procurement, supply chain management, and
              customer satisfaction.
            </p>
          </div>

          {/* Our Commitment */}
          <div className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all border border-gray-100 hover:border-[#c41e3a]/20">
            <div className="w-14 h-14 bg-gradient-to-br from-[#c41e3a] to-[#a01830] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Our Commitment</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Committed to providing high-quality materials across various sectors including industrial products,
              construction materials, minerals, and aggregates. We ensure timely delivery and competitive pricing for
              all our clients.
            </p>
          </div>

          {/* Our Vision */}
          <div className="group bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all border border-gray-100 hover:border-[#c41e3a]/20">
            <div className="w-14 h-14 bg-gradient-to-br from-[#c41e3a] to-[#a01830] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              To expand our reach across India and become the leading supplier of quality industrial and construction materials. We aim to build lasting relationships through reliability, integrity, and exceptional service delivery.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gradient-to-br from-[#c41e3a] to-[#a01830] p-8 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">2015</div>
            <p className="text-white/90 text-sm md:text-base font-medium">Year Established</p>
          </div>
          <div className="group bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">30+</div>
            <p className="text-white/90 text-sm md:text-base font-medium">Trusted Brands</p>
          </div>
          <div className="group bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">8</div>
            <p className="text-white/90 text-sm md:text-base font-medium">States Covered</p>
          </div>
          <div className="group bg-gradient-to-br from-[#c41e3a] to-[#a01830] p-8 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">Best</div>
            <p className="text-white/90 text-sm md:text-base font-medium">Quality Assured</p>
          </div>
        </div>
      </div>
    </section>
  )
}
