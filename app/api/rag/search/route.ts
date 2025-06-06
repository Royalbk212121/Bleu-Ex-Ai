import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({
    error: "Database integration required",
    message: "Please add a database integration to enable RAG search",
    results: [],
  })
}
