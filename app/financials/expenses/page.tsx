"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LineChart, Line, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts"
import { FileDown, ArrowUpRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { SVGDonutChart } from "@/components/ui/svg-donut-chart"
import { AddCategoryModal } from "@/components/financials/add-category-modal"

const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const formatCurrency = (value: any): string => {
  return safeNumber(value).toLocaleString()
}

const propertyColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"]

export default function ExpensesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<any>(null)
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])

  // Date ranges
  const [expenseTrendDateRange, setExpenseTrendDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })
  const [categoryBreakdownDateRange, setCategoryBreakdownDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })
  const [propertyExpenseDateRange, setPropertyExpenseDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })

  // Expense trend filters
  const [selectedExpenseBuilding, setSelectedExpenseBuilding] = useState<string | null>(null)
  const [selectedExpenseUnits, setSelectedExpenseUnits] = useState<Set<number>>(new Set())

  // Property expense comparison filters
  const [selectedPropertyExpenseProperties, setSelectedPropertyExpenseProperties] = useState<number[]>([])

  // Expense list filters
  const [expenseListPropertyFilter, setExpenseListPropertyFilter] = useState<string>("all")
  const [expenseListCategoryFilter, setExpenseListCategoryFilter] = useState<string>("all")
  const [expenseListAmountMin, setExpenseListAmountMin] = useState<string>("")
  const [expenseListAmountMax, setExpenseListAmountMax] = useState<string>("")
  const [expenseListDateFrom, setExpenseListDateFrom] = useState<string>("")
  const [expenseListDateTo, setExpenseListDateTo] = useState<string>("")

  // Quick add expense
  const [quickExpenseData, setQuickExpenseData] = useState({
    property_id: "",
    category: "maintenance",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    vendor: "",
    payment_method: "cash",
  })
  const [submittingQuickExpense, setSubmittingQuickExpense] = useState(false)

  // Recurring expense
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [recurringExpenseData, setRecurringExpenseData] = useState({
    property_id: "",
    category: "maintenance",
    amount: "",
    description: "",
    vendor: "",
    payment_method: "cash",
    recurring_frequency: "monthly",
    expense_date: new Date().toISOString().split("T")[0],
  })
  const [submittingRecurringExpense, setSubmittingRecurringExpense] = useState(false)

  // Edit expense
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [editExpenseData, setEditExpenseData] = useState({
    property_id: "",
    category: "maintenance",
    amount: "",
    date: "",
    description: "",
    vendor: "",
    payment_method: "cash",
  })
  const [submittingEditExpense, setSubmittingEditExpense] = useState(false)

  // Edit recurring expense
  const [showEditRecurringModal, setShowEditRecurringModal] = useState(false)
  const [editingRecurringExpense, setEditingRecurringExpense] = useState<any>(null)
  const [editRecurringExpenseData, setEditRecurringExpenseData] = useState({
    property_id: "",
    category: "maintenance",
    amount: "",
    description: "",
    vendor: "",
    payment_method: "cash",
    recurring_frequency: "monthly",
    expense_date: "",
  })
  const [submittingEditRecurringExpense, setSubmittingEditRecurringExpense] = useState(false)

  // Add category modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [pendingCategorySelection, setPendingCategorySelection] = useState<"quick" | "recurring" | null>(null)

  // Fetch data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        expenseTrendStartDate: expenseTrendDateRange.start.toISOString(),
        expenseTrendEndDate: expenseTrendDateRange.end.toISOString(),
        categoryBreakdownStartDate: categoryBreakdownDateRange.start.toISOString(),
        categoryBreakdownEndDate: categoryBreakdownDateRange.end.toISOString(),
        propertyExpenseStartDate: propertyExpenseDateRange.start?.toISOString() || "",
        propertyExpenseEndDate: propertyExpenseDateRange.end?.toISOString() || "",
      })
      const response = await fetch(`/api/financials/metrics?${params}`)
      if (!response.ok) throw new Error("Failed to fetch financial data")
      const data = await response.json()

      setFinancialData(data)

      // Initialize selected units with all properties
      if (data.properties && data.properties.length > 0) {
        const allPropertyIds = data.properties.map((p: any) => p.id)
        setSelectedExpenseUnits(new Set(allPropertyIds))
        setSelectedPropertyExpenseProperties(allPropertyIds)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [expenseTrendDateRange, categoryBreakdownDateRange, propertyExpenseDateRange, toast])

  // Fetch recurring expenses
  const fetchRecurringExpenses = useCallback(async () => {
    try {
      const response = await fetch("/api/expenses/recurring")
      if (!response.ok) throw new Error("Failed to fetch recurring expenses")
      const data = await response.json()
      setRecurringExpenses(data.recurringExpenses || [])
    } catch (error) {
      console.error("[v0] Error fetching recurring expenses:", error)
    }
  }, [])

  // Fetch expense categories
  const fetchExpenseCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/expenses/categories")
      if (!response.ok) throw new Error("Failed to fetch expense categories")
      const data = await response.json()
      setExpenseCategories(data.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching expense categories:", error)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchRecurringExpenses()
    fetchExpenseCategories()
  }, [fetchDashboardData, fetchRecurringExpenses, fetchExpenseCategories])

  const properties = useMemo(() => financialData?.properties || [], [financialData?.properties])
  const expenses = useMemo(() => financialData?.expenses || [], [financialData?.expenses])

  const expenseBuildingGroups = useMemo(() => {
    const groups = new Map<string, any[]>()
    properties.forEach((property: any) => {
      const buildingName = property.property_name || "Ungrouped"
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)!.push(property)
    })
    return groups
  }, [properties])

  const toggleExpenseBuilding = useCallback(
    (buildingName: string) => {
      if (selectedExpenseBuilding === buildingName) {
        setSelectedExpenseBuilding(null)
      } else {
        setSelectedExpenseBuilding(buildingName)
        const buildingUnits = expenseBuildingGroups.get(buildingName) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedExpenseUnits.has(unit.id))
        if (!allUnitsSelected) {
          const newSelected = new Set(selectedExpenseUnits)
          buildingUnits.forEach((unit: any) => newSelected.add(unit.id))
          setSelectedExpenseUnits(newSelected)
        }
      }
    },
    [selectedExpenseBuilding, expenseBuildingGroups, selectedExpenseUnits],
  )

  const toggleExpenseUnit = useCallback(
    (unitId: number) => {
      const newSelected = new Set(selectedExpenseUnits)
      if (newSelected.has(unitId)) {
        newSelected.delete(unitId)
      } else {
        newSelected.add(unitId)
      }
      setSelectedExpenseUnits(newSelected)
    },
    [selectedExpenseUnits],
  )

  const selectAllExpensePropertiesNew = useCallback(() => {
    setSelectedExpenseBuilding(null)
    const allPropertyIds = properties.map((p: any) => p.id)
    setSelectedExpenseUnits(new Set(allPropertyIds))
  }, [properties])

  // Generate expense trend data
  const expenseTrendData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const startMonth = expenseTrendDateRange.start.getMonth()
    const endMonth = expenseTrendDateRange.end.getMonth()
    const startYear = expenseTrendDateRange.start.getFullYear()
    const endYear = expenseTrendDateRange.end.getFullYear()

    const data: any[] = []
    const currentDate = new Date(startYear, startMonth, 1)
    const endDate = new Date(endYear, endMonth, 1)

    while (currentDate <= endDate) {
      const monthData: any = {
        month: monthNames[currentDate.getMonth()],
        total: 0,
      }

      // Initialize property/building data
      if (selectedExpenseBuilding && expenseBuildingGroups.get(selectedExpenseBuilding)) {
        const buildingUnits = expenseBuildingGroups.get(selectedExpenseBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedExpenseUnits.has(unit.id))

        if (allUnitsSelected) {
          monthData[selectedExpenseBuilding] = 0
        } else {
          buildingUnits.forEach((unit: any) => {
            if (selectedExpenseUnits.has(unit.id)) {
              monthData[unit.id.toString()] = 0
            }
          })
        }
      } else {
        const allPropertiesSelected = selectedExpenseUnits.size === properties.length && properties.length > 0
        if (allPropertiesSelected) {
          monthData.total = 0
        } else {
          properties.forEach((property: any) => {
            if (selectedExpenseUnits.has(property.id)) {
              monthData[property.id.toString()] = 0
            }
          })
        }
      }

      // Calculate expenses for this month - using 'date' field from API
      expenses.forEach((expense: any) => {
        const expenseDate = new Date(expense.date) // Changed from expense.expense_date to expense.date
        if (
          expenseDate.getMonth() === currentDate.getMonth() &&
          expenseDate.getFullYear() === currentDate.getFullYear()
        ) {
          const amount = safeNumber(expense.amount)

          if (selectedExpenseBuilding && expenseBuildingGroups.get(selectedExpenseBuilding)) {
            const buildingUnits = expenseBuildingGroups.get(selectedExpenseBuilding) || []
            const allUnitsSelected = buildingUnits.every((unit: any) => selectedExpenseUnits.has(unit.id))

            if (allUnitsSelected) {
              if (buildingUnits.some((unit: any) => unit.id === expense.property)) {
                // Changed from expense.property_id to expense.property
                monthData[selectedExpenseBuilding] += amount
              }
            } else {
              if (selectedExpenseUnits.has(expense.property)) {
                // Changed from expense.property_id to expense.property
                monthData[expense.property.toString()] += amount
              }
            }
          } else {
            const allPropertiesSelected = selectedExpenseUnits.size === properties.length && properties.length > 0
            if (allPropertiesSelected) {
              monthData.total += amount
            } else {
              if (selectedExpenseUnits.has(expense.property)) {
                // Changed from expense.property_id to expense.property
                monthData[expense.property.toString()] += amount
              }
            }
          }
        }
      })

      data.push(monthData)
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    return data
  }, [
    expenseTrendDateRange,
    expenses,
    properties,
    selectedExpenseBuilding,
    selectedExpenseUnits,
    expenseBuildingGroups,
  ])

  const filteredExpenseTrendData = useMemo(() => expenseTrendData, [expenseTrendData])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, number>()

    expenses.forEach((expense: any) => {
      const expenseDate = new Date(expense.date) // Changed from expense.expense_date to expense.date
      if (
        expenseDate >= categoryBreakdownDateRange.start &&
        expenseDate <= categoryBreakdownDateRange.end &&
        expense.status === "paid"
      ) {
        const category = expense.category || "Other"
        const currentAmount = categoryMap.get(category) || 0
        categoryMap.set(category, currentAmount + safeNumber(expense.amount))
      }
    })

    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)
    const colors = ["#EF4444", "#F97316", "#F59E0B", "#84CC16", "#06B6D4", "#8B5CF6", "#EC4899"]

    return Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        key: name,
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "),
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, categoryBreakdownDateRange])

  // Property expense comparison
  const propertyExpenseComparison = useMemo(() => {
    console.log("[v0] Property Expense Comparison - Starting calculation")
    console.log("[v0] Property Expense Comparison - Date range:", propertyExpenseDateRange)
    console.log("[v0] Property Expense Comparison - Total expenses:", expenses.length)

    const propertyExpenses = new Map<number | null, { totalExpenses: number; monthCount: number }>()

    expenses.forEach((expense: any) => {
      if (!propertyExpenseDateRange.start || !propertyExpenseDateRange.end) return

      const expenseDate = new Date(expense.date) // Changed from expense.expense_date to expense.date
      if (
        expenseDate >= propertyExpenseDateRange.start &&
        expenseDate <= propertyExpenseDateRange.end &&
        expense.status === "paid"
      ) {
        const propertyId = expense.property ?? null // Changed from expense.property_id to expense.property, handle null for portfolio wide
        console.log("[v0] Property Expense Comparison - Including expense:", {
          id: expense.id,
          propertyId,
          amount: expense.amount,
          date: expense.date,
          status: expense.status,
        })

        if (!propertyExpenses.has(propertyId)) {
          propertyExpenses.set(propertyId, { totalExpenses: 0, monthCount: 0 })
        }
        const data = propertyExpenses.get(propertyId)!
        data.totalExpenses += safeNumber(expense.amount)
      }
    })

    const monthsDiff =
      propertyExpenseDateRange.start && propertyExpenseDateRange.end
        ? Math.max(
            1,
            (propertyExpenseDateRange.end.getFullYear() - propertyExpenseDateRange.start.getFullYear()) * 12 +
              (propertyExpenseDateRange.end.getMonth() - propertyExpenseDateRange.start.getMonth()) +
              1,
          )
        : 1

    const result = Array.from(propertyExpenses.entries())
      .map(([propertyId, data]) => ({
        propertyId,
        totalExpenses: data.totalExpenses,
        avgExpensePerMonth: data.totalExpenses / monthsDiff,
      }))
      .sort((a, b) => b.totalExpenses - a.totalExpenses)

    console.log("[v0] Property Expense Comparison - Final result:", result)
    console.log("[v0] Property Expense Comparison - Months diff:", monthsDiff)

    return result
  }, [expenses, propertyExpenseDateRange])

  const filteredPropertyExpenseComparison = useMemo(() => {
    console.log("[v0] Property Expense Comparison - Filtering")
    console.log("[v0] Property Expense Comparison - Selected properties:", selectedPropertyExpenseProperties)
    console.log("[v0] Property Expense Comparison - Unfiltered data:", propertyExpenseComparison)

    if (selectedPropertyExpenseProperties.length === 0) return propertyExpenseComparison

    // Filter to include selected properties AND null (Portfolio Wide) if it exists in the data
    const filtered = propertyExpenseComparison.filter(
      (item) =>
        selectedPropertyExpenseProperties.includes(item.propertyId as any) ||
        (item.propertyId === null && selectedPropertyExpenseProperties.includes(null as any)),
    )

    console.log("[v0] Property Expense Comparison - Filtered data:", filtered)
    return filtered
  }, [propertyExpenseComparison, selectedPropertyExpenseProperties])

  const selectAllPropertyExpenseProperties = useCallback(() => {
    const allPropertyIds = properties.map((p: any) => p.id)
    // Include null to represent Portfolio Wide expenses
    setSelectedPropertyExpenseProperties([...allPropertyIds, null as any])
  }, [properties])

  const togglePropertyExpenseProperty = useCallback((propertyId: number | null) => {
    setSelectedPropertyExpenseProperties((prev) =>
      prev.includes(propertyId as any) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId as any],
    )
  }, [])

  // Expense list filtering
  const filteredExpensesList = useMemo(() => {
    return expenses
      .filter((expense: any) => {
        const matchesProperty =
          expenseListPropertyFilter === "all" ||
          (expenseListPropertyFilter === "portfolio" && expense.property === null) || // Changed from expense.property_id to expense.property
          expense.property === Number.parseInt(expenseListPropertyFilter) // Changed from expense.property_id to expense.property

        const matchesCategory =
          expenseListCategoryFilter === "all" ||
          expense.category?.toLowerCase() === expenseListCategoryFilter.toLowerCase()

        const amount = safeNumber(expense.amount)
        const matchesAmount =
          (!expenseListAmountMin || amount >= Number.parseFloat(expenseListAmountMin)) &&
          (!expenseListAmountMax || amount <= Number.parseFloat(expenseListAmountMax))

        const expenseDate = new Date(expense.date) // Changed from expense.expense_date to expense.date
        const matchesDate =
          (!expenseListDateFrom || expenseDate >= new Date(expenseListDateFrom)) &&
          (!expenseListDateTo || expenseDate <= new Date(expenseListDateTo))

        return matchesProperty && matchesCategory && matchesAmount && matchesDate
      })
      .map((expense: any) => ({
        id: expense.id,
        date: expense.date, // Using date field from API
        description: expense.description || "No description",
        category: expense.category || "Other",
        property: expense.property === null ? "Portfolio Wide" : expense.property, // Changed from expense.property_id to expense.property
        amount: expense.amount,
        status: expense.status || "pending",
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [
    expenses,
    expenseListPropertyFilter,
    expenseListCategoryFilter,
    expenseListAmountMin,
    expenseListAmountMax,
    expenseListDateFrom,
    expenseListDateTo,
  ])

  const getPropertyName = useCallback(
    (propertyId: string | number | null) => {
      if (propertyId === null || propertyId === "Portfolio Wide") return "Portfolio Wide"
      const property = properties.find((p: any) => p.id === Number(propertyId))
      return property?.unit_name || property?.property_name || "Unknown"
    },
    [properties],
  )

  const ytdExpenses = useMemo(() => {
    return expenses
      .filter((expense: any) => {
        const expenseDate = new Date(expense.date) // Changed from expense.expense_date to expense.date
        const currentYear = new Date().getFullYear()
        return expenseDate.getFullYear() === currentYear && expense.status === "paid"
      })
      .reduce((sum: number, expense: any) => sum + safeNumber(expense.amount), 0)
  }, [expenses])

  const avgMonthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1
    return currentMonth > 0 ? ytdExpenses / currentMonth : 0
  }, [ytdExpenses])

  // Quick add expense handlers
  const handleQuickExpenseCategoryChange = useCallback((value: string) => {
    if (value === "add_new") {
      setPendingCategorySelection("quick")
      setShowAddCategoryModal(true)
    } else {
      setQuickExpenseData((prev) => ({ ...prev, category: value }))
    }
  }, [])

  const handleQuickExpenseSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmittingQuickExpense(true)

      try {
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: quickExpenseData.property_id === "all" ? null : Number.parseInt(quickExpenseData.property_id),
            category: quickExpenseData.category,
            amount: Number.parseFloat(quickExpenseData.amount),
            expense_date: quickExpenseData.date,
            description: quickExpenseData.description,
            vendor: quickExpenseData.vendor,
            payment_method: quickExpenseData.payment_method,
            status: "paid",
          }),
        })

        if (!response.ok) throw new Error("Failed to add expense")

        toast({
          title: "Success",
          description: "Expense added successfully",
        })

        setQuickExpenseData({
          property_id: "",
          category: "maintenance",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          vendor: "",
          payment_method: "cash",
        })

        fetchDashboardData()
      } catch (error) {
        console.error("[v0] Error adding expense:", error)
        toast({
          title: "Error",
          description: "Failed to add expense",
          variant: "destructive",
        })
      } finally {
        setSubmittingQuickExpense(false)
      }
    },
    [quickExpenseData, toast, fetchDashboardData],
  )

  // Recurring expense handlers
  const handleRecurringExpenseCategoryChange = useCallback((value: string) => {
    if (value === "add_new") {
      setPendingCategorySelection("recurring")
      setShowAddCategoryModal(true)
    } else {
      setRecurringExpenseData((prev) => ({ ...prev, category: value }))
    }
  }, [])

  const handleRecurringExpenseSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmittingRecurringExpense(true)

      try {
        const response = await fetch("/api/expenses/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id:
              recurringExpenseData.property_id === "all" ? null : Number.parseInt(recurringExpenseData.property_id),
            category: recurringExpenseData.category,
            amount: Number.parseFloat(recurringExpenseData.amount),
            description: recurringExpenseData.description,
            vendor: recurringExpenseData.vendor,
            payment_method: recurringExpenseData.payment_method,
            recurring_frequency: recurringExpenseData.recurring_frequency,
            expense_date: recurringExpenseData.expense_date,
          }),
        })

        if (!response.ok) throw new Error("Failed to add recurring expense")

        toast({
          title: "Success",
          description: "Recurring expense added successfully",
        })

        setShowRecurringModal(false)
        setRecurringExpenseData({
          property_id: "",
          category: "maintenance",
          amount: "",
          description: "",
          vendor: "",
          payment_method: "cash",
          recurring_frequency: "monthly",
          expense_date: new Date().toISOString().split("T")[0],
        })

        fetchRecurringExpenses()
      } catch (error) {
        console.error("[v0] Error adding recurring expense:", error)
        toast({
          title: "Error",
          description: "Failed to add recurring expense",
          variant: "destructive",
        })
      } finally {
        setSubmittingRecurringExpense(false)
      }
    },
    [recurringExpenseData, toast, fetchRecurringExpenses],
  )

  const handleEditExpense = useCallback((expense: any) => {
    setEditingExpense(expense)
    setEditExpenseData({
      property_id: expense.property === "Portfolio Wide" ? "all" : String(expense.property),
      category: expense.category.toLowerCase(),
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description,
      vendor: "",
      payment_method: "cash",
    })
    setShowEditExpenseModal(true)
  }, [])

  const handleEditRecurringExpense = useCallback((expense: any) => {
    setEditingRecurringExpense(expense)
    setEditRecurringExpenseData({
      property_id: expense.property_id ? String(expense.property_id) : "all",
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      vendor: "",
      payment_method: "cash",
      recurring_frequency: expense.recurring_frequency,
      expense_date: expense.expense_date,
    })
    setShowEditRecurringModal(true)
  }, [])

  const handleCategoryAdded = useCallback(
    (newCategory: any) => {
      setExpenseCategories((prev) => [...prev, newCategory])
      if (pendingCategorySelection === "quick") {
        setQuickExpenseData((prev) => ({ ...prev, category: newCategory.name }))
      } else if (pendingCategorySelection === "recurring") {
        setRecurringExpenseData((prev) => ({ ...prev, category: newCategory.name }))
      }
      setPendingCategorySelection(null)
    },
    [pendingCategorySelection],
  )

  if (loading || !financialData) {
    return (
      <MinimumLoadingWrapper>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Loading expenses data...</p>
          </div>
        </div>
      </MinimumLoadingWrapper>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track and manage all expenses across your portfolio</p>
      </div>

      {/* Expense Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">YTD Expenses</p>
              <p className="font-sans text-2xl font-bold text-foreground">GMD {formatCurrency(ytdExpenses)}</p>
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                +8% vs last year
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Monthly Expenses</p>
              <p className="font-sans text-2xl font-bold text-foreground">
                GMD {formatCurrency(Math.round(avgMonthlyExpenses))}
              </p>
              <div className="flex items-center text-sm text-muted-foreground">Based on YTD data</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Trend Chart */}
      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-foreground">Expense Trend</h2>
              <p className="text-sm text-muted-foreground">Track expense trends across your portfolio</p>
            </div>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">From:</label>
              <input
                type="date"
                value={expenseTrendDateRange.start.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newStart = new Date(e.target.value)
                  setExpenseTrendDateRange((prev) => ({ ...prev, start: newStart }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">To:</label>
              <input
                type="date"
                value={expenseTrendDateRange.end.toISOString().split("T")[0]}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value)
                  setExpenseTrendDateRange((prev) => ({ ...prev, end: newEnd }))
                }}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentYear = new Date().getFullYear()
                setExpenseTrendDateRange({
                  start: new Date(currentYear, 0, 1),
                  end: new Date(currentYear, 11, 31),
                })
              }}
            >
              Reset to Current Year
            </Button>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Filter by property:</p>
            </div>

            {/* Level 1: Buildings + All Properties */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAllExpensePropertiesNew}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedExpenseUnits.size === properties.length && !selectedExpenseBuilding
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                All Properties
              </button>

              {Array.from(expenseBuildingGroups.entries()).map(([buildingName, units]) => {
                const allUnitsSelected = units.every((unit: any) => selectedExpenseUnits.has(unit.id))
                const someUnitsSelected = units.some((unit: any) => selectedExpenseUnits.has(unit.id))

                return (
                  <button
                    key={buildingName}
                    onClick={() => toggleExpenseBuilding(buildingName)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      allUnitsSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : someUnitsSelected
                          ? "border-blue-300 bg-blue-25 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {buildingName} ({units.length})
                  </button>
                )
              })}
            </div>

            {/* Level 2: Units (shown when a building is selected) */}
            {selectedExpenseBuilding && expenseBuildingGroups.get(selectedExpenseBuilding) && (
              <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                <span className="text-xs font-medium text-muted-foreground">Units:</span>
                {expenseBuildingGroups.get(selectedExpenseBuilding)?.map((unit: any) => (
                  <button
                    key={unit.id}
                    onClick={() => toggleExpenseUnit(unit.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selectedExpenseUnits.has(unit.id)
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    {unit.unit_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={filteredExpenseTrendData}>
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
                tickFormatter={(value) => `${formatCurrency(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`GMD ${formatCurrency(value)}`, ""]}
              />
              <Legend />
              {selectedExpenseBuilding && expenseBuildingGroups.get(selectedExpenseBuilding)
                ? // Building-level view
                  (() => {
                    const buildingUnits = expenseBuildingGroups.get(selectedExpenseBuilding) || []
                    const allUnitsSelected = buildingUnits.every((unit: any) => selectedExpenseUnits.has(unit.id))

                    if (allUnitsSelected) {
                      // Show aggregated building line
                      return (
                        <Line
                          key={selectedExpenseBuilding}
                          type="monotone"
                          dataKey={selectedExpenseBuilding}
                          name={selectedExpenseBuilding}
                          stroke={propertyColors[0]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      )
                    } else {
                      // Show individual unit lines
                      return buildingUnits
                        .filter((unit: any) => selectedExpenseUnits.has(unit.id))
                        .map((unit: any, index: number) => (
                          <Line
                            key={unit.id}
                            type="monotone"
                            dataKey={unit.id.toString()}
                            name={unit.unit_name || `Unit ${unit.id}`}
                            stroke={propertyColors[index % propertyColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        ))
                    }
                  })()
                : // All properties view
                  (() => {
                    const allPropertiesSelected =
                      selectedExpenseUnits.size === properties.length && properties.length > 0

                    if (allPropertiesSelected) {
                      // Show single aggregated line for all properties
                      return (
                        <Line
                          key="total"
                          type="monotone"
                          dataKey="total"
                          name="All Properties"
                          stroke={propertyColors[0]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      )
                    } else {
                      // Show individual property lines
                      return properties
                        .filter((property: any) => selectedExpenseUnits.has(property.id))
                        .map((property: any, index: number) => (
                          <Line
                            key={property.id}
                            type="monotone"
                            dataKey={property.id.toString()}
                            name={property.unit_name || property.property_name || `Property ${property.id}`}
                            stroke={propertyColors[index % propertyColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        ))
                    }
                  })()}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Category Breakdown */}
        <Card className="border-border bg-card">
          <div className="p-6">
            <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">Expense Category Breakdown</h2>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Expense distribution by category</p>
              <Button variant="outline" size="sm">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">From:</label>
                <input
                  type="date"
                  value={categoryBreakdownDateRange.start.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value)
                    setCategoryBreakdownDateRange((prev) => ({ ...prev, start: newStart }))
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">To:</label>
                <input
                  type="date"
                  value={categoryBreakdownDateRange.end.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value)
                    setCategoryBreakdownDateRange((prev) => ({ ...prev, end: newEnd }))
                  }}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentYear = new Date().getFullYear()
                  setCategoryBreakdownDateRange({
                    start: new Date(currentYear, 0, 1),
                    end: new Date(currentYear, 11, 31),
                  })
                }}
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <SVGDonutChart
                data={categoryBreakdown}
                size={250}
                innerRadius={60}
                outerRadius={100}
                formatValue={(value) => `GMD ${formatCurrency(value)}`}
              />
            </div>

            {/* Legend */}
            {categoryBreakdown.length > 0 && (
              <div className="space-y-2">
                {categoryBreakdown.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">GMD {formatCurrency(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="border-border bg-card">
          <div className="p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-sans text-lg font-semibold text-foreground">Property Expense Comparison</h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">From:</label>
                  <Input
                    type="date"
                    value={propertyExpenseDateRange.start?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setPropertyExpenseDateRange((prev) => ({
                        ...prev,
                        start: e.target.value ? new Date(e.target.value) : null,
                      }))
                    }
                    className="h-8 w-36 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">To:</label>
                  <Input
                    type="date"
                    value={propertyExpenseDateRange.end?.toISOString().split("T")[0] || ""}
                    onChange={(e) =>
                      setPropertyExpenseDateRange((prev) => ({
                        ...prev,
                        end: e.target.value ? new Date(e.target.value) : null,
                      }))
                    }
                    className="h-8 w-36 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPropertyExpenseDateRange({
                      start: new Date(new Date().getFullYear(), 0, 1),
                      end: new Date(new Date().getFullYear(), 11, 31),
                    })
                  }
                  className="h-8 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => togglePropertyExpenseProperty(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedPropertyExpenseProperties.includes(null as any)
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                Portfolio Wide
              </button>
              {properties.map((property: any) => (
                <button
                  key={property.id}
                  onClick={() => togglePropertyExpenseProperty(property.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selectedPropertyExpenseProperties.includes(property.id)
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                  )}
                >
                  {property.unit_name || property.property_name}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Property</TableHead>
                    <TableHead className="text-right text-muted-foreground">Total Expenses</TableHead>
                    <TableHead className="text-right text-muted-foreground">Avg Expense per Month</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPropertyExpenseComparison.map((property) => (
                    <TableRow key={property.propertyId ?? "portfolio-wide"}>
                      <TableCell className="font-medium text-foreground">
                        {property.propertyId === null ? "Portfolio Wide" : getPropertyName(property.propertyId)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        GMD {formatCurrency(property.totalExpenses)}
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        GMD {formatCurrency(property.avgExpensePerMonth)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-sans text-xl font-semibold text-foreground">Quick Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickExpenseSubmit} className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Property</label>
              <Select
                value={quickExpenseData.property_id}
                onValueChange={(value) => {
                  setQuickExpenseData((prev) => ({ ...prev, property_id: value }))
                }}
                disabled={submittingQuickExpense}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="all">Portfolio Wide</SelectItem>
                  {properties.map((property: any) => (
                    <SelectItem key={property.id} value={String(property.id)}>
                      {property.unit_name || property.property_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Category *</label>
              <Select
                value={quickExpenseData.category}
                onValueChange={handleQuickExpenseCategoryChange}
                disabled={submittingQuickExpense}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.display_name}
                    </SelectItem>
                  ))}
                  <SelectItem value="add_new" className="text-blue-600 font-medium">
                    + Add New Category
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Amount (GMD) *</label>
              <Input
                id="quick-amount"
                type="number"
                placeholder="0.00"
                value={quickExpenseData.amount}
                onChange={(e) => setQuickExpenseData((prev) => ({ ...prev, amount: e.target.value }))}
                disabled={submittingQuickExpense}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Date *</label>
              <Input
                id="quick-date"
                type="date"
                value={quickExpenseData.date}
                onChange={(e) => setQuickExpenseData((prev) => ({ ...prev, date: e.target.value }))}
                disabled={submittingQuickExpense}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB]"
                disabled={submittingQuickExpense}
              >
                {submittingQuickExpense ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-foreground">Recurring Expenses</h2>
              <p className="text-sm text-muted-foreground">Scheduled recurring expenses for the next 3 months</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowRecurringModal(true)}>
              Add Recurring
            </Button>
          </div>

          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
            {recurringExpenses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No recurring expenses set up yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click "Add Recurring" to set up your first recurring expense
                </p>
              </div>
            ) : (
              recurringExpenses.map((expense) => {
                const propertyName = expense.property_id
                  ? properties.find((p: any) => p.id === expense.property_id)?.unit_name ||
                    properties.find((p: any) => p.id === expense.property_id)?.name ||
                    "Unknown"
                  : "Portfolio Wide"

                const categoryDisplay =
                  expense.category.charAt(0).toUpperCase() + expense.category.slice(1).replace(/_/g, " ")

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{expense.description}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {expense.recurring_frequency}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{propertyName}</span>
                        <span>•</span>
                        <span>{categoryDisplay}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        GMD {Number.parseFloat(expense.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(expense.expense_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRecurringExpense(expense)}
                      className="ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="border-border bg-card">
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-foreground">Expenses</h2>
              <p className="text-sm text-muted-foreground">Complete expense history with advanced filters</p>
            </div>
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Select value={expenseListPropertyFilter} onValueChange={setExpenseListPropertyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="portfolio">Portfolio Wide</SelectItem>
                {properties.map((property: any) => (
                  <SelectItem key={property.id} value={String(property.id)}>
                    {property.unit_name || property.property_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={expenseListCategoryFilter} onValueChange={setExpenseListCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Taxes">Taxes</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Amount"
              value={expenseListAmountMin}
              onChange={(e) => setExpenseListAmountMin(e.target.value)}
            />

            <Input
              type="number"
              placeholder="Max Amount"
              value={expenseListAmountMax}
              onChange={(e) => setExpenseListAmountMax(e.target.value)}
            />

            <Input
              type="date"
              placeholder="From Date"
              value={expenseListDateFrom}
              onChange={(e) => setExpenseListDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={expenseListDateTo}
              onChange={(e) => setExpenseListDateTo(e.target.value)}
            />
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Property</TableHead>
                  <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-center text-muted-foreground">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpensesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpensesList.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-foreground">{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            expense.category === "Maintenance"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : expense.category === "Utilities"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                : expense.category === "Insurance"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : expense.category === "Taxes"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
                          )}
                        >
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {expense.property === "Portfolio Wide" ? "Portfolio Wide" : getPropertyName(expense.property)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                        GMD {formatCurrency(Number.parseFloat(expense.amount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          Available
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Recurring Expense Modal */}
      <Dialog open={showRecurringModal} onOpenChange={setShowRecurringModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
          </DialogHeader>
          <CardContent>
            <form onSubmit={handleRecurringExpenseSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurring-description">Description *</Label>
                  <Input
                    id="recurring-description"
                    placeholder="e.g., Monthly HOA Fee"
                    value={recurringExpenseData.description}
                    onChange={(e) => setRecurringExpenseData((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={submittingRecurringExpense}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurring-amount">Amount (GMD) *</Label>
                  <Input
                    id="recurring-amount"
                    type="number"
                    placeholder="0.00"
                    value={recurringExpenseData.amount}
                    onChange={(e) => setRecurringExpenseData((prev) => ({ ...prev, amount: e.target.value }))}
                    disabled={submittingRecurringExpense}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recurring-category">Category *</Label>
                  <Select
                    value={recurringExpenseData.category}
                    onValueChange={handleRecurringExpenseCategoryChange}
                    disabled={submittingRecurringExpense}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.display_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new" className="text-blue-600 font-medium">
                        + Add New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurring-frequency">Frequency *</Label>
                  <Select
                    value={recurringExpenseData.recurring_frequency}
                    onValueChange={(value) =>
                      setRecurringExpenseData((prev) => ({ ...prev, recurring_frequency: value }))
                    }
                    disabled={submittingRecurringExpense}
                  >
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
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Property</label>
                  <Select
                    value={recurringExpenseData.property_id}
                    onValueChange={(value) => {
                      setRecurringExpenseData((prev) => ({ ...prev, property_id: value }))
                    }}
                    disabled={submittingRecurringExpense}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Portfolio Wide</SelectItem>
                      {properties.map((property: any) => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.unit_name || property.property_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurring-date">Start Date *</Label>
                  <Input
                    id="recurring-date"
                    type="date"
                    value={recurringExpenseData.expense_date}
                    onChange={(e) => setRecurringExpenseData((prev) => ({ ...prev, expense_date: e.target.value }))}
                    disabled={submittingRecurringExpense}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRecurringModal(false)}
                  disabled={submittingRecurringExpense}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingRecurringExpense}>
                  {submittingRecurringExpense ? "Adding..." : "Add Recurring Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <AddCategoryModal
        open={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  )
}
