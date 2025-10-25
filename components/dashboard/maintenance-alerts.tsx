"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { MaintenanceRequest, Property } from "@/lib/types/database"

interface MaintenanceAlertsProps {
  requests: MaintenanceRequest[]
  properties: Property[]
}

export function MaintenanceAlerts({ requests, properties }: MaintenanceAlertsProps) {
  const now = new Date()

  const alertRequests = requests
    .filter((req) => req.status === "open" || req.status === "in_progress")
    .map((req) => {
      const property = properties.find((p) => p.id === req.property_id)
      const isOverdue = req.scheduled_date && new Date(req.scheduled_date) < now
      const isUrgent = req.priority === "urgent" || req.priority === "high"

      return {
        id: req.id,
        propertyName: property?.name || "Unknown Property",
        issue: req.title,
        priority: req.priority,
        status: req.status,
        dateReported: req.created_at,
        scheduledDate: req.scheduled_date,
        isOverdue,
        isUrgent,
      }
    })
    .sort((a, b) => {
      // Sort by: overdue first, then urgent, then by date
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.isUrgent && !b.isUrgent) return -1
      if (!a.isUrgent && b.isUrgent) return 1
      return new Date(a.dateReported).getTime() - new Date(b.dateReported).getTime()
    })

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans text-lg font-semibold text-foreground">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Maintenance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending maintenance requests</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {alertRequests.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 ${
                  alert.isOverdue
                    ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                    : alert.isUrgent
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-900/20"
                      : "border-border bg-background/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{alert.propertyName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported: {new Date(alert.dateReported).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {alert.isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                    <Badge
                      variant={alert.priority === "urgent" ? "destructive" : "outline"}
                      className={`text-xs ${
                        alert.priority === "high"
                          ? "border-amber-600 text-amber-600"
                          : alert.priority === "medium"
                            ? "border-yellow-600 text-yellow-600"
                            : ""
                      }`}
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
