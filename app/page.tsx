"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Droplets, Wifi, WifiOff, Zap, Power, PowerOff } from "lucide-react"
import { WaterTankVisualization } from "@/components/water-tank-visualization"
import { WaterLevelChart } from "@/components/water-level-chart"
import { MQTTConnection } from "@/components/mqtt-connection"

export default function Home() {
  const [waterLevel, setWaterLevel] = useState(0) // Empezar en 0 hasta recibir datos
  const [isConnected, setIsConnected] = useState(false)
  const [pumpStatus, setPumpStatus] = useState(false)
  const [sensorDistance, setSensorDistance] = useState(0)
  const [historicalData, setHistoricalData] = useState<Array<{ time: string; level: number }>>([])

  useEffect(() => {
    if (!isConnected) return

    // Solo para mantener el historial actualizado
    const interval = setInterval(() => {
      // Los datos reales vienen de handleMQTTMessage
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected])

  const handleMQTTMessage = (topic: string, message: string) => {
    console.log("📨 Mensaje MQTT recibido:", topic, message);
    
    // Tu ESP32 envía mensajes como "12", "13", etc. (solo números)
    const distance = Number.parseFloat(message);
    
    if (!isNaN(distance)) {
      console.log("✅ Distancia del sensor:", distance, "cm");
      setSensorDistance(distance);
      
      // Convertir distancia a porcentaje de nivel (tanque de 100cm)
      const tankHeight = 100;
      const waterLevelPercent = Math.max(0, Math.min(100, ((tankHeight - distance) / tankHeight) * 100));
      
      setWaterLevel(Math.round(waterLevelPercent));
      console.log("📊 Nivel de agua calculado:", waterLevelPercent, "%");
      
      // Agregar al historial en tiempo real
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setHistoricalData((prev) => {
        const newData = [...prev, { time: timeStr, level: waterLevelPercent }];
        return newData.slice(-20); // Mantener solo últimos 20 puntos
      });
    }
  }

  const togglePump = () => {
    setPumpStatus(!pumpStatus)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Monitor de Tanque de Agua</h1>
                <p className="text-sm text-muted-foreground">Sistema IoT en Tiempo Real</p>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"} className="gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Conectado
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* MQTT Connection Component */}
        <MQTTConnection onConnectionChange={setIsConnected} onMessage={handleMQTTMessage} />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Water Tank Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Nivel del Tanque</CardTitle>
              <CardDescription>Visualización en tiempo real del nivel de agua</CardDescription>
            </CardHeader>
            <CardContent>
              <WaterTankVisualization level={waterLevel} />
            </CardContent>
          </Card>

          {/* Status Cards */}
          <div className="space-y-6">
            {/* Water Level Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nivel de Agua</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary mb-2">{waterLevel}%</div>
                <p className="text-sm text-muted-foreground">
                  {waterLevel > 80 ? "Nivel alto" : waterLevel > 40 ? "Nivel normal" : "Nivel bajo"}
                </p>
              </CardContent>
            </Card>

            {/* Sensor Distance Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distancia al Agua</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{sensorDistance.toFixed(1)} cm</div>
                <p className="text-sm text-muted-foreground">Medición del sensor HC-SR04</p>
              </CardContent>
            </Card>

            {/* Pump Control Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Bomba "Sapito"
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge variant={pumpStatus ? "default" : "secondary"}>{pumpStatus ? "Encendida" : "Apagada"}</Badge>
                </div>
                <Button onClick={togglePump} className="w-full" variant={pumpStatus ? "destructive" : "default"}>
                  {pumpStatus ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Apagar Bomba
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Encender Bomba
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historical Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Nivel de Agua</CardTitle>
            <CardDescription>Últimas mediciones del sensor</CardDescription>
          </CardHeader>
          <CardContent>
            <WaterLevelChart data={historicalData} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}