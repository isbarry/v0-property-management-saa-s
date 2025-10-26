"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, FileText, Download, Eye } from "lucide-react"

// Mock data for active leases
const activeLeases = [
  {
    id: 1,
    tenant: "John Smith",
    property: "Sunset Apartments - Unit 101",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    monthlyRent: 1500,
    status: "active",
    daysRemaining: 245,
  },
  {
    id: 2,
    tenant: "Sarah Johnson",
    property: "Ocean View Condos - Unit 205",
    startDate: "2024-03-15",
    endDate: "2025-03-14",
    monthlyRent: 2200,
    status: "active",
    daysRemaining: 319,
  },
  {
    id: 3,
    tenant: "Michael Brown",
    property: "Downtown Lofts - Unit 302",
    startDate: "2023-11-01",
    endDate: "2024-10-31",
    monthlyRent: 1800,
    status: "expiring-soon",
    daysRemaining: 45,
  },
  {
    id: 4,
    tenant: "Emily Davis",
    property: "Garden Estates - Unit 12",
    startDate: "2024-02-01",
    endDate: "2025-01-31",
    monthlyRent: 1650,
    status: "active",
    daysRemaining: 289,
  },
]

export default function LeasesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLeases = activeLeases.filter(
    (lease) =>
      lease.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Leases</h1>
          <p className="text-muted-foreground">Manage and track all active lease agreements</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Lease
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Leases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases.length}</div>
            <p className="text-xs text-muted-foreground">Across all properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases.filter((l) => l.status === "expiring-soon").length}</div>
            <p className="text-xs text-muted-foreground">Within 60 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeLeases.reduce((sum, l) => sum + l.monthlyRent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From active leases</p>
          </CardContent>
        </Card>
      </div>

      {/* Leases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lease Library</CardTitle>
              <CardDescription>View and manage all active lease agreements</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell className="font-medium">{lease.tenant}</TableCell>
                  <TableCell>{lease.property}</TableCell>
                  <TableCell>{new Date(lease.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(lease.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>${lease.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={lease.status === "active" ? "default" : "secondary"}
                      className={lease.status === "expiring-soon" ? "bg-amber-500 text-white hover:bg-amber-600" : ""}
                    >
                      {lease.status === "active" ? "Active" : "Expiring Soon"}
                    </Badge>
                  </TableCell>
                  <TableCell>{lease.daysRemaining} days</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
