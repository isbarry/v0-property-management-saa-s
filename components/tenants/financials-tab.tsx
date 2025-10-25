"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Paperclip, FileDown, MoreVertical, Trash2, Edit, ChevronDown, Loader2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, PieChart, Pie } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Invoice, Reservation, Tenant, Property } from "@/lib/types"
import { OccupancyRateCard } from "./occupancy-rate-card"

interface FinancialsTabProps {
  invoices: Invoice[]
  reservations: Reservation[]
  tenants: Tenant[]
  properties: Property[]
}

const EXPENSE_COLORS: Record<string, string> = {
  maintenance: "#EF4444",
  utilities: "#3B82F6",
  insurance: "#10B981",
  taxes: "#F59E0B",
  management_fees: "#8B5CF6",
  repairs: "#EC4899",
  cleaning: "#14B8A6",
  supplies: "#F97316",
  marketing: "#A855F7",
  legal: "#6366F1",
  other: "#6B7280",
}

export function FinancialsTab({ invoices, reservations, tenants, properties }: FinancialsTabProps) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [financialMetrics, setFinancialMetrics] = useState<any>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>(properties.map((p) => p.id))
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ytd")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [property, setProperty] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [vendor, setVendor] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<string>("monthly")
  const [submittingExpense, setSubmittingExpense] = useState(false)

  useEffect(() => {
    fetchExpenses()
    fetchFinancialMetrics()
  }, [])

  const fetchExpenses = async () => {
    console.log("[v0] Fetching expenses...")
    setLoadingExpenses(true)
    try {
      const response = await fetch("/api/expenses")
      console.log("[v0] Expenses response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Expenses data:", data)
        setExpenses(data.expenses || [])
      } else {
        console.error("[v0] Failed to fetch expenses:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching expenses:", error)
    } finally {
      setLoadingExpenses(false)
    }
  }

  const fetchFinancialMetrics = async () => {
    console.log("[v0] Fetching financial metrics...")
    setLoadingMetrics(true)
    try {
      const response = await fetch("/api/financials/metrics")
      console.log("[v0] Financial metrics response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Financial metrics data:", data)
        setFinancialMetrics(data)
      } else {
        console.error("[v0] Failed to fetch financial metrics:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error fetching financial metrics:", error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const handleAddExpense = async () => {
    console.log("[v0] handleAddExpense called")
    console.log("[v0] Form values:", {
      amount,
      description,
      category,
      date,
      property,
      vendor,
      paymentMethod,
      isRecurring,
      recurringFrequency,
    })

    if (!amount || !description || !category || !date) {
      console.error("[v0] Missing required fields")
      alert("Please fill in all required fields (amount, description, category, date)")
      return
    }

    setSubmittingExpense(true)
    try {
      const expenseData = {
        property_id: property && property !== "portfolio_wide" ? Number(property) : null,
        category,
        amount: Number.parseFloat(amount),
        description,
        vendor: vendor || null,
        payment_method: paymentMethod,
        expense_date: date,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : null,
        status: "paid",
      }

      console.log("[v0] Submitting expense data:", expenseData)

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      })

      console.log("[v0] Expense creation response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Expense creation error:", errorData)
        throw new Error(errorData.error || "Failed to add expense")
      }

      const result = await response.json()
      console.log("[v0] Expense created successfully:", result)

      // Reset form
      setAmount("")
      setDescription("")
      setCategory("")
      setProperty("")
      setVendor("")
      setPaymentMethod("cash")
      setIsRecurring(false)
      setRecurringFrequency("monthly")
      setDate(new Date().toISOString().split("T")[0])

      // Refresh data
      await fetchExpenses()
      await fetchFinancialMetrics()
    } catch (error) {
      console.error("[v0] Error adding expense:", error)
      alert(`Failed to add expense: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSubmittingExpense(false)
    }
  }

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete expense")
      }

      await fetchExpenses()
      await fetchFinancialMetrics()
    } catch (error) {
      console.error("[v0] Error deleting expense:", error)
      alert(`Failed to delete expense: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleToggleExpense = (id: string) => {
    setSelectedExpenses((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const handleToggleAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([])
    } else {
      setSelectedExpenses(filteredExpenses.map((e) => e.id.toString()))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)?`)) return

    try {
      await Promise.all(
        selectedExpenses.map((id) =>
          fetch(`/api/expenses/${id}`, {
            method: "DELETE",
          }),
        ),
      )

      setSelectedExpenses([])
      await fetchExpenses()
      await fetchFinancialMetrics()
    } catch (error) {
      console.error("[v0] Error deleting expenses:", error)
      alert("Failed to delete some expenses")
    }
  }

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) => {
      if (prev.includes(propertyId)) {
        return prev.filter((id) => id !== propertyId)
      }
      return [...prev, propertyId]
    })
  }

  const toggleAllProperties = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([])
    } else {
      setSelectedProperties(properties.map((p) => p.id))
    }
  }

  const filteredExpensesByProperty = expenses.filter((expense) => {
    if (!expense.property_id) return true // Portfolio-wide expenses
    return selectedProperties.includes(expense.property_id.toString())
  })

  const expenseBreakdown = Object.entries(EXPENSE_COLORS)
    .map(([cat, color]) => {
      const categoryExpenses = filteredExpensesByProperty.filter((e) => e.category === cat)
      const total = categoryExpenses.reduce((sum, e) => sum + Number.parseFloat(e.amount || 0), 0)
      const totalExpenses = filteredExpensesByProperty.reduce((sum, e) => sum + Number.parseFloat(e.amount || 0), 0)
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " "),
        value: total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        color,
      }
    })
    .filter((item) => item.value > 0)

  const filteredExpenses = filteredExpensesByProperty.filter((expense) => {
    if (selectedCategory && expense.category !== selectedCategory) return false
    return true
  })

  const calculateFinancialOverview = () => {
    if (!financialMetrics) {
      return {
        ytdRevenue: 0,
        ytdExpenses: 0,
        ytdProfit: 0,
      }
    }

    return {
      ytdRevenue: financialMetrics.metrics.ytdRevenue,
      ytdExpenses: financialMetrics.metrics.ytdExpenses,
      ytdProfit: financialMetrics.metrics.ytdProfit,
    }
  }

  const financialOverview = calculateFinancialOverview()

  const comparisonProperties = properties.filter((p) => selectedProperties.includes(p.id))

  const generateProfitLossData = () => {
    if (!financialMetrics || !financialMetrics.propertyPerformance) {
      return []
    }

    // For now, show current month data
    // TODO: Expand this to show historical monthly data when available
    const currentMonth = new Date().toLocaleString("default", { month: "short" })

    return [
      {
        month: currentMonth,
        realizedProfit: financialOverview.ytdProfit > 0 ? financialOverview.ytdProfit : 0,
        projectedProfit: 0,
        realizedLoss: financialOverview.ytdProfit < 0 ? Math.abs(financialOverview.ytdProfit) : 0,
        projectedLoss: 0,
      },
    ]
  }

  const profitLossData = generateProfitLossData()

  return (
    <div className="space-y-6">
      {/* SECTION 1: Quick Expense Entry */}
      <Card className="sticky top-0 z-10 border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-foreground">Quick Expense Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-muted-foreground">GMD</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submittingExpense}
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submittingExpense}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} disabled={submittingExpense}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="taxes">Taxes</SelectItem>
                  <SelectItem value="management_fees">Management Fees</SelectItem>
                  <SelectItem value="repairs">Repairs</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={property} onValueChange={setProperty} disabled={submittingExpense}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portfolio_wide">Portfolio Wide</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submittingExpense}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input
                id="vendor"
                placeholder="Vendor name"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                disabled={submittingExpense}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={submittingExpense}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  disabled={submittingExpense}
                />
                Recurring Expense
              </Label>
              {isRecurring && (
                <Select value={recurringFrequency} onValueChange={setRecurringFrequency} disabled={submittingExpense}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button variant="outline" size="sm" disabled={submittingExpense}>
              <Paperclip className="mr-2 h-4 w-4" />
              Upload Receipt
            </Button>
            <Button onClick={handleAddExpense} className="bg-[#3B82F6] hover:bg-[#2563EB]" disabled={submittingExpense}>
              {submittingExpense ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-[#D1FAE5]">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">YTD Revenue</p>
              {loadingMetrics ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="font-sans text-3xl font-bold text-gray-900">
                    GMD {financialOverview.ytdRevenue.toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-[#FEE2E2]">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">YTD Expenses</p>
              {loadingMetrics ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="font-sans text-3xl font-bold text-gray-900">
                    GMD {financialOverview.ytdExpenses.toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-[#DBEAFE]">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">YTD Profit</p>
              {loadingMetrics ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="font-sans text-3xl font-bold text-gray-900">
                    GMD {financialOverview.ytdProfit.toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: Profit & Loss Timeline Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-sans text-lg font-semibold text-foreground">Profit & Loss Timeline</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={selectedPeriod === "mtd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("mtd")}
                >
                  MTD
                </Button>
                <Button
                  variant={selectedPeriod === "qtd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("qtd")}
                >
                  QTD
                </Button>
                <Button
                  variant={selectedPeriod === "ytd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("ytd")}
                >
                  YTD
                </Button>
                <Button
                  variant={selectedPeriod === "12m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod("12m")}
                >
                  12M
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-between bg-transparent">
                    <span className="truncate">
                      {selectedProperties.length === 0
                        ? "No properties"
                        : selectedProperties.length === properties.length
                          ? "All Properties"
                          : `${selectedProperties.length} ${selectedProperties.length === 1 ? "Property" : "Properties"}`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <div className="flex items-center gap-2 border-b border-border px-2 py-2">
                    <Checkbox
                      checked={selectedProperties.length === properties.length}
                      onCheckedChange={toggleAllProperties}
                    />
                    <span className="text-sm font-medium">All Properties</span>
                  </div>
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center gap-2 px-2 py-2 hover:bg-muted">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onCheckedChange={() => toggleProperty(property.id)}
                      />
                      <span className="text-sm">{property.name}</span>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profitLossData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No financial data available yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitLossData}>
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`GMD ${value.toLocaleString()}`, ""]}
                />
                <Legend />
                <Bar dataKey="realizedProfit" fill="#10B981" radius={[4, 4, 0, 0]} name="Realized Profit" />
                <Bar
                  dataKey="projectedProfit"
                  fill="#10B981"
                  fillOpacity={0.4}
                  strokeDasharray="5 5"
                  stroke="#10B981"
                  radius={[4, 4, 0, 0]}
                  name="Projected Profit"
                />
                <Bar dataKey="realizedLoss" fill="#EF4444" radius={[4, 4, 0, 0]} name="Realized Loss" />
                <Bar
                  dataKey="projectedLoss"
                  fill="#EF4444"
                  fillOpacity={0.4}
                  strokeDasharray="5 5"
                  stroke="#EF4444"
                  radius={[4, 4, 0, 0]}
                  name="Projected Loss"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <OccupancyRateCard
        selectedProperties={selectedProperties}
        selectedPeriod={selectedPeriod}
        properties={properties}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SECTION 4: Expense Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg font-semibold text-foreground">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExpenses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : expenseBreakdown.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No expenses recorded yet</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 lg:flex-row">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={(data) => setSelectedCategory(data.name === selectedCategory ? null : data.name)}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `GMD ${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {expenseBreakdown.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setSelectedCategory(item.name === selectedCategory ? null : item.name)}
                      className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-muted"
                    >
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="flex-1 text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Comparison */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-sans text-lg font-semibold text-foreground">Property Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonProperties.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No properties selected</p>
                <p className="mt-2 text-sm text-muted-foreground">Select properties from the dropdown above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Metric</th>
                      {comparisonProperties.map((property) => (
                        <th key={property.id} className="pb-2 text-right font-medium text-muted-foreground">
                          {property.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2 text-foreground">Occupancy</td>
                      {comparisonProperties.map((property) => (
                        <td key={property.id} className="py-2 text-right text-foreground">
                          {property.occupancyRate}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-foreground">Avg Daily Rate</td>
                      {comparisonProperties.map((property) => (
                        <td key={property.id} className="py-2 text-right text-foreground">
                          GMD {property.rate}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-foreground">RevPAR</td>
                      {comparisonProperties.map((property) => (
                        <td key={property.id} className="py-2 text-right text-foreground">
                          GMD {Math.round((property.rate * property.occupancyRate) / 100)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 text-foreground">Expense Ratio</td>
                      {comparisonProperties.map((property) => {
                        const propertyExpenses = expenses
                          .filter((e) => e.property_id?.toString() === property.id)
                          .reduce((sum, e) => sum + Number.parseFloat(e.amount || 0), 0)
                        const propertyRevenue = property.rate * 30 * (property.occupancyRate / 100)
                        const ratio = propertyRevenue > 0 ? (propertyExpenses / propertyRevenue) * 100 : 0
                        return (
                          <td key={property.id} className="py-2 text-right text-foreground">
                            {ratio.toFixed(0)}%
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 5: Expense History Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans text-lg font-semibold text-foreground">
              Expense History
              {selectedCategory && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCategory}
                </Badge>
              )}
            </CardTitle>
            {selectedExpenses.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="mt-2 text-sm text-muted-foreground">Add your first expense using the form above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                      onCheckedChange={handleToggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Property</TableHead>
                  <TableHead className="text-muted-foreground">Vendor</TableHead>
                  <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-center text-muted-foreground">Recurring</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const propertyName = expense.property_id
                    ? properties.find((p) => p.id === expense.property_id.toString())?.name || "Unknown"
                    : "Portfolio Wide"

                  const categoryDisplay =
                    expense.category.charAt(0).toUpperCase() + expense.category.slice(1).replace(/_/g, " ")

                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.includes(expense.id.toString())}
                          onCheckedChange={() => handleToggleExpense(expense.id.toString())}
                        />
                      </TableCell>
                      <TableCell className="text-foreground">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-foreground">{expense.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: EXPENSE_COLORS[expense.category] }}
                          />
                          <span className="text-foreground">{categoryDisplay}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{propertyName}</TableCell>
                      <TableCell className="text-foreground">{expense.vendor || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        GMD {Number.parseFloat(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.is_recurring && (
                          <Badge variant="secondary" className="text-xs">
                            {expense.recurring_frequency}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
