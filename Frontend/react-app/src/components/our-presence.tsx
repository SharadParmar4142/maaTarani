export function OurPresence() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#c41e3a]">
          OUR PRESENCE
        </h2>

        <div className="flex justify-center items-center">
          <div className="flex flex-col items-center">
            <img
              src="/images/image1.png"
              alt="Map of India highlighting operational states: Odisha, Bihar, Jharkhand, Uttar Pradesh, Madhya Pradesh, Chhattisgarh, Maharashtra and West Bengal"
              className="w-full max-w-md h-auto object-contain"
            />
            <p className="text-sm text-muted-foreground mt-6 text-center max-w-md">
              Our operations span across{" "}
              <span className="font-semibold text-[#c41e3a]">
                Odisha, Bihar, Jharkhand, Uttar Pradesh, Madhya Pradesh, Chhattisgarh, Maharashtra and West Bengal
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
