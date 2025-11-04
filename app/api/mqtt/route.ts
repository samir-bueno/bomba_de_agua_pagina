import mqtt from "mqtt"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // URL CORRECTA - MQTT nativo en puerto 1883
  const brokerUrl = searchParams.get("broker") || "mqtt://10.56.13.16:1883"
  const topic = searchParams.get("topic") || "tanque/distancia"

  console.log("[MQTT Server] 🔗 Conectando a:", brokerUrl)
  console.log("[MQTT Server] 📡 Topic:", topic)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      try {
        const client = mqtt.connect(brokerUrl, {
          reconnectPeriod: 5000,
          connectTimeout: 10000,
          clientId: 'web_client_' + Math.random().toString(16).substr(2, 8),
          keepalive: 60,
          clean: true
        })

        client.on("connect", () => {
          console.log("[MQTT Server] ✅ Conectado exitosamente")
          const data = encoder.encode(`data: ${JSON.stringify({ type: "connected", broker: brokerUrl })}\n\n`)
          controller.enqueue(data)

          client.subscribe(topic, (err) => {
            if (err) {
              console.error("[MQTT Server] ❌ Error suscribiendo:", err)
              const errorData = encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: "Error al suscribirse: " + err.message })}\n\n`,
              )
              controller.enqueue(errorData)
            } else {
              console.log("[MQTT Server] ✅ Suscrito a topic:", topic)
            }
          })
        })

        client.on("message", (receivedTopic, message) => {
          const messageStr = message.toString()
          console.log("[MQTT Server] 📨 Mensaje:", receivedTopic, messageStr)
          const data = encoder.encode(
            `data: ${JSON.stringify({ type: "message", topic: receivedTopic, message: messageStr })}\n\n`,
          )
          controller.enqueue(data)
        })

        client.on("error", (error) => {
          console.error("[MQTT Server] ❌ Error MQTT:", error)
          const data = encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`,
          )
          controller.enqueue(data)
        })

        client.on("close", () => {
          console.log("[MQTT Server] 🔌 Conexión cerrada")
          const data = encoder.encode(`data: ${JSON.stringify({ type: "disconnected" })}\n\n`)
          controller.enqueue(data)
        })

        return () => {
          console.log("[MQTT Server] 🧹 Limpiando conexión")
          client.end()
        }
      } catch (error) {
        console.error("[MQTT Server] 💥 Error creando cliente:", error)
        const data = encoder.encode(
          `data: ${JSON.stringify({ type: "error", message: "Error fatal: " + (error instanceof Error ? error.message : 'Unknown') })}\n\n`,
        )
        controller.enqueue(data)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  })
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}