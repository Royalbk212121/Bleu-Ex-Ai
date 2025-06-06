import { type NextRequest, NextResponse } from "next/server"
import { rbacSystem } from "@/lib/security/rbac-system"

export async function POST(request: NextRequest) {
  try {
    const { userId, resource, action, context } = await request.json()

    if (!userId || !resource || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await rbacSystem.checkAccess({
      userId,
      resource,
      action,
      context: context || {},
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("RBAC check access error:", error)
    return NextResponse.json({ error: "Access check failed" }, { status: 500 })
  }
}
