"use client"

import { useEffect, useState } from "react"

interface WaterTankVisualizationProps {
  level: number // 0-100 percentage
}

export function WaterTankVisualization({ level }: WaterTankVisualizationProps) {
  const [animatedLevel, setAnimatedLevel] = useState(level)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedLevel(level)
    }, 100)
    return () => clearTimeout(timeout)
  }, [level])

  const getWaterColor = () => {
    if (level > 80) return "from-blue-400 to-blue-600"
    if (level > 40) return "from-cyan-400 to-blue-500"
    return "from-orange-400 to-red-500"
  }

  const getLevelText = () => {
    if (level > 80) return "Nivel Alto"
    if (level > 40) return "Nivel Normal"
    return "Nivel Bajo - Llenar Tanque"
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Tank Container */}
      <div className="relative w-full max-w-md">
        {/* Tank Body */}
        <div className="relative w-full aspect-[3/4] border-4 border-foreground/20 rounded-b-3xl bg-muted/30 overflow-hidden">
          {/* Water Level */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaterColor()} transition-all duration-1000 ease-out`}
            style={{ height: `${animatedLevel}%` }}
          >
            {/* Water Animation */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>

            {/* Water Waves */}
            <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden">
              <div className="absolute inset-0 animate-wave bg-gradient-to-b from-white/30 to-transparent" />
            </div>
          </div>

          {/* Level Markers */}
          <div className="absolute inset-0 pointer-events-none">
            {[25, 50, 75].map((marker) => (
              <div
                key={marker}
                className="absolute left-0 right-0 border-t border-dashed border-foreground/20"
                style={{ bottom: `${marker}%` }}
              >
                <span className="absolute -left-12 -top-3 text-xs text-muted-foreground font-medium">{marker}%</span>
              </div>
            ))}
          </div>

          {/* Percentage Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-border shadow-lg">
              <div className="text-5xl font-bold text-primary">{level}%</div>
            </div>
          </div>
        </div>

        {/* Tank Base */}
        <div className="w-full h-4 bg-foreground/20 rounded-b-lg" />
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-xl font-semibold text-foreground">{getLevelText()}</p>
        <p className="text-sm text-muted-foreground mt-1">Capacidad restante: {level}% del tanque</p>
      </div>
    </div>
  )
}
