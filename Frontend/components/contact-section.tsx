"use client"

import { Phone, Mail, Globe, MapPin } from "lucide-react"
import { useState } from "react"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <footer className="bg-[#0a0a0a] text-white py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#c41e3a] uppercase tracking-wider text-sm font-semibold mb-3">CONTACT US</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in touch with our team</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have a question or want to learn more about our services? We&apos;re here to help. Fill out the form and we&apos;ll be in touch shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Side - Contact Info */}
          <div className="space-y-8">
            {/* Contact Cards */}
            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-[#c41e3a] transition-all group">
                <div className="w-12 h-12 bg-[#c41e3a]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#c41e3a] transition-all">
                  <Phone className="w-5 h-5 text-[#c41e3a] group-hover:text-white transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Call Us</h3>
                  <a href="tel:+919238312005" className="text-gray-400 hover:text-[#c41e3a] transition-colors">
                    +91 9238312005
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-[#c41e3a] transition-all group">
                <div className="w-12 h-12 bg-[#c41e3a]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#c41e3a] transition-all">
                  <Mail className="w-5 h-5 text-[#c41e3a] group-hover:text-white transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email Us</h3>
                  <a href="mailto:hello@maatarini.net" className="text-gray-400 hover:text-[#c41e3a] transition-colors break-all">
                    hello@maatarini.net
                  </a>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-[#c41e3a] transition-all group">
                <div className="w-12 h-12 bg-[#c41e3a]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#c41e3a] transition-all">
                  <Globe className="w-5 h-5 text-[#c41e3a] group-hover:text-white transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Visit Website</h3>
                  <a
                    href="https://www.maatarini.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#c41e3a] transition-colors"
                  >
                    www.maatarini.net
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-6 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-[#c41e3a] transition-all group">
                <div className="w-12 h-12 bg-[#c41e3a]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#c41e3a] transition-all">
                  <MapPin className="w-5 h-5 text-[#c41e3a] group-hover:text-white transition-all" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Our Location</h3>
                  <p className="text-gray-400">Bhubaneswar & Rourkela</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#c41e3a] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#c41e3a] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#c41e3a] transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#c41e3a] transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Send Message
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} MAA TARINI ENTERPRISES. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
