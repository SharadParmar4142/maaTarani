import React from "react";
import { Header } from "../components/header";
import { HeroVideoSection } from "../components/hero-video-section";
import { AboutSection } from "../components/about-section";
import { IndustriesSection } from "../components/industries-section";
import { OfferingsSection } from "../components/offerings-section";
import { OurPresence } from "../components/our-presence";
import { BrandsSlider } from "../components/brands-slider";
import { ClientsSlider } from "../components/clients-slider";
import { DepartmentsMap } from "../components/departments-map";
import { ContactSection } from "../components/contact-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroVideoSection />
      <AboutSection />
      <IndustriesSection />
      <OfferingsSection />
      <OurPresence />
      <BrandsSlider />
      <ClientsSlider />
      <DepartmentsMap />
      <ContactSection />
    </main>
  );
}
