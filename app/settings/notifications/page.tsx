import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, Mail, MessageSquare, AlertCircle } from "lucide-react"

const notificationSettings = [
  {
    category: "Email Notifications",
    icon: Mail,
    items: [
      { id: "email-new-booking", label: "New booking received", enabled: true },
      { id: "email-payment", label: "Payment received", enabled: true },
      { id: "email-maintenance", label: "Maintenance request submitted", enabled: true },
      { id: "email-lease-expiry", label: "Lease expiring soon", enabled: true },
      { id: "email-weekly-report", label: "Weekly summary report", enabled: false },
    ],
  },
  {
    category: "Push Notifications",
    icon: Bell,
    items: [
      { id: "push-new-booking", label: "New booking received", enabled: true },
      { id: "push-urgent-maintenance", label: "Urgent maintenance request", enabled: true },
      { id: "push-payment-failed", label: "Payment failed", enabled: true },
      { id: "push-check-in", label: "Guest check-in reminder", enabled: false },
    ],
  },
  {
    category: "SMS Notifications",
    icon: MessageSquare,
    items: [
      { id: "sms-urgent-maintenance", label: "Urgent maintenance alerts", enabled: false },
      { id: "sms-payment-reminder", label: "Payment reminders", enabled: false },
      { id: "sms-booking-confirmation", label: "Booking confirmations", enabled: false },
    ],
  },
  {
    category: "System Alerts",
    icon: AlertCircle,
    items: [
      { id: "alert-system-updates", label: "System updates and maintenance", enabled: true },
      { id: "alert-security", label: "Security alerts", enabled: true },
      { id: "alert-integration-errors", label: "Integration errors", enabled: true },
    ],
  },
]

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure email, push, and SMS notification preferences</p>
      </div>

      <div className="space-y-4">
        {notificationSettings.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.category}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{category.category}</CardTitle>
                </div>
                <CardDescription>Manage {category.category.toLowerCase()} settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <Label htmlFor={item.id} className="cursor-pointer">
                      {item.label}
                    </Label>
                    <Switch id={item.id} defaultChecked={item.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Preferences</Button>
      </div>
    </div>
  )
}
