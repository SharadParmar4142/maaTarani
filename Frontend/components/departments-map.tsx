const departments = [
  "CENTRAL PUBLIC WORKS DEPARTMENT",
  "NATIONAL HIGHWAY AUTHORITY OF INDIA",
  "INDIAN RAILWAYS",
  "RAIL VIKAS NIGAM LIMITED",
  "IRCON INTERNATIONAL LIMITED",
  "NATIONAL THERMAL POWER CORPORATION",
  "AIRPORTS AUTHORITY OF INDIA",
  "INDIAN OIL CORPORATION LIMITED",
  "NATIONAL MINERAL DEVELOPMENT CORPORATION",
  "NATIONAL HYDROELECTRIC POWER CORPORATION",
  "DELHI METRO RAIL CORPORATION",
  "CHENNAI METRO RAIL CORPORATION",
]

export function DepartmentsMap() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-[#c41e3a]">SERVICEABLE DEPARTMENTS</h2>
        
        <p className="text-center text-lg text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
          MTCS plays a crucial role in assisting companies and brands with government approvals by managing the complete liaisoning process required for enlistment in approved vendor lists. We handle all documentation, submissions, and compliance formalities, ensuring a smooth and efficient approval journey. By taking ownership of the tedious procedural workload, we enable businesses to focus on their core operations while we secure the necessary government clearances—making MTCS a trusted partner for streamlined vendor registration and regulatory coordination.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {departments.map((dept, index) => (
            <DepartmentBadge key={index} name={dept} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DepartmentBadge({ name }: { name: string }) {
  return (
    <div className="bg-[#c41e3a] text-white rounded-full px-6 py-4 text-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:bg-[#a01830] cursor-default h-[72px] flex items-center justify-center leading-tight">
      {name}
    </div>
  )
}
