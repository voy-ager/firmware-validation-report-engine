import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getRiskBadgeClass(risk: string): string {
  const map: Record<string, string> = {
    low: "badge-risk-low",
    medium: "badge-risk-medium",
    high: "badge-risk-high",
    critical: "badge-risk-critical",
  };
  return map[risk] || "badge-risk-medium";
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    draft: "badge-status-draft",
    approved: "badge-status-approved",
    pending: "badge-status-draft",
    processing: "badge-status-draft",
    in_review: "badge-risk-medium",
    exported: "badge-status-approved",
    failed: "badge-risk-critical",
  };
  return map[status] || "badge-status-draft";
}