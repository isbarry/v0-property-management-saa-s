"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MinimumLoadingWrapper } from "@/components/ui/minimum-loading-wrapper"
import FinancialsLoading from "./loading"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, Tooltip, ResponsiveContainer } from "recharts"
import { FileDown, ArrowUpRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// REMOVED "revenue" from FinancialsTab type
type FinancialsTab = "overview" | "expenses"

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
  // REMOVED setSelectedRevenueShareProperties state
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

  const handleSelectAllOccupancyProperties = useCallback(() => {
    // Clear both selectedOccupancyProperties and selectedOccupancyUnits
    // This ensures "All Properties" shows all data
    setSelectedOccupancyProperties(new Set())
    setSelectedOccupancyUnits(new Set())
  }, [])

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
          const totalNights = 0 // To potentially calculate an average ADR
          buildingUnits.forEach((unit: any) => {
            totalRevenue += item.properties[unit.id] || 0
            // Assuming item.nights[unit.id] exists and represents nights stayed for that unit
            // totalNights += item.nights[unit.id] || 0
          })
          // const aggregatedADR = totalNights > 0 ? totalRevenue / totalNights : 0
          const aggregatedRevenue = totalRevenue
          dataPoint[selectedRevenueBuilding] = aggregatedRevenue
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
          const totalNights = 0
          properties.forEach((property: any) => {
            totalRevenue += item.properties[property.id] || 0
            // totalNights += item.nights[property.id] || 0
          })
          // const aggregatedADR = totalNights > 0 ? totalRevenue / totalNights : 0
          const aggregatedRevenue = totalRevenue
          dataPoint.total = aggregatedRevenue
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
    console.log("[v0] Occupancy Timeline - Raw data:", {
      hasData: !!occupancyRateData,
      dataLength: occupancyRateData?.length || 0,
      sampleData: occupancyRateData?.[0],
      propertiesCount: properties.length,
      selectedProperties: Array.from(selectedOccupancyProperties),
      selectedUnits: Array.from(selectedOccupancyUnits),
    })

    if (!occupancyRateData || occupancyRateData.length === 0) {
      console.log("[v0] Occupancy Timeline - No data available")
      return []
    }

    // If no properties or units are selected, show all data
    if (selectedOccupancyProperties.size === 0 && selectedOccupancyUnits.size === 0) {
      const result = occupancyRateData.map((item) => {
        const dataPoint: any = { month: item.month, isFuture: item.isFuture }
        properties.forEach((property: any) => {
          dataPoint[property.unit_name || property.name] = item.properties[property.id] || 0
        })
        return dataPoint
      })
      console.log("[v0] Occupancy Timeline - Showing all data:", {
        resultLength: result.length,
        samplePoint: result[0],
      })
      return result
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
      const result = occupancyRateData.map((item) => {
        const dataPoint: any = { month: item.month, isFuture: item.isFuture }
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
      console.log("[v0] Occupancy Timeline - Aggregated by property:", {
        resultLength: result.length,
        samplePoint: result[0],
      })
      return result
    }

    // Otherwise, show individual unit data for the selected units
    const result = occupancyRateData.map((item) => {
      const dataPoint: any = { month: item.month, isFuture: item.isFuture }
      selectedOccupancyUnits.forEach((unitId) => {
        const unit = properties.find((p) => p.id === unitId)
        if (unit) {
          const occupancyValue = item.properties[unitId] || 0
          dataPoint[unit.unit_name || unit.name] = occupancyValue
        }
      })
      return dataPoint
    })
    console.log("[v0] Occupancy Timeline - Individual units:", {
      resultLength: result.length,
      samplePoint: result[0],
    })
    return result
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
        setSelectedOccupancyUnits(new Set()) // Clear unit selections
        setSelectedOccupancyProperties(new Set()) // Clear property selections
      } else {
        setSelectedOccupancyBuilding(buildingName)
        const buildingUnits = occupancyBuildingGroups.get(buildingName) || []
        setSelectedOccupancyUnits(new Set(buildingUnits.map((u: any) => u.id)))
        // Add the building name to selectedOccupancyProperties to trigger property-level aggregation
        setSelectedOccupancyProperties(new Set([buildingName]))
      }
    },
    [selectedOccupancyBuilding, occupancyBuildingGroups],
  )

  const toggleOccupancyUnit = useCallback(
    (unitId: number) => {
      setSelectedOccupancyUnits((prev) => {
        const newSelectedUnits = new Set(prev)
        if (newSelectedUnits.has(unitId)) {
          // Remove unit
          newSelectedUnits.delete(unitId)
        } else {
          // Add unit
          newSelectedUnits.add(unitId)
        }

        // If building is selected and all units are now deselected, reset building
        if (selectedOccupancyBuilding !== "all" && newSelectedUnits.size === 0) {
          setSelectedOccupancyBuilding("all")
        } else if (selectedOccupancyBuilding !== "all") {
          // If a unit is deselected from a building, the building should reflect partial selection
          const buildingUnits = occupancyBuildingGroups.get(selectedOccupancyBuilding) || []
          const allUnitsSelected = buildingUnits.every((u: any) => newSelectedUnits.has(u.id))
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

  // Define the handler functions for the lint errors
  const handleSelectAllProfitProperties = useCallback(() => {
    if (selectedProfitProperties.size === 0 || selectedProfitProperties.size === propertyGroups.size) {
      setSelectedProfitProperties(new Set())
    } else {
      setSelectedProfitProperties(new Set(propertyGroups.keys()))
    }
  }, [propertyGroups, selectedProfitProperties])

  const handleProfitPropertyToggle = useCallback((propertyName: string) => {
    setSelectedProfitProperties((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
      } else {
        newSelected.add(propertyName)
      }
      return newSelected
    })
  }, [])

  const handleProfitUnitToggle = useCallback((unitId: number) => {
    setSelectedProfitUnits((prev) => {
      const newSelectedUnits = new Set(prev)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      return newSelectedUnits
    })
  }, [])

  const handleSelectAllTransactionProperties = useCallback(() => {
    if (selectedTransactionProperties.size === 0 || selectedTransactionProperties.size === propertyGroups.size) {
      setSelectedTransactionProperties(new Set())
    } else {
      setSelectedTransactionProperties(new Set(propertyGroups.keys()))
    }
  }, [propertyGroups, selectedTransactionProperties])

  const handleTransactionPropertyToggle = useCallback((propertyName: string) => {
    setSelectedTransactionProperties((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(propertyName)) {
        newSelected.delete(propertyName)
      } else {
        newSelected.add(propertyName)
      }
      return newSelected
    })
  }, [])

  const handleTransactionUnitToggle = useCallback((unitId: number) => {
    setSelectedTransactionUnits((prev) => {
      const newSelectedUnits = new Set(prev)
      if (newSelectedUnits.has(unitId)) {
        newSelectedUnits.delete(unitId)
      } else {
        newSelectedUnits.add(unitId)
      }
      return newSelectedUnits
    })
  }, [])

  return (
    <MinimumLoadingWrapper skeleton={<FinancialsLoading />} delay={1000}>
      <div className="space-y-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-sans text-3xl font-bold text-foreground">Financials Overview</h1>
          </div>

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

          {/* Occupancy Rate Timeline */}
          <Card className="border-border bg-card">
            <div className="p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-sans text-lg font-semibold text-foreground">Occupancy Rate Timeline</h2>
                  <p className="text-sm text-muted-foreground">Track occupancy trends across your properties</p>
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

              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Filter by property:</p>
                </div>

                {/* Level 1: Buildings + All Properties */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSelectAllOccupancyProperties}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selectedOccupancyProperties.size === 0 && selectedOccupancyUnits.size === 0
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    )}
                  >
                    All Properties
                  </button>

                  {Array.from(occupancyBuildingGroups.entries()).map(([buildingName, units]) => {
                    const allUnitsSelected = units.every((unit: any) => selectedOccupancyUnits.has(unit.id))
                    const someUnitsSelected = units.some((unit: any) => selectedOccupancyUnits.has(unit.id))

                    return (
                      <button
                        key={buildingName}
                        onClick={() => toggleOccupancyBuilding(buildingName)}
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
                {selectedOccupancyBuilding && occupancyBuildingGroups.get(selectedOccupancyBuilding) && (
                  <div className="flex flex-wrap items-center gap-2 border-l-2 border-blue-500 pl-4">
                    <span className="text-xs font-medium text-muted-foreground">Units:</span>
                    {occupancyBuildingGroups.get(selectedOccupancyBuilding)?.map((unit: any) => (
                      <button
                        key={unit.id}
                        onClick={() => toggleOccupancyUnit(unit.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selectedOccupancyUnits.has(unit.id)
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
                  {(() => {
                    if (selectedOccupancyBuilding && selectedOccupancyBuilding !== "all") {
                      const buildingUnits = occupancyBuildingGroups.get(selectedOccupancyBuilding) || []
                      const allUnitsSelected = buildingUnits.every((unit: any) => selectedOccupancyUnits.has(unit.id))

                      if (allUnitsSelected) {
                        return (
                          <Line
                            key={selectedOccupancyBuilding}
                            type="monotone"
                            dataKey={selectedOccupancyBuilding}
                            stroke={propertyColors[0]}
                            strokeWidth={2}
                            strokeOpacity={1}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={propertyColors[0]}
                                  opacity={payload?.isFuture ? 0.4 : 1}
                                  stroke={propertyColors[0]}
                                  strokeWidth={payload?.isFuture ? 1 : 0}
                                  strokeDasharray={payload?.isFuture ? "2,2" : "0"}
                                />
                              )
                            }}
                            strokeDasharray={undefined}
                          />
                        )
                      } else {
                        // Show individual unit lines for the selected building
                        return Array.from(selectedOccupancyUnits)
                          .filter((unitId) => buildingUnits.some((unit: any) => unit.id === unitId))
                          .map((unitId, index) => {
                            const unit = properties.find((p) => p.id === unitId)
                            if (!unit) return null
                            return (
                              <Line
                                key={unitId}
                                type="monotone"
                                dataKey={unit.unit_name}
                                stroke={propertyColors[index % propertyColors.length]}
                                strokeWidth={2}
                                strokeOpacity={1}
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={4}
                                      fill={propertyColors[index % propertyColors.length]}
                                      opacity={payload?.isFuture ? 0.4 : 1}
                                      stroke={propertyColors[index % propertyColors.length]}
                                      strokeWidth={payload?.isFuture ? 1 : 0}
                                      strokeDasharray={payload?.isFuture ? "2,2" : "0"}
                                    />
                                  )
                                }}
                                strokeDasharray={undefined}
                              />
                            )
                          })
                      }
                    } else if (selectedOccupancyUnits.size > 0) {
                      // Show individual unit lines for selected units across different buildings
                      return Array.from(selectedOccupancyUnits).map((unitId, index) => {
                        const unit = properties.find((p) => p.id === unitId)
                        if (!unit) return null
                        return (
                          <Line
                            key={unitId}
                            type="monotone"
                            dataKey={unit.unit_name}
                            stroke={propertyColors[index % propertyColors.length]}
                            strokeWidth={2}
                            strokeOpacity={1}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={4}
                                  fill={propertyColors[index % propertyColors.length]}
                                  opacity={payload?.isFuture ? 0.4 : 1}
                                  stroke={propertyColors[index % propertyColors.length]}
                                  strokeWidth={payload?.isFuture ? 1 : 0}
                                  strokeDasharray={payload?.isFuture ? "2,2" : "0"}
                                />
                              )
                            }}
                            strokeDasharray={undefined}
                          />
                        )
                      })
                    } else {
                      // Default: Show all properties if no specific building or units are selected
                      // Note: This part might need adjustment based on how "All Properties" is handled
                      // If "All Properties" means showing individual lines for all units, the logic below handles it
                      const allUnits = properties.map((p) => p.id)
                      return allUnits.map((unitId, index) => {
                        const unit = properties.find((p) => p.id === unitId)
                        if (!unit) return null
                        return (
                          <Line
                            key={unitId}
                            type="monotone"
                            dataKey={unit.unit_name}
                            stroke={propertyColors[index % propertyColors.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        )
                      })
                    }
                  })()}
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
                          {transaction.type === "payment" ? "+" : "-"}GMD {formatCurrency(Math.abs(transaction.amount))}
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
        </div>

        {/* Tabs component removed */}
      </div>
    </MinimumLoadingWrapper>
  )
}
