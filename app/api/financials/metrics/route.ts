import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const adrStartDate = searchParams.get("adrStartDate")
    const adrEndDate = searchParams.get("adrEndDate")
    const revenueStartDate = searchParams.get("revenueStartDate")
    const revenueEndDate = searchParams.get("revenueEndDate")
    const propertyExpenseStartDate = searchParams.get("propertyExpenseStartDate")
    const propertyExpenseEndDate = searchParams.get("propertyExpenseEndDate")

    console.log("[v0] Date parameters received:", {
      adrStartDate,
      adrEndDate,
      revenueStartDate,
      revenueEndDate,
      propertyExpenseStartDate,
      propertyExpenseEndDate,
    })

    // Parse dates or use defaults (current year)
    const currentYear = new Date().getUTCFullYear()
    const adrStart = adrStartDate ? new Date(adrStartDate) : new Date(Date.UTC(currentYear, 0, 1))
    const adrEnd = adrEndDate ? new Date(adrEndDate) : new Date(Date.UTC(currentYear, 11, 31))
    const revenueStart = revenueStartDate ? new Date(revenueStartDate) : new Date(Date.UTC(currentYear, 0, 1))
    const revenueEnd = revenueEndDate ? new Date(revenueEndDate) : new Date(Date.UTC(currentYear, 11, 31))
    const propertyExpenseStart = propertyExpenseStartDate
      ? new Date(propertyExpenseStartDate)
      : new Date(Date.UTC(currentYear, 0, 1))
    const propertyExpenseEnd = propertyExpenseEndDate
      ? new Date(propertyExpenseEndDate)
      : new Date(Date.UTC(currentYear, 11, 31))

    const properties = await query(
      `SELECT 
        p.id, 
        p.unit_name, 
        p.rental_type, 
        p.building_id, 
        p.location_id,
        COALESCE(b.name, p.unit_name) as property_name
      FROM properties p
      LEFT JOIN buildings b ON p.building_id = b.id
      WHERE p.user_id = $1 
      ORDER BY p.unit_name`,
      [user.id],
    )

    const reservations = await query(
      `SELECT 
        r.id, r.property_id, r.check_in, r.check_out, 
        r.total_amount, r.paid_amount, r.status, r.number_of_guests,
        r.reservation_type,
        p.unit_name, p.rental_type,
        COALESCE(b.name, p.unit_name) as property_name
      FROM reservations r
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN buildings b ON p.building_id = b.id
      WHERE r.user_id = $1
      ORDER BY r.check_in DESC`,
      [user.id],
    )

    console.log("[v0] Fetched reservations count:", reservations.length)
    console.log("[v0] Sample reservation:", reservations[0])

    const expenses = await query(
      `SELECT 
        e.id, e.property_id, e.category, e.amount, e.expense_date,
        e.description, e.vendor, e.status, e.is_recurring, e.recurring_frequency,
        p.unit_name,
        COALESCE(b.name, p.unit_name) as property_name
      FROM expenses e
      LEFT JOIN properties p ON e.property_id = p.id
      LEFT JOIN buildings b ON p.building_id = b.id
      WHERE e.user_id = $1
      ORDER BY e.expense_date DESC`,
      [user.id],
    )

    // Get all payments
    const payments = await query(
      `SELECT 
        p.id, p.property_id, p.reservation_id, p.amount, p.payment_date,
        p.payment_type, p.payment_method, p.status,
        pr.unit_name,
        COALESCE(b.name, pr.unit_name) as property_name
      FROM payments p
      LEFT JOIN properties pr ON p.property_id = pr.id
      LEFT JOIN buildings b ON pr.building_id = b.id
      WHERE p.user_id = $1
      ORDER BY p.payment_date DESC`,
      [user.id],
    )

    // Calculate YTD metrics
    const ytdRevenue = reservations
      .filter((r: any) => {
        const checkInYear = new Date(r.check_in).getUTCFullYear()
        return checkInYear === currentYear
      })
      .reduce((sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0), 0)

    const ytdExpenses = expenses
      .filter((e: any) => {
        const expenseYear = new Date(e.expense_date).getUTCFullYear()
        const isPaidOrCompleted = e.status === "paid" || e.status === "completed"
        return expenseYear === currentYear && isPaidOrCompleted
      })
      .reduce((sum: number, e: any) => sum + Number.parseFloat(e.amount || 0), 0)

    console.log("[v0] YTD Expenses calculation:", {
      totalExpenses: expenses.length,
      currentYearExpenses: expenses.filter((e: any) => {
        const expenseYear = new Date(e.expense_date).getUTCFullYear()
        const isPaidOrCompleted = e.status === "paid" || e.status === "completed"
        return expenseYear === currentYear && isPaidOrCompleted
      }).length,
      ytdExpenses,
    })

    const ytdProfit = ytdRevenue - ytdExpenses

    const revenueByMonth = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Date.UTC(currentYear, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      const monthRevenue = reservations
        .filter((r: any) => {
          const checkIn = new Date(r.check_in)
          return checkIn.getUTCFullYear() === currentYear && checkIn.getUTCMonth() === i
        })
        .reduce((sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0), 0)

      return { month, revenue: monthRevenue }
    })

    const expensesByMonth = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Date.UTC(currentYear, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      const monthExpenses = expenses
        .filter((e: any) => {
          const expenseDate = new Date(e.expense_date)
          const isPaidOrCompleted = e.status === "paid" || e.status === "completed"
          return expenseDate.getUTCFullYear() === currentYear && expenseDate.getUTCMonth() === i && isPaidOrCompleted
        })
        .reduce((sum: number, e: any) => sum + Number.parseFloat(e.amount || 0), 0)

      return { month, expenses: monthExpenses }
    })

    const propertyPerformanceMetrics = properties.map((p: any) => {
      const propertyReservations = reservations.filter((r: any) => r.property_id === p.id)
      const propertyRevenue = propertyReservations.reduce(
        (sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0),
        0,
      )
      const propertyExpenses = expenses
        .filter((e: any) => {
          const isPaidOrCompleted = e.status === "paid" || e.status === "completed"
          return e.property_id === p.id && isPaidOrCompleted
        })
        .reduce((sum: number, e: any) => sum + Number.parseFloat(e.amount || 0), 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison

      const yearStart = new Date(Date.UTC(currentYear, 0, 1))
      const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59))

      // Only include reservations that have started (check_in < today)
      const pastAndCurrentReservations = propertyReservations.filter((r: any) => {
        const checkIn = new Date(r.check_in)
        return checkIn < today
      })

      const occupiedDays = pastAndCurrentReservations.reduce((sum: number, r: any) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)

        // Calculate overlap with current year
        const overlapStart = checkIn > yearStart ? checkIn : yearStart
        const overlapEnd = checkOut < yearEnd ? checkOut : yearEnd

        // For current year, only count days up to today
        const effectiveEnd = overlapEnd > today ? today : overlapEnd

        // Calculate days in the overlap period
        const daysInOverlap = Math.ceil((effectiveEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))

        return sum + Math.max(0, daysInOverlap)
      }, 0)

      // Calculate days elapsed in the year so far (not full 365 days)
      const daysElapsedInYear = Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
      const occupancy = daysElapsedInYear > 0 ? (occupiedDays / daysElapsedInYear) * 100 : 0

      const totalNights = propertyReservations.reduce((sum: number, r: any) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      }, 0)
      const adr = totalNights > 0 ? propertyRevenue / totalNights : 0

      const daysInYear = 365
      const revPAR = propertyRevenue / daysInYear

      return {
        propertyId: p.id,
        propertyName: p.unit_name,
        buildingName: p.building_id ? p.property_name : null,
        unitName: p.building_id ? p.unit_name : null,
        revenue: propertyRevenue,
        expenses: propertyExpenses,
        profit: propertyRevenue - propertyExpenses,
        occupancy: Math.round(occupancy),
        reservations: propertyReservations.length,
        adr: Math.round(adr),
        revPAR: Math.round(revPAR),
      }
    })

    const revenueTimelineData = (() => {
      const data = []
      const start = new Date(Date.UTC(revenueStart.getUTCFullYear(), revenueStart.getUTCMonth(), 1))
      const end = new Date(Date.UTC(revenueEnd.getUTCFullYear(), revenueEnd.getUTCMonth() + 1, 0))

      console.log("[v0] Revenue timeline generation:", {
        start: start.toISOString(),
        end: end.toISOString(),
        startMonth: start.getUTCMonth(),
        endMonth: end.getUTCMonth(),
      })

      let currentDate = new Date(start)
      let monthCount = 0

      while (currentDate <= end) {
        const year = currentDate.getUTCFullYear()
        const month = currentDate.getUTCMonth()
        const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        })

        if (monthCount < 3) {
          console.log("[v0] Generating month:", {
            monthCount,
            monthName,
            month,
            year,
            currentDate: currentDate.toISOString(),
          })
        }

        const monthStart = new Date(Date.UTC(year, month, 1))
        const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
        const propertiesData: Record<string, number> = {}

        properties.forEach((p: any) => {
          // Filter reservations that overlap with this month
          const monthReservations = reservations.filter((r: any) => {
            const checkIn = new Date(r.check_in)
            const checkOut = new Date(r.check_out)
            // Reservation overlaps if it starts before month ends and ends after month starts
            return r.property_id === p.id && checkIn <= monthEnd && checkOut >= monthStart
          })

          let totalRevenue = 0

          monthReservations.forEach((r: any) => {
            const checkIn = new Date(r.check_in)
            const checkOut = new Date(r.check_out)
            const totalReservationNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

            // Calculate nights that fall within this month
            const overlapStart = checkIn > monthStart ? checkIn : monthStart
            const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd
            const nightsInMonth = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))

            // Calculate proportional revenue for this month
            const paidAmount = Number.parseFloat(r.paid_amount || 0)
            const revenuePerNight = paidAmount / totalReservationNights
            const monthRevenue = revenuePerNight * nightsInMonth

            totalRevenue += monthRevenue
          })

          propertiesData[p.id] = totalRevenue
        })

        data.push({ month: monthName, properties: propertiesData })

        currentDate = new Date(Date.UTC(year, month + 1, 1))
        monthCount++
      }

      console.log("[v0] Total months generated for revenue timeline:", data.length)
      console.log("[v0] First month:", data[0]?.month, "Last month:", data[data.length - 1]?.month)

      return data
    })()

    const ADRData = (() => {
      const data = []
      const start = new Date(Date.UTC(adrStart.getUTCFullYear(), adrStart.getUTCMonth(), 1))
      const end = new Date(Date.UTC(adrEnd.getUTCFullYear(), adrEnd.getUTCMonth() + 1, 0))

      let currentDate = new Date(start)

      while (currentDate <= end) {
        const year = currentDate.getUTCFullYear()
        const month = currentDate.getUTCMonth()
        const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        })
        const monthStart = new Date(Date.UTC(year, month, 1))
        const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
        const propertiesADR: Record<string, number> = {}

        properties.forEach((p: any) => {
          // Filter reservations that overlap with this month
          const monthReservations = reservations.filter((r: any) => {
            const checkIn = new Date(r.check_in)
            const checkOut = new Date(r.check_out)
            // Reservation overlaps if it starts before month ends and ends after month starts
            const overlaps = r.property_id === p.id && checkIn <= monthEnd && checkOut >= monthStart

            return overlaps
          })

          let totalRevenue = 0
          let totalNights = 0

          monthReservations.forEach((r: any) => {
            const checkIn = new Date(r.check_in)
            const checkOut = new Date(r.check_out)
            const totalReservationNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

            // Calculate nights that fall within this month
            const overlapStart = checkIn > monthStart ? checkIn : monthStart
            const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd
            const nightsInMonth = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))

            // ADR should be based on the rate charged, not what's been paid
            const totalAmount = Number.parseFloat(r.total_amount || 0)
            const revenuePerNight = totalAmount / totalReservationNights
            const monthRevenue = revenuePerNight * nightsInMonth

            totalRevenue += monthRevenue
            totalNights += nightsInMonth
          })

          propertiesADR[p.id] = totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0
        })

        data.push({ month: monthName, properties: propertiesADR })

        currentDate = new Date(Date.UTC(year, month + 1, 1))
      }

      return data
    })()

    const occupancyRateData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Date.UTC(currentYear, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      const monthStart = new Date(Date.UTC(currentYear, i, 1))
      const monthEnd = new Date(Date.UTC(currentYear, i + 1, 0, 23, 59, 59))
      const daysInMonth = new Date(Date.UTC(currentYear, i + 1, 0)).getDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const currentMonth = today.getUTCMonth()
      const currentYearCheck = today.getUTCFullYear()
      const isFuture = currentYear > currentYearCheck || (currentYear === currentYearCheck && i > currentMonth)
      const isCurrent = currentYear === currentYearCheck && i === currentMonth

      const propertiesOccupancy: Record<string, number> = {}

      if (i === 0) {
        console.log("[v0] Occupancy calculation - Today:", today.toISOString())
        console.log("[v0] Occupancy calculation - Total reservations:", reservations.length)
      }

      properties.forEach((p: any) => {
        const monthReservations = reservations.filter((r: any) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)
          const overlaps = checkIn <= monthEnd && checkOut >= monthStart
          const matches = r.property_id === p.id && overlaps

          return matches
        })

        // Calculate occupied days that fall within this month
        const occupiedDays = monthReservations.reduce((sum: number, r: any) => {
          const checkIn = new Date(r.check_in)
          const checkOut = new Date(r.check_out)

          const overlapStart = checkIn > monthStart ? checkIn : monthStart
          const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd

          const effectiveEnd = isCurrent ? (overlapEnd > today ? today : overlapEnd) : overlapEnd

          const daysInOverlap = Math.ceil((effectiveEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))

          return sum + Math.max(0, daysInOverlap)
        }, 0)

        const effectiveDaysInMonth = isCurrent
          ? Math.ceil((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
          : daysInMonth

        propertiesOccupancy[p.id] =
          effectiveDaysInMonth > 0 ? Math.min(100, (occupiedDays / effectiveDaysInMonth) * 100) : 0
      })

      return { month, properties: propertiesOccupancy, isFuture, isCurrent }
    })

    console.log("[v0] Occupancy Rate Data generated:", {
      totalMonths: occupancyRateData.length,
      sampleMonth: occupancyRateData[0],
      propertiesCount: properties.length,
      reservationsCount: reservations.length,
    })

    const expenseTrendData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Date.UTC(currentYear, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      return { month }
    })

    const propertyExpenseComparison = properties
      .map((p: any) => {
        console.log("[v0] Processing property:", p.unit_name, "ID:", p.id)
        console.log("[v0] Date range for filtering:", {
          start: propertyExpenseStart.toISOString(),
          end: propertyExpenseEnd.toISOString(),
        })

        // Filter expenses by property and date range
        const propertyExpenses = expenses.filter((e: any) => {
          if (e.property_id !== p.id) return false
          const expenseDate = new Date(e.expense_date)
          const isPaidOrCompleted = e.status === "paid" || e.status === "completed"

          console.log("[v0] Checking expense:", {
            id: e.id,
            property_id: e.property_id,
            expense_date: e.expense_date,
            expenseDateParsed: expenseDate.toISOString(),
            amount: e.amount,
            status: e.status,
            isPaidOrCompleted,
            isAfterStart: expenseDate >= propertyExpenseStart,
            isBeforeEnd: expenseDate <= propertyExpenseEnd,
            included: expenseDate >= propertyExpenseStart && expenseDate <= propertyExpenseEnd && isPaidOrCompleted,
          })

          return expenseDate >= propertyExpenseStart && expenseDate <= propertyExpenseEnd && isPaidOrCompleted
        })

        console.log("[v0] Filtered expenses for property:", p.unit_name, "Count:", propertyExpenses.length)

        const categoryBreakdown: Record<string, number> = {}
        let totalExpenses = 0

        propertyExpenses.forEach((e: any) => {
          const amount = Number.parseFloat(e.amount || 0)
          categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amount
          totalExpenses += amount
        })

        // Calculate number of months in the date range
        const monthsDiff =
          (propertyExpenseEnd.getUTCFullYear() - propertyExpenseStart.getUTCFullYear()) * 12 +
          (propertyExpenseEnd.getUTCMonth() - propertyExpenseStart.getUTCMonth()) +
          1
        const avgExpensePerMonth = monthsDiff > 0 ? totalExpenses / monthsDiff : 0

        return {
          propertyId: p.id,
          propertyName: p.unit_name,
          buildingName: p.property_name,
          totalExpenses,
          avgExpensePerMonth,
          ...categoryBreakdown,
        }
      })
      .sort((a, b) => b.totalExpenses - a.totalExpenses) // Sort by total expenses (highest to lowest)

    const revenueByProperty = properties.map((p: any) => {
      const propertyRevenue = reservations
        .filter((r: any) => r.property_id === p.id)
        .reduce((sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0), 0)

      return {
        propertyId: p.id,
        propertyName: p.unit_name,
        revenue: propertyRevenue,
      }
    })

    const rentalTypes = ["short-term", "long-term", "corporate"]
    const revenueByRentalType = rentalTypes.map((type) => {
      const typeRevenue = reservations
        .filter((r: any) => r.reservation_type === type)
        .reduce((sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0), 0)

      const totalRevenue = reservations.reduce((sum: number, r: any) => sum + Number.parseFloat(r.paid_amount || 0), 0)

      return {
        type,
        value: typeRevenue,
        percentage: totalRevenue > 0 ? ((typeRevenue / totalRevenue) * 100).toFixed(1) : "0",
      }
    })

    console.log("[v0] Revenue by rental type:", revenueByRentalType)
    console.log("[v0] Total reservations:", reservations.length)
    console.log("[v0] Reservations by type:", {
      "short-term": reservations.filter((r: any) => r.reservation_type === "short-term").length,
      "long-term": reservations.filter((r: any) => r.reservation_type === "long-term").length,
      corporate: reservations.filter((r: any) => r.reservation_type === "corporate").length,
    })

    const profitLossData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(Date.UTC(currentYear, i, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" })
      const monthRevenue = revenueByMonth[i].revenue
      const monthExpenses = expensesByMonth[i].expenses
      const profit = monthRevenue - monthExpenses

      return {
        month,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit,
      }
    })

    const transactionHistory = [
      ...payments.map((p: any) => ({
        id: p.id,
        date: p.payment_date,
        type: "payment",
        property: p.property_id,
        propertyName: p.unit_name || "Unknown",
        category: p.payment_type,
        description: `${p.payment_type} payment for ${p.unit_name || "Unknown"}`,
        amount: Number.parseFloat(p.amount || 0),
        status: p.status,
      })),
      ...reservations
        .filter((r: any) => Number.parseFloat(r.paid_amount || 0) > 0)
        .map((r: any) => ({
          id: `res-${r.id}`,
          date: r.check_in,
          type: "payment",
          property: r.property_id,
          propertyName: r.unit_name || "Unknown",
          category: r.reservation_type || "rental",
          description: `Payment for ${r.reservation_type || "rental"} reservation at ${r.unit_name || "Unknown"}`,
          amount: Number.parseFloat(r.paid_amount || 0),
          status: r.status,
        })),
      ...expenses.map((e: any) => ({
        id: e.id,
        date: e.expense_date,
        type: "expense",
        property: e.property_id,
        propertyName: e.unit_name || "Unknown",
        buildingName: e.property_name,
        category: e.category,
        amount: -Number.parseFloat(e.amount || 0),
        vendor: e.vendor,
        description: e.description,
        status: e.status,
        isRecurring: e.is_recurring,
        recurringFrequency: e.recurring_frequency,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const propertyRentalTypes: Record<string, string> = {}
    properties.forEach((p: any) => {
      propertyRentalTypes[p.id] = p.rental_type || "short-term"
    })

    const formattedExpenses = expenses.map((e: any) => ({
      id: e.id,
      property: e.property_id,
      propertyName: e.unit_name || "Unknown",
      buildingName: e.property_name,
      category: e.category,
      amount: Number.parseFloat(e.amount || 0),
      date: e.expense_date,
      vendor: e.vendor,
      description: e.description,
      status: e.status,
      isRecurring: e.is_recurring,
      recurringFrequency: e.recurring_frequency,
    }))

    const recurringExpenses = expenses
      .filter((e: any) => e.is_recurring === true)
      .map((e: any) => ({
        id: e.id,
        description: e.description,
        property_id: e.property_id,
        amount: e.amount,
        recurring_frequency: e.recurring_frequency,
        expense_date: e.expense_date,
        category: e.category,
      }))

    console.log("[v0] Revenue timeline data sample:", revenueTimelineData[0])

    return NextResponse.json({
      properties: properties.map((p: any) => ({
        id: p.id,
        unit_name: p.unit_name,
        property_name: p.property_name,
        building_id: p.building_id,
        location_id: p.location_id,
      })),
      reservations,
      expenses: formattedExpenses,
      payments,
      propertyPerformanceMetrics,
      revenueTimelineData,
      ADRData,
      occupancyRateData,
      expenseTrendData,
      propertyExpenseComparison,
      revenueByProperty,
      revenueByRentalType,
      profitLossData,
      transactionHistory,
      propertyRentalTypes,
      recurringExpenses,
      metrics: {
        ytdRevenue,
        ytdExpenses,
        ytdProfit,
      },
    })
  } catch (error) {
    console.error("[v0] Get financial metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
