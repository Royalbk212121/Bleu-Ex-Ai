/**
 * API Gateway Service
 * Single entry point for all frontend requests with routing and rate limiting
 */

import { createProxyMiddleware } from "http-proxy-middleware"
import rateLimit from "express-rate-limit"

interface ServiceRoute {
  path: string
  target: string
  changeOrigin?: boolean
  pathRewrite?: Record<string, string>
}

export class APIGateway {
  private services: Map<string, ServiceRoute> = new Map()
  private rateLimiters: Map<string, any> = new Map()

  constructor() {
    this.initializeServices()
    this.setupRateLimiting()
  }

  private initializeServices() {
    // Define microservice routes
    const serviceRoutes: ServiceRoute[] = [
      {
        path: "/api/auth",
        target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
        changeOrigin: true,
      },
      {
        path: "/api/users",
        target: process.env.USER_SERVICE_URL || "http://localhost:3002",
        changeOrigin: true,
      },
      {
        path: "/api/documents",
        target: process.env.DOCUMENT_SERVICE_URL || "http://localhost:3003",
        changeOrigin: true,
      },
      {
        path: "/api/ai",
        target: process.env.AI_SERVICE_URL || "http://localhost:3004",
        changeOrigin: true,
      },
      {
        path: "/api/realtime",
        target: process.env.REALTIME_SERVICE_URL || "http://localhost:3005",
        changeOrigin: true,
      },
    ]

    serviceRoutes.forEach((route) => {
      this.services.set(route.path, route)
    })
  }

  private setupRateLimiting() {
    // Different rate limits for different service types
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: "Too many authentication attempts",
    })

    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: "Too many API requests",
    })

    const aiLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 AI requests per minute
      message: "Too many AI requests",
    })

    this.rateLimiters.set("/api/auth", authLimiter)
    this.rateLimiters.set("/api/ai", aiLimiter)
    this.rateLimiters.set("default", apiLimiter)
  }

  createProxy(path: string) {
    const service = this.services.get(path)
    if (!service) {
      throw new Error(`Service not found for path: ${path}`)
    }

    return createProxyMiddleware({
      target: service.target,
      changeOrigin: service.changeOrigin || true,
      pathRewrite: service.pathRewrite,
      onError: (err, req, res) => {
        console.error(`Proxy error for ${path}:`, err)
        if (res && !res.headersSent) {
          res.status(503).json({
            error: "Service temporarily unavailable",
            service: path,
          })
        }
      },
    })
  }

  getRateLimiter(path: string) {
    return this.rateLimiters.get(path) || this.rateLimiters.get("default")
  }
}

export const apiGateway = new APIGateway()
