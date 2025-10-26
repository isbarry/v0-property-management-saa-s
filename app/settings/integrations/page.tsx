import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, MessageCircle, Mail, Calendar, Key, ExternalLink, Home, DollarSign } from "lucide-react"

const integrations = [
  {
    name: "Stripe",
    description: "Accept credit card payments and manage subscriptions",
    icon: CreditCard,
    status: "connected",
    category: "Payment Gateway",
  },
  {
    name: "PayPal",
    description: "Alternative payment processing solution",
    icon: CreditCard,
    status: "not-connected",
    category: "Payment Gateway",
  },
  {
    name: "SendWave",
    description: "Mobile money transfers and payment processing",
    icon: DollarSign,
    status: "not-connected",
    category: "Payment Gateway",
  },
  {
    name: "WhatsApp Business",
    description: "Send automated messages and notifications to tenants",
    icon: MessageCircle,
    status: "connected",
    category: "Communication",
  },
  {
    name: "Twilio",
    description: "SMS notifications and two-factor authentication",
    icon: MessageCircle,
    status: "not-connected",
    category: "Communication",
  },
  {
    name: "SendGrid",
    description: "Email delivery and marketing campaigns",
    icon: Mail,
    status: "connected",
    category: "Email",
  },
  {
    name: "Google Calendar",
    description: "Sync bookings and maintenance schedules",
    icon: Calendar,
    status: "not-connected",
    category: "Calendar",
  },
  {
    name: "Airbnb",
    description: "Sync listings, bookings, and guest communications",
    icon: Home,
    status: "not-connected",
    category: "Booking Platform",
  },
  {
    name: "VRBO",
    description: "Manage vacation rental listings and reservations",
    icon: Home,
    status: "not-connected",
    category: "Booking Platform",
  },
  {
    name: "Booking.com",
    description: "Connect your properties to Booking.com marketplace",
    icon: Home,
    status: "not-connected",
    category: "Booking Platform",
  },
]

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect payment gateways, WhatsApp, and other services</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage your API keys for external integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Production API Key</p>
                <p className="text-sm text-muted-foreground">pk_live_••••••••••••••••</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Regenerate
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Test API Key</p>
                <p className="text-sm text-muted-foreground">pk_test_••••••••••••••••</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon
          return (
            <Card key={integration.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  {integration.status === "connected" ? (
                    <Badge className="bg-green-500">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Not Connected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>{integration.description}</CardDescription>
                <div className="flex gap-2">
                  {integration.status === "connected" ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
