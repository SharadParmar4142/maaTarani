export function IndiaMap() {
  return (
    <svg viewBox="0 0 500 550" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* India outline - simplified */}
      <path
        d="M150 50 L250 30 L350 50 L400 100 L420 150 L430 200 L420 250 L430 300 L450 350 L420 400 L380 450 L320 500 L280 520 L250 500 L200 480 L150 450 L120 400 L100 350 L80 300 L90 250 L80 200 L100 150 L120 100 Z"
        fill="#e8e8e8"
        stroke="#ccc"
        strokeWidth="2"
      />

      {/* Uttar Pradesh - highlighted */}
      <path
        d="M180 180 L220 160 L280 170 L300 200 L280 240 L230 250 L190 230 L170 200 Z"
        fill="#c41e3a"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.9"
      />
      <text x="225" y="210" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
        UP
      </text>

      {/* Bihar - highlighted */}
      <path
        d="M300 200 L340 190 L370 210 L360 250 L320 260 L280 240 Z"
        fill="#c41e3a"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.9"
      />
      <text x="325" y="230" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
        Bihar
      </text>

      {/* Jharkhand - highlighted */}
      <path
        d="M320 260 L360 250 L380 280 L370 320 L330 330 L290 300 L300 270 Z"
        fill="#c41e3a"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.9"
      />
      <text x="335" y="295" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
        Jharkhand
      </text>

      {/* West Bengal - highlighted */}
      <path
        d="M370 210 L400 200 L410 240 L400 300 L380 350 L350 380 L340 340 L370 320 L380 280 L370 250 Z"
        fill="#c41e3a"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.9"
      />
      <text x="385" y="290" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
        WB
      </text>

      {/* Odisha - highlighted */}
      <path
        d="M290 300 L330 330 L340 380 L320 420 L270 400 L250 350 L270 310 Z"
        fill="#c41e3a"
        stroke="#fff"
        strokeWidth="2"
        opacity="0.9"
      />
      <text x="300" y="370" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
        Odisha
      </text>

      {/* Legend */}
      <rect x="30" y="480" width="20" height="20" fill="#c41e3a" rx="3" />
      <text x="60" y="495" fill="#333" fontSize="12">
        Operational States
      </text>
    </svg>
  )
}
