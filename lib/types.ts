export type PropertyStatus = "occupied" | "vacant" | "maintenance"
export type PaymentStatus = "paid" | "pending" | "overdue"

export interface Property {
  id: string
  unit_name: string
  address: string
  status: PropertyStatus
  standardRate: number
  imageUrl: string
  maintenanceEndDate?: string
}

export interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string
}

export interface Reservation {
  id: string
  propertyId: string
  tenantId: string
  checkIn: string
  checkOut: string
  negotiatedRate: number
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface ReservationDetail extends Reservation {
  reservationNumber: string
  status: "confirmed" | "checked-in" | "completed" | "cancelled"
  guests: {
    adults: number
    children: number
  }
  specialRequests?: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  balanceDueDate?: string
  paymentMethod: string
  securityDeposit: number
  securityDepositStatus: "pending" | "paid" | "refunded"
}

export interface GuestProfile {
  id: string
  name: string
  email: string
  phone: string
  whatsapp?: string
  idType?: string
  idNumber?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  profilePhoto?: string
  previousStays: number
  lifetimeValue: number
  averageRating?: number
  isRepeatGuest: boolean
}

export interface CommunicationLog {
  id: string
  date: string
  type: "whatsapp" | "email" | "phone" | "manual"
  message: string
  sentBy: string
}

export interface PaymentRecord {
  id: string
  date: string
  amount: number
  method: string
  status: PaymentStatus
}

export interface ReservationDocument {
  id: string
  name: string
  type: "invoice" | "agreement" | "receipt" | "id-copy"
  uploadDate: string
  url: string
}

export interface Invoice {
  id: string
  reservationId: string
  amount: number
  issueDate: string
  dueDate: string
  status: PaymentStatus
}

export interface MonthlyRevenue {
  month: string
  realized: number
  future: number
  byProperty?: Record<
    string,
    {
      realized: number
      future: number
    }
  >
}

export interface MaintenanceAlert {
  propertyId: string
  propertyName: string
  endDate: string
  daysRemaining: number
}

export interface CheckInOut {
  id: string
  type: "check-in" | "check-out"
  propertyName: string
  tenantName: string
  date: string
}

export interface DashboardMetrics {
  totalProperties: number
  occupied: number
  vacant: number
  ytdRealizedRevenue: number
  occupancyRate: number
  currentMonthRevenue: number
  lastMonthRevenue: number
}

export interface PropertyPerformance {
  lifetimeRevenue: number
  averageOccupancy: number
  revPAR: number
  totalBookings: number
  averageStayDuration: number
}

export interface MaintenanceRecord {
  id: string
  propertyId: string
  date: string
  description: string
  cost: number
  status: "completed" | "in-progress" | "scheduled"
}

export interface PropertyDocument {
  id: string
  propertyId: string
  name: string
  type: string
  uploadDate: string
  url: string
}

export interface BlockedDate {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  reason: "maintenance" | "owner-use" | "other"
  notes?: string
}

export type ExpenseCategory = "Maintenance" | "Utilities" | "Mortgage" | "Taxes" | "Insurance" | "Other"

export interface Expense {
  id: string
  amount: number
  description: string
  category: ExpenseCategory
  property: string // "Portfolio Wide" or property ID
  date: string
  receiptUrl?: string
}

export interface FinancialOverview {
  ytdRevenue: number
  ytdExpenses: number
  ytdProfit: number
  revenueTrend: number
  expensesTrend: number
  profitTrend: number
}

export interface ProfitLossData {
  month: string
  realizedProfit: number
  projectedProfit: number
  realizedLoss: number
  projectedLoss: number
}

export interface ExpenseBreakdown {
  category: ExpenseCategory
  amount: number
  percentage: number
  color: string
}

export interface PropertyComparison {
  propertyId: string
  unitName: string
  occupancy: number
  avgDailyRate: number
  revPAR: number
  expenseRatio: number
}

export interface OccupancyRateData {
  month: string
  portfolioAverage: number
  properties: Record<string, number>
}

export interface OccupancyStats {
  currentAverage: number
  trend: number
  bestPerformer: {
    propertyId: string
    propertyName: string
    rate: number
  }
}

export type TransactionType = "payment" | "expense"
export type TransactionStatus = "completed" | "pending" | "failed"

export interface Transaction {
  id: string
  date: string
  description: string
  type: TransactionType
  property: string
  amount: number
  status: TransactionStatus
}

export interface RevenueTimelineData {
  month: string
  properties: Record<string, number>
}

export interface RevenueByProperty {
  propertyId: string
  propertyName: string
  amount: number
  percentage: number
  color: string
}

export interface RevenueByRentalType {
  type: string
  amount: number
  percentage: number
}

export interface ADRData {
  month: string
  yourADR: number
  marketADR: number
}

export interface PropertyPerformanceMetrics {
  propertyId: string
  unitName: string
  revenue: number
  occupancy: number
  adr: number
  revPAR: number
  trend: number
}

export interface Budget {
  id: string
  category: ExpenseCategory
  monthlyLimit: number
  ytdSpent: number
  ytdLimit: number
  status: "under" | "near" | "over"
}

export interface RecurringExpense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  frequency: "monthly" | "quarterly" | "yearly"
  nextDueDate: string
  property: string
}

export interface ExpenseTrendData {
  month: string
  amount: number
}

export interface PropertyExpenseComparison {
  propertyId: string
  unitName: string
  totalExpenses: number
  maintenanceCost: number
  utilitiesCost: number
  otherCosts: number
}
