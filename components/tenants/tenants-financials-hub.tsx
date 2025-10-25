"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenantsTab } from "./tenants-tab"
import { FinancialsTab } from "./financials-tab"
import type { Tenant, Reservation, Invoice, Property } from "@/lib/types"

interface TenantsFinancialsHubProps {
  tenants: Tenant[]
  reservations: Reservation[]
  invoices: Invoice[]
  properties: Property[]
}

export function TenantsFinancialsHub({ tenants, reservations, invoices, properties }: TenantsFinancialsHubProps) {
  return (
    <Tabs defaultValue="tenants" className="w-full">
      <TabsList className="grid h-12 w-full max-w-md grid-cols-2 bg-transparent p-0">
        <TabsTrigger
          value="tenants"
          className="h-full rounded-none border-b-2 data-[state=active]:border-[#3B82F6] data-[state=active]:bg-[#3B82F6] data-[state=active]:font-bold data-[state=active]:text-white data-[state=inactive]:border-transparent data-[state=inactive]:bg-[#9CA3AF] data-[state=inactive]:text-gray-700"
        >
          TENANTS
        </TabsTrigger>
        <TabsTrigger
          value="financials"
          className="h-full rounded-none border-b-2 data-[state=active]:border-[#3B82F6] data-[state=active]:bg-[#3B82F6] data-[state=active]:font-bold data-[state=active]:text-white data-[state=inactive]:border-transparent data-[state=inactive]:bg-[#9CA3AF] data-[state=inactive]:text-gray-700"
        >
          FINANCIALS
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tenants" className="mt-6">
        <TenantsTab tenants={tenants} reservations={reservations} properties={properties} invoices={invoices} />
      </TabsContent>
      <TabsContent value="financials" className="mt-6">
        <FinancialsTab invoices={invoices} reservations={reservations} tenants={tenants} properties={properties} />
      </TabsContent>
    </Tabs>
  )
}
