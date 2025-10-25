"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"
import FinancialsLoading from "./loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, Tooltip, ResponsiveContainer } from "recharts"
import { FileDown, ArrowUpRight, X, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddCategoryModal } from "@/components/financials/add-category-modal"
import { SVGDonutChart } from "@/components/charts/svg-donut-chart"

type FinancialsTab = "overview" | "revenue" | "expenses"

type RecurringExpense = {
  id: number
  description: string
  property_id: number | null
  amount: string
  recurring_frequency: string
  expense_date: string
  category: string
}

const safeNumber = (value: any): number => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const formatCurrency = (value: any): string => {
  return safeNumber(value).toLocaleString()
}

const REVENUE_SHARE_COLORS = ["#8B5CF6", "#EC4899", "#06B6D4", "#6366F1", "#F97316"]

export default function FinancialsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<FinancialsTab>("overview")
  const [loading, setLoading] = useState(true)
  const [financialData, setFinancialData] = useState<any>(null)
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([])

  const [selectedPeriod, setSelectedPeriod] = useState<string>("ytd")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedProperty, setSelectedProperty] = useState<string>("all")
  const [selectedExpenseProperties, setSelectedExpenseProperties] = useState<string[]>([])
  const [selectedPropertyExpenseProperties, setSelectedPropertyExpenseProperties] = useState<string[]>([])
  const [selectedADRProperties, setSelectedADRProperties] = useState<string[]>([])
  // ADDING STATE FOR SELECTED ADR BUILDING
  const [selectedADRBuilding, setSelectedADRBuilding] = useState<string | null>(null)
  const [selectedRevenueTimelineProperties, setSelectedRevenueTimelineProperties] = useState<string[]>([])
  const [selectedOccupancyBuilding, setSelectedOccupancyBuilding] = useState<string>("all")
  // const [selectedOccupancyUnits, setSelectedOccupancyUnits] = useState<number[]>([]) // REMOVED

  const [selectedRevenueProperties, setSelectedRevenueProperties] = useState<string[]>([])
  // REMOVED selectedRevenueShareProperties state
  const [selectedRevenueBuilding, setSelectedRevenueBuilding] = useState<string | null>(null)
  const [selectedRevenueUnits, setSelectedRevenueUnits] = useState<Set<number>>(new Set())

  const [rankingMetric, setRankingMetric] = useState<"profit" | "revenue" | "expense" | "occupancy">("profit")

  const [propertyRentalTypes, setPropertyRentalTypes] = useState<
    Record<string, "short-term" | "long-term" | "corporate">
  >({})

  // Profit card filters
  const [selectedProfitProperties, setSelectedProfitProperties] = useState<Set<string>>(new Set())
  const [selectedProfitUnits, setSelectedProfitUnits] = useState<Set<number>>(new Set())

  // Rankings card filters
  const [selectedRankingsProperties, setSelectedRankingsProperties] = useState<Set<string>>(new Set())
  const [selectedRankingsUnits, setSelectedRankingsUnits] = useState<Set<number>>(new Set())

  // Occupancy card filters
  const [selectedOccupancyProperties, setSelectedOccupancyProperties] = useState<Set<string>>(new Set())
  const [selectedOccupancyUnits, setSelectedOccupancyUnits] = useState<Set<number>>(new Set())

  // Transaction History filters
  const [selectedTransactionProperties, setSelectedTransactionProperties] = useState<Set<string>>(new Set())
  const [selectedTransactionUnits, setSelectedTransactionUnits] = useState<Set<number>>(new Set())

  // ADDING DATE RANGE STATE FOR ADR CHART
  const [adrDateRange, setAdrDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

  // ADDING DATE RANGE STATE FOR REVENUE CHART
  const [revenueDateRange, setRevenueDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

  const [revenueShareDateRange, setRevenueShareDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

  const [categoryBreakdownDateRange, setCategoryBreakdownDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

  const [propertyExpenseDateRange, setPropertyExpenseDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31),
  })

  const [selectedExpenseBuilding, setSelectedExpenseBuilding] = useState<string | null>(null)
  const [selectedExpenseUnits, setSelectedExpenseUnits] = useState<Set<number>>(new Set())

  const [expenseTrendDateRange, setExpenseTrendDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

  const [occupancyDateRange, setOccupancyDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    end: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
  })

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

  const updatePropertyRentalType = (propertyId: string, type: "short-term" | "long-term" | "corporate") => {
    setPropertyRentalTypes((prev) => ({
      ...prev,
      [propertyId]: type,
    }))
  }

  const [paymentPropertyFilter, setPaymentPropertyFilter] = useState<string>("all")
  const [paymentAmountMin, setPaymentAmountMin] = useState<string>("")
  const [paymentAmountMax, setPaymentAmountMax] = useState<string>("")
  const [paymentDateFrom, setPaymentDateFrom] = useState<string>("")
  const [paymentDateTo, setPaymentDateTo] = useState<string>("")

  const [expenseListPropertyFilter, setExpenseListPropertyFilter] = useState<string>("all")
  const [expenseListCategoryFilter, setExpenseListCategoryFilter] = useState<string>("all")
  const [expenseListAmountMin, setExpenseListAmountMin] = useState<string>("")
  const [expenseListAmountMax, setExpenseListAmountMax] = useState<string>("")
  const [expenseListDateFrom, setExpenseListDateFrom] = useState<string>("")
  const [expenseListDateTo, setExpenseListDateTo] = useState<string>("")

  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [pendingCategorySelection, setPendingCategorySelection] = useState<"quick" | "recurring" | null>(null)

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

  const fetchExpenseCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/expense-categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      console.log("[v0] Fetched expense categories:", data.categories)
      setExpenseCategories(data.categories || [])
    } catch (error) {
      console.error("[v0] Error fetching expense categories:", error)
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      // ADDING DATE RANGE PARAMETERS TO API CALL
      const params = new URLSearchParams({
        adrStartDate: adrDateRange.start.toISOString(),
        adrEndDate: adrDateRange.end.toISOString(),
        revenueStartDate: revenueDateRange.start.toISOString(),
        revenueEndDate: revenueDateRange.end.toISOString(),
        // Adding revenue share date range to API call
        revenueShareStartDate: revenueShareDateRange.start.toISOString(),
        revenueShareEndDate: revenueShareDateRange.end.toISOString(),
        // ADDING PROPERTY EXPENSE DATE RANGE TO API CALL
        propertyExpenseStartDate: propertyExpenseDateRange.start?.toISOString() || "",
        propertyExpenseEndDate: propertyExpenseDateRange.end?.toISOString() || "",
        // ADDING EXPENSE TREND DATE RANGE TO API CALL
        expenseTrendStartDate: expenseTrendDateRange.start.toISOString(),
        expenseTrendEndDate: expenseTrendDateRange.end.toISOString(),
        occupancyStartDate: occupancyDateRange.start.toISOString(),
        occupancyEndDate: occupancyDateRange.end.toISOString(),
      })
      const response = await fetch(`/api/financials/metrics?${params}`)
      if (!response.ok) throw new Error("Failed to fetch financial data")
      const data = await response.json()

      setFinancialData(data)
      setRecurringExpenses(data.recurringExpenses || [])

      // Initialize selected properties based on fetched data
      if (data.properties) {
        const propertyIds = data.properties.map((p: { id: string }) => p.id)
        setSelectedExpenseProperties(propertyIds)
        setSelectedPropertyExpenseProperties(propertyIds)
        setSelectedADRProperties(propertyIds)
        setSelectedRevenueTimelineProperties(propertyIds)
        // Initialize selectedOccupancyPropertiesSet using the new state
        setSelectedOccupancyProperties(new Set(propertyIds))
        // REMOVED setSelectedOccupancyUnits as it is now managed by occupancyBuilding and toggleOccupancyUnit
        // REMOVED setSelectedRevenueShareProperties(propertyIds)
      }

      if (data.properties && data.propertyRentalTypes) {
        const initialRentalTypes: Record<string, "short-term" | "long-term" | "corporate"> = {}
        data.properties.forEach((p: { id: string }) => {
          initialRentalTypes[p.id] = data.propertyRentalTypes[p.id] || "short-term"
        })
        setPropertyRentalTypes(initialRentalTypes)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [
    adrDateRange,
    revenueDateRange,
    revenueShareDateRange,
    propertyExpenseDateRange,
    expenseTrendDateRange,
    occupancyDateRange,
  ]) // Adding occupancyDateRange to dependencies

  useEffect(() => {
    fetchDashboardData()
    fetchExpenseCategories()
  }, [fetchDashboardData, fetchExpenseCategories])

  // The lint error was here: properties was used before its declaration.
  // Moved this useEffect after the properties const declaration.
  const properties = useMemo(() => financialData?.properties || [], [financialData?.properties])

  // REMOVED useEffect that initialized selectedRevenueShareProperties
  // useEffect(() => {
  //   if (properties.length > 0 && selectedRevenueShareProperties.length === 0) {
  //     setSelectedRevenueShareProperties(properties.map((p) => p.id))
  //   }
  // }, [properties])

  const ytdRevenue = useMemo(
    () => Number(financialData?.metrics?.ytdRevenue) || 0,
    [financialData?.metrics?.ytdRevenue],
  )
  const ytdExpenses = useMemo(
    () => Number(financialData?.metrics?.ytdExpenses) || 0,
    [financialData?.metrics?.ytdExpenses],
  )
  const ytdProfit = useMemo(() => Number(financialData?.metrics?.ytdProfit) || 0, [financialData?.metrics?.ytdProfit])

  // const properties = useMemo(() => financialData?.properties || [], [financialData?.properties])
  const reservations = useMemo(() => financialData?.reservations || [], [financialData?.reservations])
  const expenses = useMemo(() => financialData?.expenses || [], [financialData?.expenses])
  const transactionHistory = useMemo(() => financialData?.transactionHistory || [], [financialData?.transactionHistory])
  const propertyExpenseComparison = useMemo(() => {
    const comparison = financialData?.propertyExpenseComparison || []

    // The API already filters by date range and sorts by totalExpenses
    // Just return the data as-is
    return comparison
  }, [financialData?.propertyExpenseComparison])

  const revenueTimelineData = useMemo(
    () => financialData?.revenueTimelineData || [],
    [financialData?.revenueTimelineData],
  )
  const ADRData = useMemo(() => financialData?.ADRData || [], [financialData?.ADRData])
  const occupancyRateData = useMemo(() => financialData?.occupancyRateData || [], [financialData?.occupancyRateData])
  const expenseTrendData = useMemo(() => financialData?.expenseTrendData || [], [financialData?.expenseTrendData])
  const revenueByProperty = useMemo(() => financialData?.revenueByProperty || [], [financialData?.revenueByProperty])
  const revenueByRentalType = useMemo(
    () => financialData?.revenueByRentalType || [],
    [financialData?.revenueByRentalType],
  )
  const propertyPerformanceMetrics = useMemo(
    () => financialData?.propertyPerformanceMetrics || [],
    [financialData?.propertyPerformanceMetrics],
  )
  const profitLossData = useMemo(() => financialData?.profitLossData || [], [financialData?.profitLossData])

  const totalRevenue = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.revenue) || 0), 0),
    [propertyPerformanceMetrics],
  )

  const avgOccupancy = useMemo(
    () =>
      propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.occupancy) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  const avgADR = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.adr) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  const avgRevPAR = useMemo(
    () => propertyPerformanceMetrics.reduce((sum, p) => sum + (Number(p?.revPAR) || 0), 0) / (properties.length || 1),
    [propertyPerformanceMetrics, properties.length],
  )

  // Property groups for filtering
  const propertyGroups = useMemo(() => {
    const groups = new Map<string, typeof properties>()
    properties.forEach((property) => {
      const groupName = property.property_name || property.unit_name || "Ungrouped"
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(property)
    })
    return groups
  }, [properties])

  // CREATING BUILDING GROUPS FOR TIERED FILTER
  const buildingGroups = useMemo(() => {
    const groups: Record<string, typeof properties> = {}
    properties.forEach((property) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups[buildingName]) {
        groups[buildingName] = []
      }
      groups[buildingName].push(property)
    })
    return groups
  }, [properties])

  // NEW: Building groups specifically for ADR filtering
  const adrBuildingGroups = useMemo(() => {
    const groups = new Map<string, typeof properties>()
    properties.forEach((property) => {
      const buildingName = property.property_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)!.push(property)
    })
    return groups
  }, [properties])

  const revenueBuildingGroups = useMemo(() => {
    const groups = new Map<string, any[]>()
    properties.forEach((property: any) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)?.push(property)
    })
    return groups
  }, [properties])

  const expenseBuildingGroups = useMemo(() => {
    const groups = new Map<string, any[]>()
    properties.forEach((property: any) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)?.push(property)
    })
    return groups
  }, [properties])

  // Revenue by property for donut chart
  const dynamicRevenueByProperty = (properties.length > 0 ? propertyPerformanceMetrics : revenueByProperty).map(
    (p, index) => ({
      name: p?.propertyName || "Unknown Property",
      value: Number(p?.revenue) || 0,
      percentage: (((Number(p?.revenue) || 0) / (totalRevenue || 1)) * 100).toFixed(1),
      color: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][index % 6],
    }),
  )

  const dynamicRevenueByRentalType = useMemo(
    () =>
      revenueByRentalType.map((item, index) => ({
        type: item?.type || "Unknown",
        value: Number(item?.value) || 0,
        percentage: Number(item?.percentage) || 0,
        color: item?.color || ["#3B82F6", "#10B981", "#F59E0B"][index % 3],
      })),
    [revenueByRentalType],
  )

  // Prepare timeline data for line chart
  const timelineData = useMemo(
    () =>
      revenueTimelineData.map((item) => {
        const dataPoint: any = { month: item?.month || "" }
        properties.forEach((property) => {
          dataPoint[property.name] = Number(item?.properties?.[property.id]) || 0
        })
        return dataPoint
      }),
    [revenueTimelineData, properties],
  )

  // Filter transactions
  const filteredTransactions = useMemo(
    () =>
      transactionHistory.filter((transaction) => {
        const matchesSearch =
          searchQuery === "" ||
          transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.property.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = typeFilter === "all" || transaction.type === typeFilter

        // Filter by selected property
        const matchesProperty = selectedProperty === "all" || transaction.property === selectedProperty

        return matchesSearch && matchesType && matchesProperty
      }),
    [transactionHistory, searchQuery, typeFilter, selectedProperty],
  )

  const filteredRecentPayments = useMemo(
    () =>
      transactionHistory
        .filter((transaction) => transaction.type === "payment")
        .filter((payment) => {
          const matchesProperty = paymentPropertyFilter === "all" || payment.property === paymentPropertyFilter

          const matchesAmount =
            (!paymentAmountMin || payment.amount >= Number.parseFloat(paymentAmountMin)) &&
            (!paymentAmountMax || payment.amount <= Number.parseFloat(paymentAmountMax))

          const paymentDate = new Date(payment.date)
          const matchesDate =
            (!paymentDateFrom || paymentDate >= new Date(paymentDateFrom)) &&
            (!paymentDateTo || paymentDate <= new Date(paymentDateTo))

          return matchesProperty && matchesAmount && matchesDate
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactionHistory, paymentPropertyFilter, paymentAmountMin, paymentAmountMax, paymentDateFrom, paymentDateTo],
  )

  const filteredExpensesList = useMemo(
    () =>
      expenses
        .filter((expense) => {
          const matchesProperty =
            expenseListPropertyFilter === "all" ||
            expense.property === expenseListPropertyFilter ||
            (expenseListPropertyFilter === "portfolio" && expense.property === "Portfolio Wide")

          const matchesCategory = expenseListCategoryFilter === "all" || expense.category === expenseListCategoryFilter

          const matchesAmount =
            (!expenseListAmountMin || expense.amount >= Number.parseFloat(expenseListAmountMin)) &&
            (!expenseListAmountMax || expense.amount <= Number.parseFloat(expenseListAmountMax))

          const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
          const matchesDate =
            (!expenseListDateFrom || expenseDate >= new Date(expenseListDateFrom)) &&
            (!expenseListDateTo || expenseDate <= new Date(expenseListDateTo))

          return matchesProperty && matchesCategory && matchesAmount && matchesDate
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // CHANGED FROM date to date
    [
      expenses,
      expenseListPropertyFilter,
      expenseListCategoryFilter,
      expenseListAmountMin,
      expenseListAmountMax,
      expenseListDateFrom,
      expenseListDateTo,
    ],
  )

  const getPropertyName = useCallback(
    (propertyId: string | number | null | undefined) => {
      if (propertyId === "Portfolio Wide") return "Portfolio Wide"
      if (!propertyId || propertyId === null || propertyId === undefined) return "Portfolio Wide"
      const property = properties.find((p) => p.id === Number(propertyId))
      return property?.unit_name || "Unknown"
    },
    [properties],
  )

  const propertyColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  const toggleExpenseProperty = useCallback((propertyId: string) => {
    setSelectedExpenseProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }, [])

  const selectAllExpenseProperties = useCallback(() => {
    setSelectedExpenseProperties(properties.map((p) => p.id))
  }, [properties])

  const togglePropertyExpenseProperty = useCallback((propertyId: string) => {
    setSelectedPropertyExpenseProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }, [])

  const selectAllPropertyExpenseProperties = useCallback(() => {
    setSelectedPropertyExpenseProperties(properties.map((p) => p.id))
  }, [properties])

  // UPDATED ADR PROPERTY TOGGLE FUNCTIONS FOR TIERED FILTER
  const toggleADRProperty = useCallback((propertyId: string) => {
    setSelectedADRProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }, [])

  const selectAllADRProperties = useCallback(() => {
    setSelectedADRProperties(properties.map((p) => p.id))
    setSelectedADRBuilding(null) // Reset building selection when all properties are selected
  }, [properties])

  const selectADRBuilding = useCallback(
    (buildingName: string) => {
      const buildingProperties = buildingGroups[buildingName] || []
      const buildingPropertyIds = buildingProperties.map((p) => p.id)
      setSelectedADRProperties(buildingPropertyIds) // Select all properties within the building
      setSelectedADRBuilding(buildingName) // Set the selected building
    },
    [buildingGroups],
  )

  const toggleADRBuildingUnit = useCallback((propertyId: string) => {
    setSelectedADRProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
    // If a specific unit is toggled, clear the building selection to avoid confusion
    // Or, if the building selection needs to be maintained, remove this line
    // setSelectedADRBuilding(null);
  }, [])

  const toggleRevenueTimelineProperty = useCallback((propertyId: string) => {
    setSelectedRevenueTimelineProperties((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
    )
  }, [])

  const selectAllRevenueTimelineProperties = useCallback(() => {
    setSelectedRevenueTimelineProperties(properties.map((p) => p.id))
  }, [properties])

  const toggleOccupancyProperty = useCallback((propertyName: string) => {
    // Updated to use selectedOccupancyProperties Set
    setSelectedOccupancyProperties((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
      } else {
        newSelected.add(propertyName)
      }
      return newSelected
    })
  }, [])

  const selectAllOccupancyProperties = useCallback(() => {
    // Updated to use selectedOccupancyProperties Set
    if (selectedOccupancyProperties.size === propertyGroups.size) {
      setSelectedOccupancyProperties(new Set())
    } else {
      setSelectedOccupancyProperties(new Set(propertyGroups.keys()))
    }
  }, [propertyGroups, selectedOccupancyProperties])

  const filteredRevenueByProperty = useMemo(
    () =>
      propertyPerformanceMetrics
        .filter((p) => selectedRevenueProperties.includes(p.propertyId)) // Use selectedRevenueProperties here
        .map((p, index) => ({
          name: p.propertyName,
          value: p.revenue,
          color: propertyColors[properties.findIndex((prop) => prop.id === p.propertyId)],
        })),
    [propertyPerformanceMetrics, selectedRevenueProperties, properties, propertyColors], // Include selectedRevenueProperties
  )

  const totalFilteredRevenue = useMemo(
    () => filteredRevenueByProperty.reduce((sum, p) => sum + p.value, 0),
    [filteredRevenueByProperty],
  )
  // </CHANGE>

  const revenueByPropertyAndType = useMemo(() => {
    const result: Record<string, Array<{ propertyId: number; propertyName: string; revenue: number }>> = {
      "short-term": [],
      "long-term": [],
      corporate: [],
    }

    // Group reservations by property and type
    const propertyTypeRevenue: Record<number, Record<string, { propertyName: string; revenue: number }>> = {}

    propertyPerformanceMetrics.forEach((property) => {
      propertyTypeRevenue[property.propertyId] = {
        "short-term": { propertyName: property.propertyName, revenue: 0 },
        "long-term": { propertyName: property.propertyName, revenue: 0 },
        corporate: { propertyName: property.propertyName, revenue: 0 },
      }
    })

    // This would need reservation data with types - for now, use the API's transactionHistory
    // which includes reservation types
    transactionHistory
      .filter((t) => t.type === "payment" && t.category)
      .forEach((transaction) => {
        const type = transaction.category
        const propertyId = transaction.property

        if (
          propertyTypeRevenue[propertyId] &&
          (type === "short-term" || type === "long-term" || type === "corporate")
        ) {
          propertyTypeRevenue[propertyId][type].revenue += transaction.amount
        }
      })

    // Convert to array format
    Object.entries(propertyTypeRevenue).forEach(([propertyId, types]) => {
      Object.entries(types).forEach(([type, data]) => {
        if (data.revenue > 0) {
          result[type].push({
            propertyId: Number(propertyId),
            propertyName: data.propertyName,
            revenue: data.revenue,
          })
        }
      })
    })

    // Sort by revenue
    Object.keys(result).forEach((type) => {
      result[type].sort((a, b) => b.revenue - a.revenue)
    })

    console.log("[v0] Revenue by property and type:", result)

    return result
  }, [propertyPerformanceMetrics, transactionHistory])

  const revenueShareData = useMemo(() => {
    // Group revenue by building, filtered by date range
    const buildingRevenue = new Map<string, number>()

    console.log("[v0] Property Performance Metrics for Revenue Share:", propertyPerformanceMetrics)
    console.log("[v0] Properties for Revenue Share:", properties)
    console.log("[v0] Revenue Share Date Range:", revenueShareDateRange)

    // Filter reservations by date range
    const filteredReservations = reservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in)
      const checkOut = new Date(reservation.check_out)
      return (
        (checkIn >= revenueShareDateRange.start && checkIn <= revenueShareDateRange.end) ||
        (checkOut >= revenueShareDateRange.start && checkOut <= revenueShareDateRange.end) ||
        (checkIn <= revenueShareDateRange.start && checkOut >= revenueShareDateRange.end)
      )
    })

    console.log("[v0] Filtered Reservations for Revenue Share:", filteredReservations.length)

    filteredReservations.forEach((reservation) => {
      const property = properties.find((p) => p.id === reservation.property_id)
      if (!property) return

      const buildingName = property.property_name || property.unit_name
      const currentRevenue = buildingRevenue.get(buildingName) || 0
      // Use paid_amount to show only realized revenue, not unrealized revenue
      buildingRevenue.set(buildingName, currentRevenue + (Number(reservation.paid_amount) || 0))
    })

    // Calculate total revenue for percentages
    const totalRevenue = Array.from(buildingRevenue.values()).reduce((sum, val) => sum + val, 0)

    // Convert to array format for the chart
    const data = Array.from(buildingRevenue.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) : "0",
      color: REVENUE_SHARE_COLORS[index % REVENUE_SHARE_COLORS.length],
    }))

    console.log("[v0] Revenue Share Data:", data)
    console.log("[v0] Total Revenue:", totalRevenue)

    return data
  }, [reservations, properties, revenueShareDateRange]) // Changed dependency to include filtered reservations logic

  const filteredExpenseTrendData = useMemo(() => {
    console.log("[v0] Expense Trend - Expenses array:", expenses)
    console.log("[v0] Expense Trend - Selected units:", Array.from(selectedExpenseUnits))
    console.log("[v0] Expense Trend - Selected building:", selectedExpenseBuilding)
    console.log("[v0] Expense Trend - Date range:", expenseTrendDateRange)

    const { start, end } = expenseTrendDateRange

    // Generate months within the date range
    const months: string[] = []
    const currentDate = new Date(start)
    const endDate = new Date(end)

    while (currentDate <= endDate) {
      months.push(currentDate.toLocaleString("en-US", { month: "short" }))
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    const result = months.map((month) => {
      const dataPoint: any = { month }

      // Check if we're in building-level view
      if (selectedExpenseBuilding && expenseBuildingGroups.get(selectedExpenseBuilding)) {
        const buildingUnits = expenseBuildingGroups.get(selectedExpenseBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedExpenseUnits.has(unit.id))

        // If all units in the building are selected, show aggregated building expenses
        if (allUnitsSelected) {
          let totalExpenses = 0
          buildingUnits.forEach((unit: any) => {
            const unitExpenses = expenses
              .filter((expense) => {
                const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
                const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
                const matchesMonth = expenseMonth === month
                const matchesProperty = expense.property === unit.id
                const matchesDateRange = expenseDate >= start && expenseDate <= end
                return matchesMonth && matchesProperty && matchesDateRange
              })
              .reduce((sum, expense) => sum + expense.amount, 0)
            totalExpenses += unitExpenses
          })
          dataPoint[selectedExpenseBuilding] = totalExpenses
        } else {
          // Show individual unit expenses
          buildingUnits.forEach((unit: any) => {
            if (selectedExpenseUnits.has(unit.id)) {
              const unitExpenses = expenses
                .filter((expense) => {
                  const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
                  const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
                  const matchesMonth = expenseMonth === month
                  const matchesProperty = expense.property === unit.id
                  const matchesDateRange = expenseDate >= start && expenseDate <= end
                  return matchesMonth && matchesProperty && matchesDateRange
                })
                .reduce((sum, expense) => sum + expense.amount, 0)
              dataPoint[unit.id.toString()] = unitExpenses
            }
          })
        }
      } else {
        // Check if all properties are selected
        const allPropertiesSelected = selectedExpenseUnits.size === properties.length && properties.length > 0

        if (allPropertiesSelected) {
          // Calculate aggregate total for all properties
          let totalExpenses = 0
          properties.forEach((property: any) => {
            const propertyExpenses = expenses
              .filter((expense) => {
                const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
                const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
                const matchesMonth = expenseMonth === month
                const matchesProperty = expense.property === property.id
                const matchesDateRange = expenseDate >= start && expenseDate <= end
                return matchesMonth && matchesProperty && matchesDateRange
              })
              .reduce((sum, expense) => sum + expense.amount, 0)
            totalExpenses += propertyExpenses
          })
          dataPoint.total = totalExpenses
        } else {
          // Show individual unit expenses
          properties.forEach((property: any) => {
            if (selectedExpenseUnits.has(property.id)) {
              const propertyExpenses = expenses
                .filter((expense) => {
                  const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
                  const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
                  const matchesMonth = expenseMonth === month
                  const matchesProperty = expense.property === property.id
                  const matchesDateRange = expenseDate >= start && expenseDate <= end
                  return matchesMonth && matchesProperty && matchesDateRange
                })
                .reduce((sum, expense) => sum + expense.amount, 0)
              dataPoint[property.id.toString()] = propertyExpenses
            }
          })
        }
      }

      return dataPoint
    })

    console.log("[v0] Expense Trend - Filtered data:", result)
    console.log("[v0] Expense Trend - Sample data point:", result[0])

    return result
  }, [
    expenses,
    selectedExpenseUnits,
    selectedExpenseBuilding,
    expenseBuildingGroups,
    properties,
    expenseTrendDateRange,
  ])

  const categoryBreakdown = useMemo(() => {
    if (!expenses || expenses.length === 0) return []

    const { start, end } = categoryBreakdownDateRange

    // Filter expenses by date range
    const filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date) // CHANGED FROM expense_date to date
      return (!start || expenseDate >= start) && (!end || expenseDate <= end)
    })

    // Group by category
    const categoryTotals: Record<string, number> = {}
    filteredExpenses.forEach((expense) => {
      const category = expense.category || "uncategorized"
      categoryTotals[category] = (categoryTotals[category] || 0) + Number.parseFloat(expense.amount)
    })

    // Calculate total for percentages
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

    // Map to chart data format with colors
    const categoryColors: Record<string, string> = {
      utilities: "#10B981",
      maintenance: "#3B82F6",
      insurance: "#8B5CF6",
      taxes: "#F59E0B",
      management: "#EF4444",
      marketing: "#EC4899",
      supplies: "#14B8A6",
      repairs: "#F97316",
      other: "#6B7280",
      uncategorized: "#9CA3AF",
    }

    return Object.entries(categoryTotals)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        color: categoryColors[key] || "#6B7280",
        key,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, categoryBreakdownDateRange])

  const totalCategoryExpenses = useMemo(
    () => categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0),
    [categoryBreakdown],
  )

  const filteredPropertyExpenseComparison = useMemo(
    () =>
      propertyExpenseComparison.filter((property: any) =>
        selectedPropertyExpenseProperties.includes(property.propertyId),
      ),
    [propertyExpenseComparison, selectedPropertyExpenseProperties],
  )

  const filteredRevenueTimelineData = useMemo(
    () =>
      revenueTimelineData.map((item) => {
        const dataPoint: any = { month: item.month }
        properties.forEach((property) => {
          if (selectedRevenueTimelineProperties.includes(property.id)) {
            dataPoint[property.id.toString()] = item.properties[property.id] || 0 // Use property.id.toString()
          }
        })
        return dataPoint
      }),
    [revenueTimelineData, properties, selectedRevenueTimelineProperties], // Corrected dependency
  )

  const actualFilteredRevenueTimelineData = useMemo(() => {
    const data = revenueTimelineData.map((item) => {
      const dataPoint: any = { month: item.month }

      // Check if we're in building-level view (building selected but not individual units toggled)
      if (selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding)) {
        const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedRevenueUnits.has(unit.id))

        // If all units in the building are selected, show aggregated building revenue
        if (allUnitsSelected) {
          let totalRevenue = 0
          buildingUnits.forEach((unit: any) => {
            totalRevenue += item.properties[unit.id] || 0
          })
          dataPoint[selectedRevenueBuilding] = totalRevenue
        } else {
          // Show individual unit revenues
          buildingUnits.forEach((unit: any) => {
            if (selectedRevenueUnits.has(unit.id)) {
              dataPoint[unit.id.toString()] = item.properties[unit.id] || 0
            }
          })
        }
      } else {
        // Check if all properties are selected
        const allPropertiesSelected = selectedRevenueUnits.size === properties.length && properties.length > 0

        if (allPropertiesSelected) {
          // Calculate aggregate total for all properties
          let totalRevenue = 0
          properties.forEach((property: any) => {
            totalRevenue += item.properties[property.id] || 0
          })
          dataPoint.total = totalRevenue
        } else {
          // Show individual unit revenues
          properties.forEach((property: any) => {
            if (selectedRevenueUnits.has(property.id)) {
              dataPoint[property.id.toString()] = item.properties[property.id] || 0
            }
          })
        }
      }

      return dataPoint
    })

    console.log("[v0] Revenue Timeline Data:", data)
    console.log("[v0] Revenue Timeline Data sample:", data[0])
    console.log("[v0] Selected Revenue Units:", Array.from(selectedRevenueUnits))
    console.log("[v0] Selected Revenue Building:", selectedRevenueBuilding)

    return data
  }, [revenueTimelineData, properties, selectedRevenueUnits, selectedRevenueBuilding, revenueBuildingGroups])

  // Updated Occupancy Rate calculation to use selectedOccupancyProperties and selectedOccupancyUnits Sets
  const occupancyBuildingGroups = useMemo(() => {
    const groups = new Map<string, any[]>()
    properties.forEach((property: any) => {
      const buildingName = property.property_name || property.unit_name
      if (!groups.has(buildingName)) {
        groups.set(buildingName, [])
      }
      groups.get(buildingName)?.push(property)
    })
    return groups
  }, [properties])

  const occupancyTimelineData = useMemo(() => {
    if (!occupancyRateData || occupancyRateData.length === 0) {
      return []
    }

    // If no properties or units are selected, show all data
    if (selectedOccupancyProperties.size === 0 && selectedOccupancyUnits.size === 0) {
      return occupancyRateData.map((item) => {
        const dataPoint: any = { month: item.month }
        properties.forEach((property: any) => {
          dataPoint[property.unit_name || property.name] = item.properties[property.id] || 0
        })
        return dataPoint
      })
    }

    // If specific properties are selected, check if all units within those properties are selected
    const allUnitsInSelectedPropertiesSelected =
      selectedOccupancyProperties.size > 0 &&
      Array.from(selectedOccupancyProperties).every((propertyName) => {
        const propertyUnits = propertyGroups.get(propertyName) || []
        return propertyUnits.every((unit) => selectedOccupancyUnits.has(unit.id))
      })

    // If all units within the selected properties are selected, aggregate by property (building)
    if (allUnitsInSelectedPropertiesSelected && selectedOccupancyProperties.size > 0) {
      return occupancyRateData.map((item) => {
        const dataPoint: any = { month: item.month }
        selectedOccupancyProperties.forEach((propertyName) => {
          const propertyUnits = propertyGroups.get(propertyName) || []
          const totalOccupancy = propertyUnits.reduce((sum, unit) => {
            return sum + (item.properties[unit.id] || 0)
          }, 0)
          const avgOccupancy = propertyUnits.length > 0 ? totalOccupancy / propertyUnits.length : 0
          dataPoint[propertyName] = Math.round(avgOccupancy)
        })
        return dataPoint
      })
    }

    // Otherwise, show individual unit data for the selected units
    return occupancyRateData.map((item) => {
      const dataPoint: any = { month: item.month }
      selectedOccupancyUnits.forEach((unitId) => {
        const unit = properties.find((p) => p.id === unitId)
        if (unit) {
          const occupancyValue = item.properties[unitId] || 0
          dataPoint[unit.unit_name || unit.name] = occupancyValue
        }
      })
      return dataPoint
    })
  }, [occupancyRateData, selectedOccupancyUnits, selectedOccupancyProperties, properties, propertyGroups]) // Add propertyGroups dependency

  const adrTimelineData = useMemo(() => {
    const data = ADRData.map((item) => {
      const dataPoint: any = { month: item.month, marketADR: item.marketADR }

      // Check if we're in building-level view (building selected but not individual units toggled)
      if (selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding)) {
        const buildingUnits = adrBuildingGroups.get(selectedADRBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => selectedADRProperties.includes(unit.id))

        // If all units in the building are selected, show aggregated building ADR
        if (allUnitsSelected) {
          let totalRevenue = 0
          let totalNights = 0

          buildingUnits.forEach((unit: any) => {
            const unitADR = item.properties[unit.id] || 0
            // We need to get the actual revenue and nights from the API
            // For now, we'll use a weighted average approach
            // This assumes equal weight for simplicity, but ideally should use actual nights
            if (unitADR > 0) {
              totalRevenue += unitADR
              totalNights += 1
            }
          })

          const aggregatedADR = totalNights > 0 ? totalRevenue / totalNights : 0
          dataPoint[selectedADRBuilding] = aggregatedADR
        } else {
          // Show individual unit ADRs
          properties.forEach((property) => {
            if (selectedADRProperties.includes(property.id)) {
              dataPoint[property.id.toString()] = item.properties[property.id] || 0
            }
          })
        }
      } else {
        // Default behavior: show individual property ADRs
        properties.forEach((property) => {
          if (selectedADRProperties.includes(property.id)) {
            dataPoint[property.id.toString()] = item.properties[property.id] || 0
          }
        })
      }

      return dataPoint
    })

    console.log("[v0] ADR Timeline Data:", data)
    console.log("[v0] ADR Timeline Data sample:", data[0])
    console.log("[v0] Selected ADR Properties:", selectedADRProperties)
    console.log("[v0] Selected ADR Building:", selectedADRBuilding)
    return data
  }, [ADRData, properties, selectedADRProperties, selectedADRBuilding, adrBuildingGroups])

  // Profit card filter callbacks
  const handleProfitPropertyToggle = useCallback(
    (propertyName: string) => {
      const newSelected = new Set(selectedProfitProperties)
      const propertyUnits = propertyGroups.get(propertyName) || []
      const newSelectedUnits = new Set(selectedProfitUnits) // Create a new Set for units

      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
        // Remove all units from this property
        propertyUnits.forEach((unit) => newSelectedUnits.delete(unit.id))
      } else {
        newSelected.add(propertyName)
        // Add all units from this property
        propertyUnits.forEach((unit) => newSelectedUnits.add(unit.id))
      }
      setSelectedProfitProperties(newSelected)
      setSelectedProfitUnits(newSelectedUnits) // Update the state with the new Set
    },
    [selectedProfitProperties, selectedProfitUnits, propertyGroups],
  )

  const handleProfitUnitToggle = useCallback(
    (unitId: number) => {
      const newSelected = new Set(selectedProfitUnits)
      if (newSelected.has(unitId)) {
        newSelected.delete(unitId)
      } else {
        newSelected.add(unitId)
      }
      setSelectedProfitUnits(new Set(selectedProfitUnits))
    },
    [selectedProfitUnits],
  )

  const handleSelectAllProfitProperties = useCallback(() => {
    if (selectedProfitProperties.size === propertyGroups.size) {
      setSelectedProfitProperties(new Set())
      setSelectedProfitUnits(new Set())
    } else {
      setSelectedProfitProperties(new Set(propertyGroups.keys()))
      const allUnits = new Set<number>()
      properties.forEach((p) => allUnits.add(p.id))
      setSelectedProfitUnits(allUnits)
    }
  }, [selectedProfitProperties, propertyGroups, properties])

  // Rankings card filter callbacks
  const handleRankingsPropertyToggle = useCallback(
    (propertyName: string) => {
      const newSelected = new Set(selectedRankingsProperties)
      const propertyUnits = propertyGroups.get(propertyName) || []

      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
        propertyUnits.forEach((unit) => selectedRankingsUnits.delete(unit.id))
        setSelectedRankingsUnits(new Set(selectedRankingsUnits))
      } else {
        newSelected.add(propertyName)
        propertyUnits.forEach((unit) => selectedRankingsUnits.add(unit.id))
        setSelectedRankingsUnits(new Set(selectedRankingsUnits))
      }
      setSelectedRankingsProperties(newSelected)
    },
    [selectedRankingsProperties, selectedRankingsUnits, propertyGroups],
  )

  const handleRankingsUnitToggle = useCallback(
    (unitId: number) => {
      const newSelected = new Set(selectedRankingsUnits)
      if (newSelected.has(unitId)) {
        newSelected.delete(unitId)
      } else {
        newSelected.add(unitId)
      }
      setSelectedRankingsUnits(new Set(selectedRankingsUnits))
    },
    [selectedRankingsUnits],
  )

  const handleSelectAllRankingsProperties = useCallback(() => {
    if (selectedRankingsProperties.size === propertyGroups.size) {
      setSelectedRankingsProperties(new Set())
      setSelectedRankingsUnits(new Set())
    } else {
      setSelectedRankingsProperties(new Set(propertyGroups.keys()))
      const allUnits = new Set<number>()
      properties.forEach((p) => allUnits.add(p.id))
      setSelectedRankingsUnits(allUnits)
    }
  }, [selectedRankingsProperties, propertyGroups, properties])

  // Occupancy card filter callbacks
  const handleOccupancyPropertyToggle = useCallback(
    (propertyName: string) => {
      const newSelected = new Set(selectedOccupancyProperties)
      const propertyUnits = propertyGroups.get(propertyName) || []
      const newSelectedUnits = new Set(selectedOccupancyUnits)

      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
        // Remove all units from this property
        propertyUnits.forEach((unit) => newSelectedUnits.delete(unit.id))
      } else {
        newSelected.add(propertyName)
        // Add all units from this property
        propertyUnits.forEach((unit) => newSelectedUnits.add(unit.id))
      }
      setSelectedOccupancyProperties(newSelected)
      setSelectedOccupancyUnits(newSelectedUnits)
    },
    [selectedOccupancyProperties, selectedOccupancyUnits, propertyGroups],
  )

  const handleOccupancyUnitToggle = useCallback(
    (unitId: number) => {
      const newSelected = new Set(selectedOccupancyUnits)
      if (newSelected.has(unitId)) {
        newSelected.delete(unitId)
      } else {
        newSelected.add(unitId)
      }
      setSelectedOccupancyUnits(new Set(selectedOccupancyUnits))
    },
    [selectedOccupancyUnits],
  )

  const handleSelectAllOccupancyProperties = useCallback(() => {
    if (selectedOccupancyProperties.size === propertyGroups.size) {
      setSelectedOccupancyProperties(new Set())
      setSelectedOccupancyUnits(new Set())
    } else {
      setSelectedOccupancyProperties(new Set(propertyGroups.keys()))
      const allUnits = new Set<number>()
      properties.forEach((p) => allUnits.add(p.id))
      setSelectedOccupancyUnits(allUnits)
    }
  }, [selectedOccupancyProperties, propertyGroups, properties])

  // Transaction History filter callbacks
  const handleTransactionPropertyToggle = useCallback(
    (propertyName: string) => {
      const newSelected = new Set(selectedTransactionProperties)
      const propertyUnits = propertyGroups.get(propertyName) || []

      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
        propertyUnits.forEach((unit) => selectedTransactionUnits.delete(unit.id))
        setSelectedTransactionUnits(new Set(selectedTransactionUnits))
      } else {
        newSelected.add(propertyName)
        propertyUnits.forEach((unit) => selectedTransactionUnits.add(unit.id))
        setSelectedTransactionUnits(new Set(selectedTransactionUnits))
      }
      setSelectedTransactionProperties(newSelected)
    },
    [selectedTransactionProperties, selectedTransactionUnits, propertyGroups],
  )

  const handleTransactionUnitToggle = useCallback(
    (unitId: number) => {
      const newSelected = new Set(selectedTransactionUnits)
      if (newSelected.has(unitId)) {
        newSelected.delete(unitId)
      } else {
        newSelected.add(unitId)
      }
      setSelectedTransactionUnits(new Set(selectedTransactionUnits))
    },
    [selectedTransactionUnits],
  )

  const handleSelectAllTransactionProperties = useCallback(() => {
    if (selectedTransactionProperties.size === propertyGroups.size) {
      setSelectedTransactionProperties(new Set())
      setSelectedTransactionUnits(new Set())
    } else {
      setSelectedTransactionProperties(new Set(propertyGroups.keys()))
      const allUnits = new Set<number>()
      properties.forEach((p) => allUnits.add(p.id))
      setSelectedTransactionUnits(allUnits)
    }
  }, [selectedTransactionProperties, propertyGroups, properties])

  // REMOVED toggleRevenueShareProperty and selectAllRevenueShareProperties functions
  // const toggleRevenueShareProperty = useCallback((propertyId: string) => {
  //   setSelectedRevenueShareProperties((prev) =>
  //     prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId],
  //   )
  // }, [])

  // const selectAllRevenueShareProperties = useCallback(() => {
  //   setSelectedRevenueShareProperties(properties.map((p) => p.id))
  // }, [properties])

  const handleQuickExpenseCategoryChange = (value: string) => {
    if (value === "add_new") {
      setPendingCategorySelection("quick")
      setShowAddCategoryModal(true)
    } else {
      setQuickExpenseData({ ...quickExpenseData, category: value })
    }
  }

  const handleRecurringExpenseCategoryChange = (value: string) => {
    if (value === "add_new") {
      setPendingCategorySelection("recurring")
      setShowAddCategoryModal(true)
    } else {
      setRecurringExpenseData({ ...recurringExpenseData, category: value })
    }
  }

  const handleCategoryAdded = async () => {
    await fetchExpenseCategories()
    // Don't reset the form - keep the selected property
  }

  const handleQuickExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quickExpenseData.amount || !quickExpenseData.category || !quickExpenseData.date) {
      alert("Please fill in all required fields")
      return
    }

    setSubmittingQuickExpense(true)
    try {
      const expensePayload = {
        property_id:
          quickExpenseData.property_id && quickExpenseData.property_id !== "all"
            ? Number(quickExpenseData.property_id)
            : null,
        category: quickExpenseData.category,
        amount: Number.parseFloat(quickExpenseData.amount),
        description: quickExpenseData.description || `${quickExpenseData.category} expense`,
        vendor: quickExpenseData.vendor || null,
        payment_method: quickExpenseData.payment_method,
        date: quickExpenseData.date, // CHANGED FROM expense_date to date
        is_recurring: false,
        recurring_frequency: null,
        status: "paid",
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify(expensePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add expense")
      }

      toast({
        title: "Expense added successfully",
        description: `${quickExpenseData.category} expense of GMD ${formatCurrency(quickExpenseData.amount)} has been recorded.`,
      })

      // Reset form
      setQuickExpenseData({
        property_id: "",
        category: "maintenance",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        vendor: "",
        payment_method: "cash",
      })

      await fetchDashboardData()
    } catch (error: any) {
      console.error("[v0] Error adding quick expense:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSubmittingQuickExpense(false)
    }
  }

  const handleRecurringExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recurringExpenseData.amount || !recurringExpenseData.category || !recurringExpenseData.description) {
      alert("Please fill in all required fields")
      return
    }

    setSubmittingRecurringExpense(true)
    try {
      const expensePayload = {
        property_id:
          recurringExpenseData.property_id && recurringExpenseData.property_id !== "all"
            ? Number(recurringExpenseData.property_id)
            : null,
        category: recurringExpenseData.category,
        amount: Number.parseFloat(recurringExpenseData.amount),
        description: recurringExpenseData.description,
        vendor: recurringExpenseData.vendor || null,
        payment_method: recurringExpenseData.payment_method,
        date: recurringExpenseData.expense_date, // CHANGED FROM expense_date to date
        is_recurring: true,
        recurring_frequency: recurringExpenseData.recurring_frequency,
        status: "paid",
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify(expensePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add recurring expense")
      }

      toast({
        title: "Recurring expense added successfully",
        description: `${recurringExpenseData.recurring_frequency} ${recurringExpenseData.category} expense of GMD ${formatCurrency(recurringExpenseData.amount)} has been scheduled.`,
      })

      // Reset form and close modal
      setRecurringExpenseData({
        property_id: "",
        category: "maintenance",
        amount: "",
        description: "",
        vendor: "",
        payment_method: "cash",
        expense_date: new Date().toISOString().split("T")[0],
        recurring_frequency: "monthly",
      })
      setShowRecurringModal(false)

      await fetchDashboardData()
    } catch (error: any) {
      console.error("[v0] Error adding recurring expense:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSubmittingRecurringExpense(false)
    }
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setEditExpenseData({
      property_id: expense.property_id ? String(expense.property_id) : "",
      category: expense.category.toLowerCase(),
      amount: String(expense.amount),
      date: expense.date, // CHANGED FROM expense_date to date
      description: expense.description,
      vendor: expense.vendor || "",
      payment_method: expense.payment_method || "cash",
    })
    setShowEditExpenseModal(true)
  }

  const handleEditExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editExpenseData.amount || !editExpenseData.category || !editExpenseData.date) {
      alert("Please fill in all required fields")
      return
    }

    setSubmittingEditExpense(true)
    try {
      const expensePayload = {
        property_id:
          editExpenseData.property_id && editExpenseData.property_id !== "all"
            ? Number(editExpenseData.property_id)
            : null,
        category: editExpenseData.category,
        amount: Number.parseFloat(editExpenseData.amount),
        description: editExpenseData.description || `${editExpenseData.category} expense`,
        vendor: editExpenseData.vendor || null,
        payment_method: editExpenseData.payment_method,
        date: editExpenseData.date, // CHANGED FROM expense_date to date
      }

      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify(expensePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update expense")
      }

      toast({
        title: "Expense updated successfully",
        description: `${editExpenseData.category} expense has been updated.`,
      })

      setShowEditExpenseModal(false)
      setEditingExpense(null)

      await fetchDashboardData()
    } catch (error: any) {
      console.error("[v0] Error updating expense:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSubmittingEditExpense(false)
    }
  }

  const handleEditRecurringExpense = (expense: any) => {
    setEditingRecurringExpense(expense)
    setEditRecurringExpenseData({
      property_id: expense.property_id ? String(expense.property_id) : "",
      category: expense.category.toLowerCase(),
      amount: String(expense.amount),
      description: expense.description,
      vendor: expense.vendor || "",
      payment_method: expense.payment_method || "cash",
      recurring_frequency: expense.recurring_frequency,
      date: expense.date, // CHANGED FROM expense_date to date
    })
    setShowEditRecurringModal(true)
  }

  const handleEditRecurringExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !editRecurringExpenseData.amount ||
      !editRecurringExpenseData.category ||
      !editRecurringExpenseData.description
    ) {
      alert("Please fill in all required fields")
      return
    }

    setSubmittingEditRecurringExpense(true)
    try {
      const expensePayload = {
        property_id:
          editRecurringExpenseData.property_id && editRecurringExpenseData.property_id !== "all"
            ? Number(editRecurringExpenseData.property_id)
            : null,
        category: editRecurringExpenseData.category,
        amount: Number.parseFloat(editRecurringExpenseData.amount),
        description: editRecurringExpenseData.description,
        vendor: editRecurringExpenseData.vendor || null,
        payment_method: editRecurringExpenseData.payment_method,
        date: editRecurringExpenseData.date, // CHANGED FROM expense_date to date
        recurring_frequency: editRecurringExpenseData.recurring_frequency,
      }

      const response = await fetch(`/api/expenses/${editingRecurringExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSON.stringify(expensePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update recurring expense")
      }

      toast({
        title: "Recurring expense updated successfully",
        description: `${editRecurringExpenseData.recurring_frequency} ${editRecurringExpenseData.category} expense has been updated.`,
      })

      setShowEditRecurringModal(false)
      setEditingRecurringExpense(null)

      await fetchDashboardData()
    } catch (error: any) {
      console.error("[v0] Error updating recurring expense:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSubmittingEditRecurringExpense(false)
    }
  }

  // Profit units for selected properties
  const profitUnitsForSelectedProperties = useMemo(() => {
    const units: typeof properties = []
    selectedProfitProperties.forEach((propertyName) => {
      const propertyUnits = propertyGroups.get(propertyName) || []
      units.push(...propertyUnits)
    })
    return units
  }, [selectedProfitProperties, propertyGroups])

  const rankingsUnitsForSelectedProperties = useMemo(() => {
    const units: typeof properties = []
    selectedRankingsProperties.forEach((propertyName) => {
      const propertyUnits = propertyGroups.get(propertyName) || []
      units.push(...propertyUnits)
    })
    return units
  }, [selectedRankingsProperties, propertyGroups])

  const occupancyUnitsForSelectedProperties = useMemo(() => {
    const units: typeof properties = []
    selectedOccupancyProperties.forEach((propertyName) => {
      const propertyUnits = propertyGroups.get(propertyName) || []
      units.push(...propertyUnits)
    })
    return units
  }, [selectedOccupancyProperties, propertyGroups])

  const transactionUnitsForSelectedProperties = useMemo(() => {
    const units: typeof properties = []
    selectedTransactionProperties.forEach((propertyName) => {
      const propertyUnits = propertyGroups.get(propertyName) || []
      units.push(...propertyUnits)
    })
    return units
  }, [selectedTransactionProperties, propertyGroups])

  const filteredRankingsData = useMemo(() => {
    return propertyPerformanceMetrics
      .filter((property) => {
        // If no units selected or all selected, show all
        if (selectedRankingsUnits.size === 0) return true
        // Otherwise only show selected units
        return selectedRankingsUnits.has(property.propertyId)
      })
      .map((property) => {
        const expensesForProperty = propertyExpenseComparison.find((e) => e.propertyId === property.propertyId)
        const totalExpenses = expensesForProperty ? expensesForProperty.totalExpenses : 0
        const profit = property.revenue - totalExpenses
        const profitMargin = property.revenue > 0 ? (profit / property.revenue) * 100 : 0
        return {
          ...property,
          expenses: totalExpenses,
          profit,
          profitMargin,
          // NEW: Add type to each property for display
          type: property.type || "Property", // Assuming 'type' field exists in propertyPerformanceMetrics
          // NEW: Add buildingName and unitName for table display
          buildingName: properties.find((p) => p.id === property.propertyId)?.property_name,
          unitName: properties.find((p) => p.id === property.propertyId)?.unit_name,
        }
      })
      .sort((a, b) => {
        switch (rankingMetric) {
          case "profit":
            return b.profit - a.profit
          case "revenue":
            return b.revenue - a.revenue
          case "expense":
            return b.expenses - a.expenses
          case "occupancy":
            return b.occupancy - a.occupancy
          default:
            return b.profit - a.profit
        }
      })
  }, [propertyPerformanceMetrics, propertyExpenseComparison, selectedRankingsUnits, rankingMetric, properties])

  const filteredTransactionHistory = useMemo(() => {
    return transactionHistory.filter((transaction) => {
      // If no units selected, show all
      if (selectedTransactionUnits.size === 0) return true
      // Find the property for this transaction
      const property = properties.find(
        (p) => p.unit_name === transaction.property || p.property_name === transaction.property,
      )
      // Show transaction if its property is in selected units
      return property && selectedTransactionUnits.has(property.id)
    })
  }, [transactionHistory, selectedTransactionUnits, properties])

  // ADDING THE TOGGLE AND SELECT ALL FUNCTIONS FOR REVENUE FILTERS
  const toggleRevenueBuilding = useCallback(
    (buildingName: string) => {
      if (selectedRevenueBuilding === buildingName) {
        // If the same building is clicked again, deselect it to go back to unit selection
        setSelectedRevenueBuilding(null)
        setSelectedRevenueUnits(new Set()) // Clear unit selections
      } else {
        const buildingUnits = revenueBuildingGroups.get(buildingName) || []
        const buildingUnitIds = new Set(buildingUnits.map((u: any) => u.id))
        setSelectedRevenueBuilding(buildingName)
        // Select all units within the new building
        setSelectedRevenueUnits(buildingUnitIds)
      }
    },
    [selectedRevenueBuilding, revenueBuildingGroups],
  )

  const toggleRevenueUnit = useCallback(
    (unitId: number) => {
      const newSelectedUnits = new Set(selectedRevenueUnits)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      setSelectedRevenueUnits(newSelectedUnits)

      // If units are deselected, reset the building view
      if (selectedRevenueBuilding) {
        const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => newSelectedUnits.has(unit.id))
        if (!allUnitsSelected) {
          setSelectedRevenueBuilding(null)
        }
      }
    },
    [selectedRevenueUnits, selectedRevenueBuilding, revenueBuildingGroups],
  )

  const selectAllRevenueProperties = useCallback(() => {
    if (selectedRevenueUnits.size === properties.length) {
      // If all units are already selected, deselect all
      setSelectedRevenueUnits(new Set())
      setSelectedRevenueBuilding(null)
    } else {
      // Select all units
      const allUnitIds = new Set<number>()
      properties.forEach((p) => allUnitIds.add(p.id))
      setSelectedRevenueUnits(allUnitIds)
      setSelectedRevenueBuilding(null) // Clear building selection when selecting all units
    }
  }, [properties, selectedRevenueUnits])

  const toggleExpenseBuilding = useCallback(
    (buildingName: string) => {
      if (selectedExpenseBuilding === buildingName) {
        // If the same building is clicked again, deselect it to go back to unit selection
        setSelectedExpenseBuilding(null)
        setSelectedExpenseUnits(new Set()) // Clear unit selections
      } else {
        const buildingUnits = expenseBuildingGroups.get(buildingName) || []
        const buildingUnitIds = new Set(buildingUnits.map((u: any) => u.id))
        setSelectedExpenseBuilding(buildingName)
        // Select all units within the new building
        setSelectedExpenseUnits(buildingUnitIds)
      }
    },
    [selectedExpenseBuilding, expenseBuildingGroups],
  )

  const toggleExpenseUnit = useCallback(
    (unitId: number) => {
      const newSelectedUnits = new Set(selectedExpenseUnits)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      setSelectedExpenseUnits(newSelectedUnits)

      // If units are deselected, reset the building view
      if (selectedExpenseBuilding) {
        const buildingUnits = expenseBuildingGroups.get(selectedExpenseBuilding) || []
        const allUnitsSelected = buildingUnits.every((unit: any) => newSelectedUnits.has(unit.id))
        if (!allUnitsSelected) {
          setSelectedExpenseBuilding(null)
        }
      }
    },
    [selectedExpenseUnits, selectedExpenseBuilding, expenseBuildingGroups],
  )

  const selectAllExpensePropertiesNew = useCallback(() => {
    if (selectedExpenseUnits.size === properties.length) {
      // If all units are already selected, deselect all
      setSelectedExpenseUnits(new Set())
      setSelectedExpenseBuilding(null)
    } else {
      // Select all units
      const allUnitIds = new Set<number>()
      properties.forEach((p) => allUnitIds.add(p.id))
      setSelectedExpenseUnits(allUnitIds)
      setSelectedExpenseBuilding(null) // Clear building selection when selecting all units
    }
  }, [properties, selectedExpenseUnits])

  const filteredProfitLossData = useMemo(() => {
    console.log("[v0] Profit & Loss - Starting calculation")
    console.log("[v0] Profit & Loss - Selected units:", Array.from(selectedProfitUnits))
    console.log("[v0] Profit & Loss - Revenue timeline data:", revenueTimelineData)
    console.log("[v0] Profit & Loss - Expenses:", expenses)

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const data = revenueTimelineData.map((item, index) => {
      const dataPoint: any = { month: item.month }

      // Determine if this month is in the past (realized) or future (projected)
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
        item.month,
      )
      const isRealized = monthIndex <= currentMonth

      let totalRevenue = 0
      let totalExpenses = 0

      // Calculate revenue and expenses for selected units
      if (selectedProfitUnits.size > 0) {
        selectedProfitUnits.forEach((unitId) => {
          // Get revenue for this unit
          totalRevenue += item.properties[unitId] || 0

          // Get expenses for this unit
          const unitExpenses = expenses
            .filter((expense) => {
              const expenseDate = new Date(expense.date)
              const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
              return expenseMonth === item.month && expense.property === unitId
            })
            .reduce((sum, expense) => sum + expense.amount, 0)

          totalExpenses += unitExpenses
        })
      } else {
        // If no units selected, calculate for all properties
        properties.forEach((property: any) => {
          totalRevenue += item.properties[property.id] || 0

          const propertyExpenses = expenses
            .filter((expense) => {
              const expenseDate = new Date(expense.date)
              const expenseMonth = expenseDate.toLocaleString("en-US", { month: "short" })
              return expenseMonth === item.month && expense.property === property.id
            })
            .reduce((sum, expense) => sum + expense.amount, 0)

          totalExpenses += propertyExpenses
        })
      }

      const profit = totalRevenue - totalExpenses

      if (isRealized) {
        dataPoint.realizedProfit = profit
        dataPoint.projectedProfit = 0
      } else {
        dataPoint.realizedProfit = 0
        dataPoint.projectedProfit = profit
      }

      return dataPoint
    })

    console.log("[v0] Profit & Loss - Calculated data:", data)
    console.log("[v0] Profit & Loss - Sample data point:", data[0])

    return data
  }, [revenueTimelineData, expenses, selectedProfitUnits, properties])

  // Occupancy filter callbacks
  // const occupancyBuildingGroups = useMemo(() => {
  //   const groups = new Map<string, any[]>()
  //   properties.forEach((property: any) => {
  //     const buildingName = property.property_name || property.unit_name
  //     if (!groups.has(buildingName)) {
  //       groups.set(buildingName, [])
  //     }
  //     groups.get(buildingName)?.push(property)
  //   })
  //   return groups
  // }, [properties])

  const toggleOccupancyBuilding = useCallback(
    (buildingName: string) => {
      if (selectedOccupancyBuilding === buildingName) {
        setSelectedOccupancyBuilding("all")
        setSelectedOccupancyUnits([])
      } else {
        setSelectedOccupancyBuilding(buildingName)
        const buildingUnits = occupancyBuildingGroups.get(buildingName) || []
        setSelectedOccupancyUnits(buildingUnits.map((u: any) => u.id))
      }
    },
    [selectedOccupancyBuilding, occupancyBuildingGroups],
  )

  const toggleOccupancyUnit = useCallback(
    (unitId: number) => {
      setSelectedOccupancyUnits((prev) => {
        const newSelectedUnits = [...prev]
        if (newSelectedUnits.includes(unitId)) {
          // Remove unit
          const index = newSelectedUnits.indexOf(unitId)
          newSelectedUnits.splice(index, 1)
        } else {
          // Add unit
          newSelectedUnits.push(unitId)
        }

        // If building is selected and all units are now deselected, reset building
        if (selectedOccupancyBuilding !== "all" && newSelectedUnits.length === 0) {
          setSelectedOccupancyBuilding("all")
        } else if (selectedOccupancyBuilding !== "all") {
          // If a unit is deselected from a building, the building should reflect partial selection
          const buildingUnits = occupancyBuildingGroups.get(selectedOccupancyBuilding) || []
          const allUnitsSelected = buildingUnits.every((u: any) => newSelectedUnits.includes(u.id))
          if (!allUnitsSelected) {
            // The building itself is no longer fully selected, so we might want to indicate that
            // For now, we'll keep the building name but it's not fully selected
          }
        }

        return newSelectedUnits
      })
    },
    [selectedOccupancyBuilding, occupancyBuildingGroups],
  )

  return (
    <MinimumLoadingWrapper skeleton={<FinancialsLoading />} delay={1000}>
      <div className="mx-auto max-w-7xl space-y-6 p-6" data-onboarding="financials-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">Financials</h1>
            <p className="text-sm text-muted-foreground">Track revenue, expenses, and financial performance</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="inline-flex rounded-lg bg-muted p-1">
            <TabsTrigger
              value="overview"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-semibold transition-colors data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:hover:bg-[#2563EB]",
                "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="revenue"
              onClick={() => setActiveTab("revenue")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-semibold transition-colors data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:hover:bg-[#2563EB]",
                "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              onClick={() => setActiveTab("expenses")}
              className={cn(
                "rounded-md px-6 py-2 text-sm font-semibold transition-colors data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white data-[state=active]:hover:bg-[#2563EB]",
                "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-[#D1FAE5] dark:bg-[#064E3B]">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">YTD Revenue</p>
                    <p className="font-sans text-2xl font-bold text-gray-900 dark:text-white">
                      GMD {formatCurrency(ytdRevenue)}
                    </p>
                    <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +12% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-[#FEE2E2] dark:bg-[#7F1D1D]">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">YTD Expenses</p>
                    <p className="font-sans text-2xl font-bold text-gray-900 dark:text-white">
                      GMD {formatCurrency(ytdExpenses)}
                    </p>
                    <div className="flex items-center text-sm text-red-700 dark:text-red-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +8% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-[#DBEAFE] dark:bg-[#1E3A8A]">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">YTD Net Profit</p>
                    <p
                      className={cn(
                        "font-sans text-2xl font-bold",
                        ytdProfit >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400",
                      )}
                    >
                      GMD {formatCurrency(ytdProfit)}
                    </p>
                    <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +15% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profit & Loss Chart */}
            <Card className="border-border bg-card" data-onboarding="profit-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Profit & Loss</h2>
                    <p className="text-sm text-muted-foreground">Monthly profit and loss trends</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllProfitProperties}
                      className={cn(
                        "h-9 rounded-full border-2 px-4 transition-colors",
                        selectedProfitProperties.size === 0 || selectedProfitProperties.size === propertyGroups.size
                          ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                      )}
                    >
                      All Properties
                    </Button>
                    {Array.from(propertyGroups.keys()).map((propertyName) => (
                      <Button
                        key={propertyName}
                        variant="outline"
                        size="sm"
                        onClick={() => handleProfitPropertyToggle(propertyName)}
                        className={cn(
                          "h-9 rounded-full border-2 px-4 transition-colors",
                          selectedProfitProperties.has(propertyName)
                            ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                        )}
                      >
                        {propertyName}
                      </Button>
                    ))}
                  </div>

                  {profitUnitsForSelectedProperties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Units:</span>
                      {profitUnitsForSelectedProperties.map((unit) => (
                        <Button
                          key={unit.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleProfitUnitToggle(unit.id)}
                          className={cn(
                            "h-9 rounded-full border-2 px-4 transition-colors",
                            selectedProfitUnits.has(unit.id)
                              ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                          )}
                        >
                          {unit.unit_name}
                          {selectedProfitUnits.has(unit.id) && <X className="ml-1 h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredProfitLossData}>
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
                      tickFormatter={(value) => `GMD ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {payload[0].payload.month}
                                  </span>
                                  {payload.map((entry: any, index: number) => (
                                    <span key={index} className="font-bold" style={{ color: entry.color }}>
                                      {entry.name}: GMD {entry.value.toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="realizedProfit" fill="#10B981" radius={[4, 4, 0, 0]} name="Realized" />
                    <Bar
                      dataKey="projectedProfit"
                      fill="#10B981"
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                      name="Projected"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Property Profit Ranking Card */}
            <Card className="border-border bg-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Rankings</h2>
                    <p className="text-sm text-muted-foreground">Ranked by net profit (revenue - expenses)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rank by:</span>
                    <div className="flex gap-1">
                      <Button
                        variant={rankingMetric === "profit" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRankingMetric("profit")}
                        className={rankingMetric === "profit" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
                      >
                        Profit
                      </Button>
                      <Button
                        variant={rankingMetric === "revenue" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRankingMetric("revenue")}
                        className={rankingMetric === "revenue" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
                      >
                        Revenue
                      </Button>
                      <Button
                        variant={rankingMetric === "expense" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRankingMetric("expense")}
                        className={rankingMetric === "expense" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
                      >
                        Expense
                      </Button>
                      <Button
                        variant={rankingMetric === "occupancy" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRankingMetric("occupancy")}
                        className={rankingMetric === "occupancy" ? "bg-[#3B82F6] hover:bg-[#2563EB]" : ""}
                      >
                        Occupancy
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Rank</TableHead>
                        <TableHead className="text-muted-foreground">Property</TableHead>
                        <TableHead className="text-muted-foreground">Unit</TableHead>
                        <TableHead className="text-right text-muted-foreground">Revenue</TableHead>
                        <TableHead className="text-right text-muted-foreground">Expenses</TableHead>
                        <TableHead className="text-right text-muted-foreground">Net Profit</TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          {rankingMetric === "occupancy" ? "Occupancy" : "Profit Margin"}
                        </TableHead>
                        <TableHead className="text-center text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRankingsData.map((property, index) => (
                        <TableRow key={property.propertyId}>
                          <TableCell className="font-medium text-foreground">#{index + 1}</TableCell>
                          <TableCell className="font-medium text-foreground">
                            {property.buildingName || property.unitName || property.propertyName}
                          </TableCell>
                          <TableCell className="text-foreground">{property.unitName || "—"}</TableCell>
                          <TableCell className="text-right text-foreground">
                            GMD {formatCurrency(property.revenue)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">
                            GMD {formatCurrency(property.expenses)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              property.profit >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            GMD {formatCurrency(property.profit)}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {rankingMetric === "occupancy"
                              ? `${property.occupancy}%`
                              : `${property.profitMargin.toFixed(1)}%`}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn(
                                rankingMetric === "occupancy"
                                  ? property.occupancy >= 85
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : property.occupancy >= 75
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                      : property.occupancy >= 65
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : property.profitMargin >= 90
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : property.profitMargin >= 80
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                      : property.profitMargin >= 70
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                              )}
                            >
                              {rankingMetric === "occupancy"
                                ? property.occupancy >= 85
                                  ? "Excellent"
                                  : property.occupancy >= 75
                                    ? "Good"
                                    : property.occupancy >= 65
                                      ? "Fair"
                                      : "Poor"
                                : property.profitMargin >= 90
                                  ? "Excellent"
                                  : property.profitMargin >= 80
                                    ? "Good"
                                    : property.profitMargin >= 70
                                      ? "Fair"
                                      : "Poor"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>

            {/* Occupancy Rate Card */}
            <Card className="border-border bg-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Occupancy Rate</h2>
                    <p className="text-sm text-muted-foreground">Track occupancy trends across your portfolio</p>
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
                      value={occupancyDateRange.start.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newStart = new Date(e.target.value)
                        setOccupancyDateRange((prev) => ({ ...prev, start: newStart }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">To:</label>
                    <input
                      type="date"
                      value={occupancyDateRange.end.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newEnd = new Date(e.target.value)
                        setOccupancyDateRange((prev) => ({ ...prev, end: newEnd }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentYear = new Date().getFullYear()
                      setOccupancyDateRange({
                        start: new Date(currentYear, 0, 1),
                        end: new Date(currentYear, 11, 31),
                      })
                    }}
                  >
                    Reset to Current Year
                  </Button>
                </div>

                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Filter by property:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllOccupancyProperties}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {properties.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => handleOccupancyPropertyToggle(property.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedOccupancyProperties.has(property.id)
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        )}
                      >
                        {property.name}
                      </button>
                    ))}
                  </div>

                  {occupancyUnitsForSelectedProperties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Units:</span>
                      {occupancyUnitsForSelectedProperties.map((unit) => (
                        <Button
                          key={unit.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOccupancyUnitToggle(unit.id)}
                          className={cn(
                            "h-9 rounded-full border-2 px-4 transition-colors",
                            selectedOccupancyUnits.has(unit.id)
                              ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                          )}
                        >
                          {unit.unit_name}
                          {selectedOccupancyUnits.has(unit.id) && <X className="ml-1 h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={occupancyTimelineData}>
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
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Legend />
                    {selectedOccupancyBuilding === "all"
                      ? Array.from(selectedOccupancyUnits).map((unitId, index) => {
                          const unit = properties.find((p) => p.id === unitId)
                          if (!unit) return null
                          return (
                            <Line
                              key={unitId}
                              type="monotone"
                              dataKey={unit.unit_name}
                              stroke={propertyColors[index % propertyColors.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          )
                        })
                      : selectedOccupancyUnits.length ===
                          (occupancyBuildingGroups.get(selectedOccupancyBuilding) || []).length
                        ? [
                            <Line
                              key={selectedOccupancyBuilding}
                              type="monotone"
                              dataKey={selectedOccupancyBuilding}
                              stroke={propertyColors[0]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />,
                          ]
                        : Array.from(selectedOccupancyUnits).map((unitId, index) => {
                            const unit = properties.find((p) => p.id === unitId)
                            if (!unit) return null
                            return (
                              <Line
                                key={unitId}
                                type="monotone"
                                dataKey={unit.unit_name}
                                stroke={propertyColors[index % propertyColors.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            )
                          })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Transaction History table */}
            <Card className="border-border bg-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Transaction History</h2>
                    <p className="text-sm text-muted-foreground">Recent financial transactions across your portfolio</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Filter by property:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllTransactionProperties}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {properties.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => handleTransactionPropertyToggle(property.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedTransactionProperties.has(property.id)
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        )}
                      >
                        {property.name}
                      </button>
                    ))}
                  </div>

                  {transactionUnitsForSelectedProperties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Units:</span>
                      {transactionUnitsForSelectedProperties.map((unit) => (
                        <Button
                          key={unit.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTransactionUnitToggle(unit.id)}
                          className={cn(
                            "h-9 rounded-full border-2 px-4 transition-colors",
                            selectedTransactionUnits.has(unit.id)
                              ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                          )}
                        >
                          {unit.unit_name}
                          {selectedTransactionUnits.has(unit.id) && <X className="ml-1 h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground">Description</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Property</TableHead>
                      <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-center text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactionHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactionHistory.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{transaction.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                transaction.type === "payment"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              }
                            >
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{getPropertyName(transaction.property)}</TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              transaction.type === "payment"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {transaction.type === "payment" ? "+" : "-"}GMD{" "}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={transaction.status === "completed" ? "default" : "secondary"}
                              className={
                                transaction.status === "completed"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              }
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Revenue Tab Content */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="font-sans text-2xl font-bold text-foreground">GMD {formatCurrency(totalRevenue)}</p>
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +12% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg Occupancy</p>
                    <p className="font-sans text-2xl font-bold text-foreground">{avgOccupancy.toFixed(1)}%</p>
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +5% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg ADR</p>
                    <p className="font-sans text-2xl font-bold text-foreground">GMD {avgADR.toFixed(0)}</p>
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +8% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg RevPAR</p>
                    <p className="font-sans text-2xl font-bold text-foreground">GMD {avgRevPAR.toFixed(0)}</p>
                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                      +10% vs last year
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Timeline Chart */}
            <Card className="border-border bg-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Revenue</h2>
                    <p className="text-sm text-muted-foreground">Track revenue trends across your portfolio</p>
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
                      value={revenueDateRange.start.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newStart = new Date(e.target.value)
                        setRevenueDateRange((prev) => ({ ...prev, start: newStart }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">To:</label>
                    <input
                      type="date"
                      value={revenueDateRange.end.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newEnd = new Date(e.target.value)
                        setRevenueDateRange((prev) => ({ ...prev, end: newEnd }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentYear = new Date().getFullYear()
                      setRevenueDateRange({
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
                      onClick={selectAllRevenueProperties}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selectedRevenueUnits.size === properties.length && !selectedRevenueBuilding
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      All Properties
                    </button>

                    {Array.from(revenueBuildingGroups.entries()).map(([buildingName, units]) => {
                      const allUnitsSelected = units.every((unit: any) => selectedRevenueUnits.has(unit.id))
                      const someUnitsSelected = units.some((unit: any) => selectedRevenueUnits.has(unit.id))
                      const isSelected = selectedRevenueBuilding === buildingName

                      return (
                        <button
                          key={buildingName}
                          onClick={() => toggleRevenueBuilding(buildingName)}
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
                  {selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding) && (
                    <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                      <span className="text-xs font-medium text-muted-foreground">Units:</span>
                      {revenueBuildingGroups.get(selectedRevenueBuilding)?.map((unit: any) => (
                        <button
                          key={unit.id}
                          onClick={() => toggleRevenueUnit(unit.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                            selectedRevenueUnits.has(unit.id)
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
                  <BarChart data={actualFilteredRevenueTimelineData}>
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
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {payload[0].payload.month}
                                  </span>
                                  {payload.map((entry: any, index: number) => (
                                    <span key={index} className="font-bold" style={{ color: entry.color }}>
                                      {entry.name}: GMD {entry.value.toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    {selectedRevenueBuilding && revenueBuildingGroups.get(selectedRevenueBuilding)
                      ? // Building-level view
                        (() => {
                          const buildingUnits = revenueBuildingGroups.get(selectedRevenueBuilding) || []
                          const allUnitsSelected = buildingUnits.every((unit: any) => selectedRevenueUnits.has(unit.id))

                          if (allUnitsSelected) {
                            // Show aggregated building bar
                            return (
                              <Bar
                                key={selectedRevenueBuilding}
                                dataKey={selectedRevenueBuilding}
                                name={selectedRevenueBuilding}
                                fill={propertyColors[0]}
                                radius={[4, 4, 0, 0]}
                              />
                            )
                          } else {
                            // Show individual unit bars
                            return buildingUnits
                              .filter((unit: any) => selectedRevenueUnits.has(unit.id))
                              .map((unit: any, index: number) => (
                                <Bar
                                  key={unit.id}
                                  dataKey={unit.id.toString()}
                                  name={unit.unit_name || `Unit ${unit.id}`}
                                  fill={propertyColors[index % propertyColors.length]}
                                  radius={[4, 4, 0, 0]}
                                />
                              ))
                          }
                        })()
                      : // All properties view
                        (() => {
                          const allPropertiesSelected =
                            selectedRevenueUnits.size === properties.length && properties.length > 0

                          if (allPropertiesSelected) {
                            // Show single aggregated bar for all properties
                            return (
                              <Bar
                                key="total"
                                dataKey="total"
                                name="All Properties"
                                fill={propertyColors[0]}
                                radius={[4, 4, 0, 0]}
                              />
                            )
                          } else {
                            // Show individual property bars
                            return properties
                              .filter((property: any) => selectedRevenueUnits.has(property.id))
                              .map((property: any, index: number) => (
                                <Bar
                                  key={property.id}
                                  dataKey={property.id.toString()}
                                  name={property.unit_name || property.property_name || `Property ${property.id}`}
                                  fill={propertyColors[index % propertyColors.length]}
                                  radius={[4, 4, 0, 0]}
                                />
                              ))
                          }
                        })()}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-border bg-card">
              <div className="p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-sans text-lg font-semibold text-foreground">Average Daily Rate (ADR)</h2>
                    <p className="text-sm text-muted-foreground">Compare your ADR against market average</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                {/* ADDING DATE RANGE FILTER */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">From:</label>
                    <input
                      type="date"
                      value={adrDateRange.start.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newStart = new Date(e.target.value)
                        setAdrDateRange((prev) => ({ ...prev, start: newStart }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">To:</label>
                    <input
                      type="date"
                      value={adrDateRange.end.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const newEnd = new Date(e.target.value)
                        setAdrDateRange((prev) => ({ ...prev, end: newEnd }))
                      }}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentYear = new Date().getFullYear()
                      setAdrDateRange({
                        start: new Date(currentYear, 0, 1),
                        end: new Date(currentYear, 11, 31),
                      })
                    }}
                  >
                    Reset to Current Year
                  </Button>
                </div>

                {/* Replacing ADR filter with P&L-style filter */}
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedADRProperties.length === properties.length) {
                          setSelectedADRProperties([])
                        } else {
                          setSelectedADRProperties(properties.map((p: any) => p.id))
                        }
                        setSelectedADRBuilding(null)
                      }}
                      className={cn(
                        "h-9 rounded-full border-2 px-4 transition-colors",
                        selectedADRProperties.length === 0 || selectedADRProperties.length === properties.length
                          ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                      )}
                    >
                      All Properties
                    </Button>
                    {Array.from(adrBuildingGroups.keys()).map((buildingName) => {
                      const buildingUnits = adrBuildingGroups.get(buildingName) || []
                      const allUnitsSelected = buildingUnits.every((unit: any) =>
                        selectedADRProperties.includes(unit.id),
                      )
                      const someUnitsSelected = buildingUnits.some((unit: any) =>
                        selectedADRProperties.includes(unit.id),
                      )

                      return (
                        <Button
                          key={buildingName}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (allUnitsSelected) {
                              // Deselect all units in this building
                              setSelectedADRProperties((prev) =>
                                prev.filter((id) => !buildingUnits.find((u: any) => u.id === id)),
                              )
                              setSelectedADRBuilding(null)
                            } else {
                              // Select all units in this building
                              const unitIds = buildingUnits.map((u: any) => u.id)
                              setSelectedADRProperties((prev) => {
                                const newSet = new Set([...prev, ...unitIds])
                                return Array.from(newSet)
                              })
                              setSelectedADRBuilding(buildingName)
                            }
                          }}
                          className={cn(
                            "h-9 rounded-full border-2 px-4 transition-colors",
                            allUnitsSelected
                              ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : someUnitsSelected
                                ? "border-blue-400 bg-blue-25 text-blue-500 hover:bg-blue-50"
                                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                          )}
                        >
                          {buildingName}
                          {buildingUnits.length > 1 && (
                            <span className="ml-1 text-xs opacity-60">({buildingUnits.length})</span>
                          )}
                        </Button>
                      )
                    })}
                  </div>

                  {selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding) && (
                    <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                      <span className="text-sm text-muted-foreground">Units:</span>
                      {adrBuildingGroups.get(selectedADRBuilding)?.map((unit: any) => (
                        <Button
                          key={unit.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedADRProperties((prev) => {
                              if (prev.includes(unit.id)) {
                                return prev.filter((id) => id !== unit.id)
                              } else {
                                return [...prev, unit.id]
                              }
                            })
                          }}
                          className={cn(
                            "h-9 rounded-full border-2 px-4 transition-colors",
                            selectedADRProperties.includes(unit.id)
                              ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                          )}
                        >
                          {unit.unit_name}
                          {selectedADRProperties.includes(unit.id) && <X className="ml-1 h-3 w-3" />}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adrTimelineData}>
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
                      tickFormatter={(value) => `${value}`}
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
                    {selectedADRBuilding && adrBuildingGroups.get(selectedADRBuilding)
                      ? (() => {
                          const buildingUnits = adrBuildingGroups.get(selectedADRBuilding) || []
                          const allUnitsSelected = buildingUnits.every((unit: any) =>
                            selectedADRProperties.includes(unit.id),
                          )

                          if (allUnitsSelected) {
                            // Show single line for building aggregate
                            return (
                              <Line
                                key={selectedADRBuilding}
                                type="monotone"
                                dataKey={selectedADRBuilding}
                                name={selectedADRBuilding}
                                stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                                strokeWidth={2}
                                dot={false}
                              />
                            )
                          } else {
                            // Show individual unit lines
                            return properties
                              .filter((property: any) => selectedADRProperties.includes(property.id))
                              .map((property: any, index: number) => (
                                <Line
                                  key={property.id}
                                  type="monotone"
                                  dataKey={property.id.toString()}
                                  stroke={`hsl(${(index * 360) / properties.length}, 70%, 50%)`}
                                  strokeWidth={2}
                                  dot={false}
                                  name={property.name || property.unit_name || `Property ${property.id}`}
                                />
                              ))
                          }
                        })()
                      : // Default: show all selected properties
                        properties
                          .filter((property: any) => selectedADRProperties.includes(property.id))
                          .map((property: any, index: number) => (
                            <Line
                              key={property.id}
                              type="monotone"
                              dataKey={property.id.toString()}
                              stroke={`hsl(${(index * 360) / properties.length}, 70%, 50%)`}
                              strokeWidth={2}
                              dot={false}
                              name={property.name || property.unit_name || `Property ${property.id}`}
                            />
                          ))}
                    <Line
                      type="monotone"
                      dataKey="marketADR"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      name="Market Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Revenue Share by Property Card */}
              <Card className="border-border bg-card">
                <div className="p-6">
                  <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">Revenue Share by Property</h2>
                  <p className="mb-6 text-sm text-muted-foreground">Revenue distribution across properties</p>

                  {/* DATE RANGE FILTER FOR REVENUE SHARE */}
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">From:</label>
                      <input
                        type="date"
                        value={revenueShareDateRange.start.toISOString().split("T")[0]}
                        onChange={(e) => {
                          const newStart = new Date(e.target.value)
                          setRevenueShareDateRange((prev) => ({ ...prev, start: newStart }))
                        }}
                        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-muted-foreground">To:</label>
                      <input
                        type="date"
                        value={revenueShareDateRange.end.toISOString().split("T")[0]}
                        onChange={(e) => {
                          const newEnd = new Date(e.target.value)
                          setRevenueShareDateRange((prev) => ({ ...prev, end: newEnd }))
                        }}
                        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentYear = new Date().getFullYear()
                        setRevenueShareDateRange({
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
                      data={revenueShareData}
                      size={250}
                      innerRadius={60}
                      outerRadius={100}
                      formatValue={(value) => `GMD ${formatCurrency(value)}`}
                    />
                  </div>

                  {/* Legend */}
                  {revenueShareData.length > 0 && (
                    <div className="space-y-2">
                      {revenueShareData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: REVENUE_SHARE_COLORS[index % REVENUE_SHARE_COLORS.length] }}
                            />
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

              {/* Revenue by Rental Type Card */}
              <Card className="border-border bg-card">
                <div className="p-6">
                  <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">Revenue by Rental Type</h2>

                  {/* Horizontal Bar Chart */}
                  <div className="mb-6 space-y-3">
                    {dynamicRevenueByRentalType.map((item) => (
                      <div key={item.type}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{item.type}</span>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">GMD {formatCurrency(item.value)}</p>
                            <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                          </div>
                        </div>
                        <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-full rounded-lg transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Property List with Tagging System */}
                  <div className="border-t border-border pt-4">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Top Revenue Properties by Type</h3>
                    <div className="space-y-4">
                      {/* Short-term properties */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-foreground">Short-term</span>
                        </div>
                        <div className="ml-5 space-y-2">
                          {revenueByPropertyAndType["short-term"].slice(0, 3).map((property) => (
                            <div
                              key={property.propertyId}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                            >
                              <span className="text-sm text-foreground">{property.propertyName}</span>
                              <span className="text-sm font-semibold text-foreground">
                                GMD {formatCurrency(property.revenue)}
                              </span>
                            </div>
                          ))}
                          {revenueByPropertyAndType["short-term"].length === 0 && (
                            <div className="text-sm text-muted-foreground">No properties</div>
                          )}
                        </div>
                      </div>

                      {/* Long-term properties */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <span className="text-sm font-medium text-foreground">Long-term</span>
                        </div>
                        <div className="ml-5 space-y-2">
                          {revenueByPropertyAndType["long-term"].slice(0, 3).map((property) => (
                            <div
                              key={property.propertyId}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                            >
                              <span className="text-sm text-foreground">{property.propertyName}</span>
                              <span className="text-sm font-semibold text-foreground">
                                GMD {formatCurrency(property.revenue)}
                              </span>
                            </div>
                          ))}
                          {revenueByPropertyAndType["long-term"].length === 0 && (
                            <div className="text-sm text-muted-foreground">No properties</div>
                          )}
                        </div>
                      </div>

                      {/* Corporate properties */}
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium text-foreground">Corporate</span>
                        </div>
                        <div className="ml-5 space-y-2">
                          {revenueByPropertyAndType["corporate"].slice(0, 3).map((property) => (
                            <div
                              key={property.propertyId}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                            >
                              <span className="text-sm text-foreground">{property.propertyName}</span>
                              <span className="text-sm font-semibold text-foreground">
                                GMD {formatCurrency(property.revenue)}
                              </span>
                            </div>
                          ))}
                          {revenueByPropertyAndType["corporate"].length === 0 && (
                            <div className="text-sm text-muted-foreground">No properties</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <Card className="border-border bg-card">
                <div className="p-6">
                  <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-sans text-lg font-semibold text-foreground">Payments</h2>
                      <p className="text-sm text-muted-foreground">Track incoming payments across your portfolio</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Select value={paymentPropertyFilter} onValueChange={setPaymentPropertyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Properties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={String(property.id)}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Min Amount"
                      value={paymentAmountMin}
                      onChange={(e) => setPaymentAmountMin(e.target.value)}
                    />

                    <Input
                      type="number"
                      placeholder="Max Amount"
                      value={paymentAmountMax}
                      onChange={(e) => setPaymentAmountMax(e.target.value)}
                    />

                    <Input
                      type="date"
                      placeholder="From Date"
                      value={paymentDateFrom}
                      onChange={(e) => setPaymentDateFrom(e.target.value)}
                    />

                    <Input
                      type="date"
                      placeholder="To Date"
                      value={paymentDateTo}
                      onChange={(e) => setPaymentDateTo(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-muted-foreground">Date</TableHead>
                          <TableHead className="text-muted-foreground">Description</TableHead>
                          <TableHead className="text-muted-foreground">Property</TableHead>
                          <TableHead className="text-right text-muted-foreground">Amount</TableHead>
                          <TableHead className="text-center text-muted-foreground">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecentPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No payments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecentPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-foreground">
                                {new Date(payment.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">{payment.description}</TableCell>
                              <TableCell className="text-foreground">{getPropertyName(payment.property)}</TableCell>
                              <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                                GMD {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={payment.status === "completed" ? "default" : "secondary"}
                                  className={
                                    payment.status === "completed"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                  }
                                >
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab Content */}
          <TabsContent value="expenses" className="space-y-6">
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
                      GMD {formatCurrency(Math.round(ytdExpenses / 12))}
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

              {/* Property Expense Comparison */}
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

                  <div className="mb-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllPropertyExpenseProperties}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </Button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {properties.map((property) => (
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
                        {property.name}
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
                          <TableRow key={property.propertyId}>
                            <TableCell className="font-medium text-foreground">
                              {getPropertyName(property.propertyId)}
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

            {/* Quick Add Expense Form */}
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
                        console.log("[v0] Property selected:", value)
                        setQuickExpenseData((prev) => ({ ...prev, property_id: value }))
                      }}
                      disabled={submittingQuickExpense}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property">
                          {quickExpenseData.property_id === "all"
                            ? "Portfolio Wide"
                            : (() => {
                                // Find if it's a building (property_name) or unit (id)
                                const selectedProperty = properties.find(
                                  (p) => String(p.id) === quickExpenseData.property_id,
                                )
                                if (selectedProperty) {
                                  return selectedProperty.unit_name || selectedProperty.name
                                }
                                // Check if it's a building selection (format: "building:BuildingName")
                                if (quickExpenseData.property_id.startsWith("building:")) {
                                  return quickExpenseData.property_id.replace("building:", "")
                                }
                                return "Select property"
                              })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <SelectItem value="all">Portfolio Wide</SelectItem>

                        {/* Group properties by building */}
                        {(() => {
                          // Create building groups
                          const buildingMap = new Map<string, typeof properties>()
                          const standaloneProperties: typeof properties = []

                          properties.forEach((property) => {
                            if (property.property_name && property.building_id) {
                              // Property belongs to a building
                              if (!buildingMap.has(property.property_name)) {
                                buildingMap.set(property.property_name, [])
                              }
                              buildingMap.get(property.property_name)!.push(property)
                            } else {
                              // Standalone property
                              standaloneProperties.push(property)
                            }
                          })

                          return (
                            <>
                              {/* Render buildings with nested units */}
                              {Array.from(buildingMap.entries()).map(([buildingName, units]) => (
                                <div key={buildingName} className="border-b border-border last:border-0">
                                  {/* Building option - selects all units in building */}
                                  <SelectItem value={`building:${buildingName}`} className="font-semibold bg-muted/50">
                                    {buildingName} (All Units)
                                  </SelectItem>

                                  {/* Individual units within building */}
                                  <div className="pl-4 bg-muted/20">
                                    {units.map((unit) => (
                                      <SelectItem key={unit.id} value={String(unit.id)} className="text-sm">
                                        ↳ {unit.unit_name || unit.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* Render standalone properties */}
                              {standaloneProperties.length > 0 && (
                                <div className="border-t border-border pt-1">
                                  {standaloneProperties.map((property) => (
                                    <SelectItem key={property.id} value={String(property.id)}>
                                      {property.unit_name || property.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              )}
                            </>
                          )
                        })()}
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
                        ? properties.find((p) => p.id === expense.property_id)?.unit_name ||
                          properties.find((p) => p.id === expense.property_id)?.name ||
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
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.name}
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
                            <TableCell className="text-foreground">
                              {new Date(expense.date).toLocaleDateString()}
                            </TableCell>
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
                              {expense.property === "Portfolio Wide"
                                ? "Portfolio Wide"
                                : getPropertyName(expense.property)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                              GMD {formatCurrency(Number.parseFloat(expense.amount))} {/* Parse amount */}
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
          </TabsContent>

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
                          console.log("[v0] Recurring expense property selected:", value)
                          setRecurringExpenseData((prev) => ({ ...prev, property_id: value }))
                        }}
                        disabled={submittingRecurringExpense}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property">
                            {recurringExpenseData.property_id === "all"
                              ? "Portfolio Wide"
                              : (() => {
                                  const selectedProperty = properties.find(
                                    (p) => String(p.id) === recurringExpenseData.property_id,
                                  )
                                  // If a property is found, display its building and unit name.
                                  // Otherwise, default to "Select property".
                                  return selectedProperty
                                    ? `${selectedProperty.property_name} - ${selectedProperty.unit_name}`
                                    : "Select property"
                                })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Portfolio Wide</SelectItem>
                          {(() => {
                            // Group properties by building
                            const groupedProperties = properties.reduce(
                              (acc, property) => {
                                const buildingName = property.property_name || "Ungrouped"
                                if (!acc[buildingName]) {
                                  acc[buildingName] = []
                                }
                                acc[buildingName].push(property)
                                return acc
                              },
                              {} as Record<string, typeof properties>,
                            )

                            return Object.entries(groupedProperties).map(([buildingName, units]) => (
                              <div key={buildingName}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                  {buildingName}
                                </div>
                                {units.map((property) => (
                                  <SelectItem key={property.id} value={String(property.id)} className="pl-6">
                                    {property.unit_name}
                                  </SelectItem>
                                ))}
                              </div>
                            ))
                          })()}
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

          <Dialog open={showEditExpenseModal} onOpenChange={setShowEditExpenseModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-sans text-xl font-semibold">Edit Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditExpenseSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Property</label>
                    <Select
                      value={editExpenseData.property_id}
                      onValueChange={(value) => setEditExpenseData((prev) => ({ ...prev, property_id: value }))}
                      disabled={submittingEditExpense}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property">
                          {editExpenseData.property_id === "all"
                            ? "Portfolio Wide"
                            : (() => {
                                const selectedProperty = properties.find(
                                  (p) => String(p.id) === editExpenseData.property_id,
                                )
                                if (selectedProperty) {
                                  return selectedProperty.unit_name || selectedProperty.name
                                }
                                if (editExpenseData.property_id.startsWith("building:")) {
                                  return editExpenseData.property_id.replace("building:", "")
                                }
                                return "Select property"
                              })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <SelectItem value="all">Portfolio Wide</SelectItem>
                        {(() => {
                          const buildingMap = new Map<string, typeof properties>()
                          const standaloneProperties: typeof properties = []

                          properties.forEach((property) => {
                            if (property.property_name && property.building_id) {
                              if (!buildingMap.has(property.property_name)) {
                                buildingMap.set(property.property_name, [])
                              }
                              buildingMap.get(property.property_name)!.push(property)
                            } else {
                              standaloneProperties.push(property)
                            }
                          })

                          return (
                            <>
                              {Array.from(buildingMap.entries()).map(([buildingName, units]) => (
                                <div key={buildingName} className="border-b border-border last:border-0">
                                  <SelectItem value={`building:${buildingName}`} className="font-semibold bg-muted/50">
                                    {buildingName} (All Units)
                                  </SelectItem>
                                  <div className="pl-4 bg-muted/20">
                                    {units.map((unit) => (
                                      <SelectItem key={unit.id} value={String(unit.id)} className="text-sm">
                                        ↳ {unit.unit_name || unit.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {standaloneProperties.length > 0 && (
                                <div className="border-t border-border pt-1">
                                  {standaloneProperties.map((property) => (
                                    <SelectItem key={property.id} value={String(property.id)}>
                                      {property.unit_name || property.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Category *</label>
                    <Select
                      value={editExpenseData.category}
                      onValueChange={(value) => setEditExpenseData((prev) => ({ ...prev, category: value }))}
                      disabled={submittingEditExpense}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Amount (GMD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editExpenseData.amount}
                      onChange={(e) => setEditExpenseData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                      disabled={submittingEditExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Date *</label>
                    <Input
                      type="date"
                      value={editExpenseData.date}
                      onChange={(e) => setEditExpenseData((prev) => ({ ...prev, date: e.target.value }))}
                      required
                      disabled={submittingEditExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Description</label>
                    <Input
                      type="text"
                      value={editExpenseData.description}
                      onChange={(e) => setEditExpenseData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      disabled={submittingEditExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Vendor</label>
                    <Input
                      type="text"
                      value={editExpenseData.vendor}
                      onChange={(e) => setEditExpenseData((prev) => ({ ...prev, vendor: e.target.value }))}
                      placeholder="Vendor name"
                      disabled={submittingEditExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Payment Method</label>
                    <Select
                      value={editExpenseData.payment_method}
                      onValueChange={(value) => setEditExpenseData((prev) => ({ ...prev, payment_method: value }))}
                      disabled={submittingEditExpense}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditExpenseModal(false)}
                    disabled={submittingEditExpense}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingEditExpense}>
                    {submittingEditExpense ? "Updating..." : "Update Expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditRecurringModal} onOpenChange={setShowEditRecurringModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-sans text-xl font-semibold">Edit Recurring Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditRecurringExpenseSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Property</label>
                    <Select
                      value={editRecurringExpenseData.property_id}
                      onValueChange={(value) =>
                        setEditRecurringExpenseData((prev) => ({ ...prev, property_id: value }))
                      }
                      disabled={submittingEditRecurringExpense}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property">
                          {editRecurringExpenseData.property_id === "all"
                            ? "Portfolio Wide"
                            : (() => {
                                const selectedProperty = properties.find(
                                  (p) => String(p.id) === editRecurringExpenseData.property_id,
                                )
                                if (selectedProperty) {
                                  return selectedProperty.unit_name || selectedProperty.name
                                }
                                if (editRecurringExpenseData.property_id.startsWith("building:")) {
                                  return editRecurringExpenseData.property_id.replace("building:", "")
                                }
                                return "Select property"
                              })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        <SelectItem value="all">Portfolio Wide</SelectItem>
                        {(() => {
                          const buildingMap = new Map<string, typeof properties>()
                          const standaloneProperties: typeof properties = []

                          properties.forEach((property) => {
                            if (property.property_name && property.building_id) {
                              if (!buildingMap.has(property.property_name)) {
                                buildingMap.set(property.property_name, [])
                              }
                              buildingMap.get(property.property_name)!.push(property)
                            } else {
                              standaloneProperties.push(property)
                            }
                          })

                          return (
                            <>
                              {Array.from(buildingMap.entries()).map(([buildingName, units]) => (
                                <div key={buildingName} className="border-b border-border last:border-0">
                                  <SelectItem value={`building:${buildingName}`} className="font-semibold bg-muted/50">
                                    {buildingName} (All Units)
                                  </SelectItem>
                                  <div className="pl-4 bg-muted/20">
                                    {units.map((unit) => (
                                      <SelectItem key={unit.id} value={String(unit.id)} className="text-sm">
                                        ↳ {unit.unit_name || unit.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {standaloneProperties.length > 0 && (
                                <div className="border-t border-border pt-1">
                                  {standaloneProperties.map((property) => (
                                    <SelectItem key={property.id} value={String(property.id)}>
                                      {property.unit_name || property.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Category *</label>
                    <Select
                      value={editRecurringExpenseData.category}
                      onValueChange={(value) => setEditRecurringExpenseData((prev) => ({ ...prev, category: value }))}
                      disabled={submittingEditRecurringExpense}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Amount (GMD) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editRecurringExpenseData.amount}
                      onChange={(e) => setEditRecurringExpenseData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                      disabled={submittingEditRecurringExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Frequency *</label>
                    <Select
                      value={editRecurringExpenseData.recurring_frequency}
                      onValueChange={(value) =>
                        setEditRecurringExpenseData((prev) => ({ ...prev, recurring_frequency: value }))
                      }
                      disabled={submittingEditRecurringExpense}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Next Due Date *</label>
                    <Input
                      type="date"
                      value={editRecurringExpenseData.date}
                      onChange={(e) => setEditRecurringExpenseData((prev) => ({ ...prev, date: e.target.value }))}
                      required
                      disabled={submittingEditRecurringExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Description *</label>
                    <Input
                      type="text"
                      value={editRecurringExpenseData.description}
                      onChange={(e) =>
                        setEditRecurringExpenseData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Brief description"
                      required
                      disabled={submittingEditRecurringExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Vendor</label>
                    <Input
                      type="text"
                      value={editRecurringExpenseData.vendor}
                      onChange={(e) => setEditRecurringExpenseData((prev) => ({ ...prev, vendor: e.target.value }))}
                      placeholder="Vendor name"
                      disabled={submittingEditRecurringExpense}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Payment Method</label>
                    <Select
                      value={editRecurringExpenseData.payment_method}
                      onValueChange={(value) =>
                        setEditRecurringExpenseData((prev) => ({ ...prev, payment_method: value }))
                      }
                      disabled={submittingEditRecurringExpense}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditRecurringModal(false)}
                    disabled={submittingEditRecurringExpense}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingEditRecurringExpense}>
                    {submittingEditRecurringExpense ? "Updating..." : "Update Recurring Expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Category Modal */}
          <AddCategoryModal
            open={showAddCategoryModal}
            onOpenChange={setShowAddCategoryModal}
            onCategoryAdded={() => {
              fetchExpenseCategories()
            }}
          />
        </Tabs>
      </div>
    </MinimumLoadingWrapper>
  )
}
