"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye, Archive } from "lucide-react"

// Mock data for expired leases
const expiredLeases = [
  {
    id: 1,
    tenant: "Robert Wilson",
    property: "Sunset Apartments - Unit 203",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    monthlyRent: 1400,
    daysExpired: 125,
  },
  {
    id: 2,
    tenant: "Lisa Anderson",
    property: "Ocean View Condos - Unit 108",
    startDate: "2022-06-01",
    endDate: "2023-05-31",
    monthlyRent: 2000,
    daysExpired: 338,
  },
  {
    id: 3,
    tenant: "David Martinez",
    property: "Downtown Lofts - Unit 405",
    startDate: "2023-03-01",
    endDate: "2024-02-29",
    monthlyRent: 1750,
    daysExpired: 65,
  },
]

export default function ExpiredLeasesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLeases = expiredLeases.filter(
    (lease) =>
      lease.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expired Leases</h1>
          <p className="text-muted-foreground">View and manage expired lease agreements</p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expired Leases</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredLeases.length}</div>
          <p className="text-xs text-muted-foreground">Historical lease records</p>
        </CardContent>
      </Card>

      {/* Expired Leases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expired Lease Archive</CardTitle>
              <CardDescription>Historical records of completed lease agreements</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expired leases..."
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
                <TableHead>Days Expired</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{lease.daysExpired} days ago</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Expired</Badge>
                  </TableCell>
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
