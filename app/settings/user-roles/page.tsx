import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Shield, Edit, Trash2 } from "lucide-react"

const roles = [
  { id: 1, name: "Administrator", users: 2, permissions: "Full Access", color: "bg-red-500" },
  {
    id: 2,
    name: "Property Manager",
    users: 5,
    permissions: "Manage Properties, Tenants, Leases",
    color: "bg-blue-500",
  },
  { id: 3, name: "Accountant", users: 2, permissions: "View & Manage Financials", color: "bg-green-500" },
  {
    id: 4,
    name: "Maintenance Staff",
    users: 8,
    permissions: "View Properties, Update Maintenance",
    color: "bg-yellow-500",
  },
  { id: 5, name: "Viewer", users: 3, permissions: "Read-Only Access", color: "bg-gray-500" },
]

export default function UserRolesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles & Permissions</h1>
          <p className="text-muted-foreground">Control access levels and permissions for team members</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles Overview</CardTitle>
          <CardDescription>Manage user roles and their associated permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${role.color}`} />
                      <span className="font-medium">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.users} users</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{role.permissions}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Detailed breakdown of permissions by role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Configure granular permissions for each role to ensure proper access control</span>
            </div>
            <Button variant="outline">Configure Permissions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
