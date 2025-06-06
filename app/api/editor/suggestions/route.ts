import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { text, action } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    let prompt = ""
    let systemPrompt = ""

    switch (action) {
      case "improve":
        systemPrompt = "You are a legal writing expert. Improve the following legal text while maintaining its meaning."
        prompt = `Improve this legal text: ${text}`
        break
      case "citation":
        systemPrompt = "You are a legal citation expert. Add proper legal citations to the following text."
        prompt = `Add citations to this legal text: ${text}`
        break
      case "grammar":
        systemPrompt = "You are a grammar expert. Fix any grammar or style issues in the following legal text."
        prompt = `Fix grammar and style in this legal text: ${text}`
        break
      default:
        systemPrompt = "You are a legal writing assistant. Provide suggestions for the following legal text."
        prompt = `Provide suggestions for this legal text: ${text}`
    }

    const { text: suggestion } = await generateText({
      model: google("gemini-1.5-pro"),
      system: systemPrompt,
      prompt,
    })

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error("Editor suggestions API error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
