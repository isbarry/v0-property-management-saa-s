"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Mail, Phone, MessageCircle, Download, FileText } from "lucide-react"
import type { Tenant, Reservation, Property } from "@/lib/types/database"

interface TenantsTabProps {
  tenants: Tenant[]
  reservations: Reservation[]
  properties: Property[]
}

export function TenantsTab({ tenants, reservations, properties }: TenantsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(tenants[0] || null)

  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = searchQuery.toLowerCase()
    const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase()
    return fullName.includes(searchLower) || tenant.email.toLowerCase().includes(searchLower)
  })

  const getTenantReservations = (tenantId: number) => {
    return reservations.filter((r) => r.tenant_id === tenantId)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Tenant List */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-sans text-lg font-semibold text-foreground">All Tenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filteredTenants.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                {searchQuery ? "No tenants found" : "No tenants yet"}
              </div>
            ) : (
              filteredTenants.map((tenant) => {
                const tenantReservations = getTenantReservations(tenant.id)
                const isSelected = selectedTenant?.id === tenant.id

                return (
                  <button
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {tenant.first_name} {tenant.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{tenant.email}</p>
                      </div>
                      {tenantReservations.length > 0 && (
                        <Badge variant="secondary" className="shrink-0 text-xs font-medium">
                          {tenantReservations.length} booking{tenantReservations.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Details */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-sans text-lg font-semibold text-foreground">Tenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTenant ? (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-sans text-sm font-semibold text-foreground">Contact Information</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="rounded-full bg-muted p-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">{selectedTenant.email}</p>
                    </div>
                  </div>

                  {selectedTenant.phone && (
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                      <div className="rounded-full bg-muted p-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">{selectedTenant.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedTenant.phone && (
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 sm:col-span-2">
                      <div className="rounded-full bg-muted p-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">WhatsApp</p>
                        <p className="text-sm font-medium text-foreground">{selectedTenant.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation History */}
              <div className="space-y-3">
                <h3 className="font-sans text-sm font-semibold text-foreground">Reservation History</h3>
                <div className="space-y-3">
                  {getTenantReservations(selectedTenant.id).length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
                      No reservations yet
                    </div>
                  ) : (
                    getTenantReservations(selectedTenant.id).map((reservation) => {
                      const property = properties.find((p) => p.id === reservation.property_id)
                      return (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{property?.name || "Unknown Property"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(reservation.check_in).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              -{" "}
                              {new Date(reservation.check_out).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-foreground">
                              GMD {Number(reservation.total_amount).toLocaleString()}
                            </p>
                            <Badge
                              variant={reservation.status === "confirmed" ? "default" : "secondary"}
                              className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 border-yellow-500/20"
                            >
                              {reservation.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="font-sans text-sm font-semibold text-foreground">Documents</h3>
                <div className="space-y-2">
                  {getTenantReservations(selectedTenant.id).length === 0 ? (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
                      No documents available
                    </div>
                  ) : (
                    getTenantReservations(selectedTenant.id).map((reservation, index) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Invoice #{index + 1}</p>
                            <p className="text-xs text-muted-foreground">
                              Issued:{" "}
                              {new Date(reservation.created_at).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Select a tenant to view details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
