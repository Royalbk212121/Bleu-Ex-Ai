import { NextResponse } from "next/server"
import { executeRawQuery } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // Read and execute the schema creation script
    const schemaScript = fs.readFileSync(path.join(process.cwd(), "scripts", "001-create-database-schema.sql"), "utf8")

    await executeRawQuery(schemaScript)

    // Read and execute the seed data script
    const seedScript = fs.readFileSync(path.join(process.cwd(), "scripts", "002-seed-initial-data.sql"), "utf8")

    await executeRawQuery(seedScript)

    return NextResponse.json({
      success: true,
      message: "Database schema created and seeded successfully",
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ error: "Failed to set up database", details: error.message }, { status: 500 })
  }
}
