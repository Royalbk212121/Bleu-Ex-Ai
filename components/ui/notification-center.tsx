"use client"

import { useAppSelector, useAppDispatch } from "@/lib/store"
import { markNotificationRead, clearNotifications } from "@/lib/store/slices/uiSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { useState } from "react"

export function NotificationCenter() {
  const dispatch = useAppDispatch()
  const { notifications } = useAppSelector((state) => state.ui)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const handleMarkRead = (id: string) => {
    dispatch(markNotificationRead(id))
  }

  const handleClearAll = () => {
    dispatch(clearNotifications())
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" className="fixed top-4 right-4 z-50" onClick={() => setIsOpen(true)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{unreadCount}</Badge>}
      </Button>
    )
  }

  return (
    <div className="fixed top-4 right-4 w-80 z-50">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
                onClick={() => handleMarkRead(notification.id)}
              >
                <div className="flex items-start space-x-2">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
