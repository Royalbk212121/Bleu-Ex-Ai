/**
 * LLM Service - Standardized interface for multiple LLMs
 * Handles API key management, request formatting, and response parsing
 */
import { generateText, streamText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"

export type LLMProvider = "openai" | "anthropic" | "google" | "sagemaker"
export type LLMModel = "gpt-4o" | "gpt-4-turbo" | "claude-3-opus" | "claude-3-sonnet" | "gemini-1.5-pro" | "llama-3-70b"

interface LLMRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  model?: LLMModel
  temperature?: number
  maxTokens?: number
  stream?: boolean
  schema?: any // For structured output
}

interface LLMResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: LLMProvider
  latency: number
}

interface LLMConfig {
  provider: LLMProvider
  model: LLMModel
  apiKey?: string
  endpoint?: string
  priority: number
  costPerToken: number
  maxTokensPerMinute: number
  enabled: boolean
}

/**
 * LLM Service for managing multiple language models
 */
export class LLMService {
  private configs: Map<string, LLMConfig> = new Map()
  private usageTracking: Map<string, { tokens: number; requests: number; lastReset: Date }> = new Map()
  private fallbackOrder: LLMModel[] = ["gpt-4o", "claude-3-sonnet", "gemini-1.5-pro"]

  constructor() {
    this.initializeConfigs()
  }

  /**
   * Initialize LLM configurations
   */
  private initializeConfigs() {
    const configs: LLMConfig[] = [
      {
        provider: "openai",
        model: "gpt-4o",
        priority: 1,
        costPerToken: 0.00003,
        maxTokensPerMinute: 150000,
        enabled: true,
      },
      {
        provider: "openai",
        model: "gpt-4-turbo",
        priority: 2,
        costPerToken: 0.00001,
        maxTokensPerMinute: 150000,
        enabled: true,
      },
      {
        provider: "anthropic",
        model: "claude-3-opus",
        priority: 3,
        costPerToken: 0.000075,
        maxTokensPerMinute: 100000,
        enabled: true,
      },
      {
        provider: "anthropic",
        model: "claude-3-sonnet",
        priority: 4,
        costPerToken: 0.000015,
        maxTokensPerMinute: 100000,
        enabled: true,
      },
      {
        provider: "google",
        model: "gemini-1.5-pro",
        priority: 5,
        costPerToken: 0.0000035,
        maxTokensPerMinute: 120000,
        enabled: true,
      },
    ]

    configs.forEach((config) => {
      this.configs.set(config.model, config)
      this.usageTracking.set(config.model, {
        tokens: 0,
        requests: 0,
        lastReset: new Date(),
      })
    })
  }

  /**
   * Generate text using the best available model
   */
  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    const model = request.model || this.selectBestModel(request)
    const config = this.configs.get(model)

    if (!config || !config.enabled) {
      throw new Error(`Model ${model} is not available`)
    }

    try {
      let result: any

      switch (config.provider) {
        case "openai":
          result = await generateText({
            model: openai(model),
            messages: request.messages,
            temperature: request.temperature || 0.1,
            maxTokens: request.maxTokens || 2000,
          })
          break

        case "anthropic":
          result = await generateText({
            model: anthropic(model),
            messages: request.messages,
            temperature: request.temperature || 0.1,
            maxTokens: request.maxTokens || 2000,
          })
          break

        case "google":
          result = await generateText({
            model: google(model),
            messages: request.messages,
            temperature: request.temperature || 0.1,
            maxTokens: request.maxTokens || 2000,
          })
          break

        default:
          throw new Error(`Provider ${config.provider} not implemented`)
      }

      const latency = Date.now() - startTime

      // Track usage
      this.trackUsage(model, result.usage?.totalTokens || 0)

      return {
        text: result.text,
        usage: result.usage,
        model,
        provider: config.provider,
        latency,
      }
    } catch (error) {
      console.error(`Error with ${model}:`, error)

      // Try fallback models
      const fallbackModels = this.fallbackOrder.filter((m) => m !== model)
      for (const fallbackModel of fallbackModels) {
        try {
          return await this.generateText({ ...request, model: fallbackModel })
        } catch (fallbackError) {
          console.error(`Fallback ${fallbackModel} also failed:`, fallbackError)
        }
      }

      throw new Error(`All LLM providers failed for request`)
    }
  }

  /**
   * Generate structured object using schema
   */
  async generateObject<T>(request: LLMRequest & { schema: any }): Promise<T> {
    const model = request.model || this.selectBestModel(request)
    const config = this.configs.get(model)

    if (!config || !config.enabled) {
      throw new Error(`Model ${model} is not available`)
    }

    try {
      let result: any

      switch (config.provider) {
        case "openai":
          result = await generateObject({
            model: openai(model),
            messages: request.messages,
            schema: request.schema,
            temperature: request.temperature || 0.1,
          })
          break

        default:
          // Fallback to text generation and JSON parsing
          const textResult = await this.generateText(request)
          try {
            return JSON.parse(textResult.text)
          } catch {
            throw new Error("Failed to parse structured response")
          }
      }

      this.trackUsage(model, result.usage?.totalTokens || 0)
      return result.object
    } catch (error) {
      console.error(`Structured generation error with ${model}:`, error)
      throw error
    }
  }

  /**
   * Stream text generation
   */
  async streamText(request: LLMRequest): Promise<AsyncIterable<string>> {
    const model = request.model || this.selectBestModel(request)
    const config = this.configs.get(model)

    if (!config || !config.enabled) {
      throw new Error(`Model ${model} is not available`)
    }

    let result: any

    switch (config.provider) {
      case "openai":
        result = streamText({
          model: openai(model),
          messages: request.messages,
          temperature: request.temperature || 0.1,
          maxTokens: request.maxTokens || 2000,
        })
        break

      case "anthropic":
        result = streamText({
          model: anthropic(model),
          messages: request.messages,
          temperature: request.temperature || 0.1,
          maxTokens: request.maxTokens || 2000,
        })
        break

      case "google":
        result = streamText({
          model: google(model),
          messages: request.messages,
          temperature: request.temperature || 0.1,
          maxTokens: request.maxTokens || 2000,
        })
        break

      default:
        throw new Error(`Streaming not supported for ${config.provider}`)
    }

    return result.textStream
  }

  /**
   * Select the best available model based on load and cost
   */
  private selectBestModel(request: LLMRequest): LLMModel {
    const availableModels = Array.from(this.configs.entries())
      .filter(([_, config]) => config.enabled && this.isWithinRateLimit(config.model))
      .sort(([_, a], [__, b]) => a.priority - b.priority)

    if (availableModels.length === 0) {
      throw new Error("No available models")
    }

    // For complex requests, prefer more capable models
    const messageLength = request.messages.reduce((sum, msg) => sum + msg.content.length, 0)
    if (messageLength > 10000) {
      const capableModels = availableModels.filter(([model]) =>
        ["gpt-4o", "claude-3-opus", "gemini-1.5-pro"].includes(model),
      )
      if (capableModels.length > 0) {
        return capableModels[0][0] as LLMModel
      }
    }

    return availableModels[0][0] as LLMModel
  }

  /**
   * Check if model is within rate limits
   */
  private isWithinRateLimit(model: LLMModel): boolean {
    const config = this.configs.get(model)
    const usage = this.usageTracking.get(model)

    if (!config || !usage) return false

    // Reset usage if it's been more than a minute
    const now = new Date()
    if (now.getTime() - usage.lastReset.getTime() > 60000) {
      usage.tokens = 0
      usage.requests = 0
      usage.lastReset = now
    }

    return usage.tokens < config.maxTokensPerMinute
  }

  /**
   * Track model usage
   */
  private trackUsage(model: LLMModel, tokens: number) {
    const usage = this.usageTracking.get(model)
    if (usage) {
      usage.tokens += tokens
      usage.requests += 1
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const stats: Record<string, any> = {}

    this.usageTracking.forEach((usage, model) => {
      const config = this.configs.get(model)
      stats[model] = {
        tokens: usage.tokens,
        requests: usage.requests,
        cost: usage.tokens * (config?.costPerToken || 0),
        enabled: config?.enabled || false,
        provider: config?.provider,
      }
    })

    return stats
  }

  /**
   * Health check for all models
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [model, config] of this.configs.entries()) {
      if (!config.enabled) {
        health[model] = false
        continue
      }

      try {
        await this.generateText({
          messages: [{ role: "user", content: "Hello" }],
          model: model as LLMModel,
          maxTokens: 10,
        })
        health[model] = true
      } catch {
        health[model] = false
      }
    }

    return health
  }
}

export const llmService = new LLMService()
