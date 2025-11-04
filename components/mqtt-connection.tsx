"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MQTTConnectionProps {
  onConnectionChange: (connected: boolean) => void
  onMessage: (topic: string, message: string) => void
}

export function MQTTConnection({ onConnectionChange, onMessage }: MQTTConnectionProps) {
  const [showSettings, setShowSettings] = useState(false)
  // ✅ CORREGIDO - MQTT nativo en puerto 1883
  const [brokerUrl, setBrokerUrl] = useState("mqtt://10.56.13.16:1883")
  const [topic, setTopic] = useState("tanque/distancia")
  const [isConnecting, setIsConnecting] = useState(false)
  const [useSimulation, setUseSimulation] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [])

  const startSimulation = () => {
    setIsConnecting(true)
    setUseSimulation(true)

    // Simular conexión exitosa
    setTimeout(() => {
      onConnectionChange(true)
      setIsConnecting(false)
      setShowSettings(false)

      // Generar datos simulados cada 2 segundos
      let distance = 15
      let direction = 1

      simulationIntervalRef.current = setInterval(() => {
        // Variar la distancia entre 5 y 45 cm
        distance += direction * (Math.random() * 3 + 1)

        if (distance >= 45) {
          distance = 45
          direction = -1
        } else if (distance <= 5) {
          distance = 5
          direction = 1
        }

        const roundedDistance = Math.round(distance * 10) / 10
        onMessage(topic, roundedDistance.toString())
      }, 2000)
    }, 500)
  }

  const handleConnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }

    setIsConnecting(true)
    setUseSimulation(false)

    try {
      const params = new URLSearchParams({
        broker: brokerUrl,
        topic: topic,
      })
      const eventSource = new EventSource(`/api/mqtt?${params}`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "connected") {
            onConnectionChange(true)
            setIsConnecting(false)
            setShowSettings(false)
          } else if (data.type === "message") {
            onMessage(data.topic, data.message)
          } else if (data.type === "error") {
            console.error("[v0] MQTT Error:", data.message)
            onConnectionChange(false)
            setIsConnecting(false)
          } else if (data.type === "disconnected") {
            onConnectionChange(false)
          }
        } catch (error) {
          console.error("[v0] Error parsing event data:", error)
        }
      }

      eventSource.onerror = () => {
        onConnectionChange(false)
        setIsConnecting(false)
        eventSource.close()
      }

      eventSourceRef.current = eventSource
    } catch (error) {
      setIsConnecting(false)
      onConnectionChange(false)
    }
  }

  const handleDisconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    onConnectionChange(false)
    setUseSimulation(false)
  }

  if (!showSettings) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="mb-6">
        <Settings className="w-4 h-4 mr-2" />
        Configurar Conexión
      </Button>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Configuración de Conexión</CardTitle>
        <CardDescription>Conecta al broker MQTT o usa datos simulados para probar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Nota:</strong> Para conectar al broker MQTT local, necesitarás desplegar esta aplicación en tu red
            local. En el preview, usa el modo de simulación para probar la interfaz.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="broker">Broker URL</Label>
          <Input
            id="broker"
            placeholder="mqtt://10.56.13.16:1883"
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" placeholder="tanque/distancia" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button onClick={startSimulation} disabled={isConnecting} variant="default">
            <Play className="w-4 h-4 mr-2" />
            {isConnecting ? "Iniciando..." : "Modo Simulación"}
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting} variant="outline">
            {isConnecting ? "Conectando..." : "Conectar MQTT"}
          </Button>
          <Button variant="ghost" onClick={() => setShowSettings(false)}>
            Cancelar
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Formato esperado del mensaje:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• JSON: {`{"distance": 25}`}</li>
            <li>• O solo el número: 25</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}