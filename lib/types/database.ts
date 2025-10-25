// Database type definitions

export interface Property {
  id: number
  user_id: string
  name: string
  location: string
  location_id?: number // Added location_id field
  property_type: "apartment" | "house" | "condo" | "villa" | "studio" | "other"
  rental_type?: "short-term" | "long-term" | "corporate"
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  max_guests?: number
  description?: string
  amenities?: string[]
  images?: string[]
  status: "active" | "inactive" | "maintenance"
  created_at: Date
  updated_at: Date
}

export interface Tenant {
  id: number
  user_id: string
  property_id?: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  date_of_birth?: Date
  identification_type?: string
  identification_number?: string
  status: "active" | "inactive" | "pending"
  created_at: Date
  updated_at: Date
}

export interface Reservation {
  id: number
  user_id: string
  property_id: number
  tenant_id?: number
  guest_name: string
  guest_email: string
  guest_phone?: string
  check_in: Date
  check_out: Date
  number_of_guests: number
  reservation_type?: "short-term" | "long-term" | "corporate"
  total_amount: number
  paid_amount: number
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled"
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface BlockedDate {
  id: number
  user_id: string
  property_id: number
  start_date: Date
  end_date: Date
  reason?: string
  created_at: Date
}

export interface Payment {
  id: number
  user_id: string
  reservation_id?: number
  property_id?: number
  tenant_id?: number
  amount: number
  payment_method: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "check" | "other"
  payment_type: "rent" | "deposit" | "utility" | "maintenance" | "other"
  transaction_id?: string
  status: "pending" | "completed" | "failed" | "refunded"
  payment_date: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface Expense {
  id: number
  user_id: string
  property_id?: number
  category:
    | "maintenance"
    | "utilities"
    | "insurance"
    | "taxes"
    | "management_fees"
    | "repairs"
    | "cleaning"
    | "supplies"
    | "marketing"
    | "legal"
    | "other"
  amount: number
  description: string
  vendor?: string
  payment_method?: "cash" | "credit_card" | "debit_card" | "bank_transfer" | "check" | "other"
  expense_date: Date
  receipt_url?: string
  is_recurring: boolean
  recurring_frequency?: "weekly" | "monthly" | "quarterly" | "yearly"
  status: "pending" | "paid" | "overdue"
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface MaintenanceRequest {
  id: number
  user_id: string
  property_id: number
  tenant_id?: number
  title: string
  description: string
  category:
    | "plumbing"
    | "electrical"
    | "hvac"
    | "appliance"
    | "structural"
    | "pest_control"
    | "landscaping"
    | "cleaning"
    | "security"
    | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "completed" | "cancelled"
  assigned_to?: string
  estimated_cost?: number
  actual_cost?: number
  scheduled_date?: Date
  completed_date?: Date
  images?: string[]
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  expires_at: Date
  created_at: Date
}

export interface Location {
  id: number
  user_id: string
  name: string
  created_at: Date
  updated_at: Date
}
