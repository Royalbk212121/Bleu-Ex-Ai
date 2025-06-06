import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "API Gateway is running",
    services: ["auth-service", "user-service", "document-service", "ai-orchestration-service", "realtime-service"],
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { service, endpoint, data } = await request.json()

    // Route request to appropriate microservice
    const serviceUrl = getServiceUrl(service)
    if (!serviceUrl) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Gateway routing error:", error)
    return NextResponse.json({ error: "Gateway routing failed" }, { status: 500 })
  }
}

function getServiceUrl(service: string): string | null {
  const serviceMap: Record<string, string> = {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    user: process.env.USER_SERVICE_URL || "http://localhost:3002",
    document: process.env.DOCUMENT_SERVICE_URL || "http://localhost:3003",
    ai: process.env.AI_SERVICE_URL || "http://localhost:3004",
    realtime: process.env.REALTIME_SERVICE_URL || "http://localhost:3005",
  }

  return serviceMap[service] || null
}
