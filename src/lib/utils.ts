import { format, formatDistanceToNow, isAfter } from "date-fns";

export function formatDateTime(date: number | Date) {
  return format(date, "MMM d, h:mm a");
}

export function formatDate(date: number | Date) {
  return format(date, "MMM d, yyyy");
}

export function formatTimeAgo(date: number | Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function getMembershipStatusColor(endDate: number) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (isAfter(endDate, now)) {
    if (endDate - now < sevenDays) return "warning";
    return "active";
  }
  return "expired";
}

export function getMembershipStatusLabel(endDate: number) {
  const now = Date.now();
  if (isAfter(endDate, now)) {
    const daysLeft = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
    if (daysLeft < 7) return `Expires in ${daysLeft} days`;
    return `Active — ${daysLeft} days left`;
  }
  return "Expired";
}
