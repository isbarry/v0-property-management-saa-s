export function getReservationTypeColor(reservationType: string | null | undefined): {
  bg: string
  text: string
  border: string
} {
  switch (reservationType) {
    case "short-term":
      return {
        bg: "bg-blue-500",
        text: "text-blue-500",
        border: "border-blue-500",
      }
    case "long-term":
      return {
        bg: "bg-purple-500",
        text: "text-purple-500",
        border: "border-purple-500",
      }
    case "corporate":
      return {
        bg: "bg-orange-500",
        text: "text-orange-500",
        border: "border-orange-500",
      }
    default:
      return {
        bg: "bg-blue-500",
        text: "text-blue-500",
        border: "border-blue-500",
      }
  }
}

export function getReservationTypeLabel(reservationType: string | null | undefined): string {
  switch (reservationType) {
    case "short-term":
      return "Short-term"
    case "long-term":
      return "Long-term"
    case "corporate":
      return "Corporate"
    default:
      return "Short-term"
  }
}
