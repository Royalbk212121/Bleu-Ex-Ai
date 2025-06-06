"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, Share, Download, Save } from "lucide-react"

export function EditorToolbar() {
  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Untitled Document</h1>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Draft
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-black hover:bg-gray-800" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
