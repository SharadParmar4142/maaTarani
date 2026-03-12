import { Header } from "@/components/header"
import { HeroVideoSection } from "@/components/hero-video-section"
import { AboutSection } from "@/components/about-section"
import { IndustriesSection } from "@/components/industries-section"
import { BrandsSlider } from "@/components/brands-slider"
import { DepartmentsMap } from "@/components/departments-map"
import { ClientsSlider } from "@/components/clients-slider"
import { OurPresence } from "@/components/our-presence"
import { OfferingsSection } from "@/components/offerings-section"
import { ContactSection } from "@/components/contact-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroVideoSection />
      <BrandsSlider />
      <AboutSection />
      <IndustriesSection />
      <ClientsSlider />
      <DepartmentsMap />
      <OurPresence />
      <OfferingsSection />
      <ContactSection />
    </main>
  )
}
