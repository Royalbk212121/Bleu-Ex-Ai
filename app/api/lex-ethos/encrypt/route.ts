import { type NextRequest, NextResponse } from "next/server"
import { lexEthos } from "@/lib/security/lex-ethos"

export async function POST(request: NextRequest) {
  try {
    const { data, config, userKey } = await request.json()

    if (!data || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await lexEthos.encryptData(data, config, userKey)

    return NextResponse.json({
      success: true,
      encryptedData: result.encryptedData,
      keyId: result.keyId,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error("Encryption API error:", error)
    return NextResponse.json({ error: "Encryption failed" }, { status: 500 })
  }
}
