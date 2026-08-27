import { TransactionStatus } from "@/types";

export const LIFECYCLE_STEPS: { status: TransactionStatus; label: string; shortLabel: string }[] = [
  { status: "requested",  label: "Requested",   shortLabel: "Requested" },
  { status: "accepted",   label: "Accepted",    shortLabel: "Accepted" },
  { status: "handover",   label: "Handover",    shortLabel: "Handover" },
  { status: "borrowed",   label: "Borrowed",    shortLabel: "Borrowed" },
  { status: "return_due", label: "Return Due",  shortLabel: "Return Due" },
  { status: "returned",   label: "Returned",    shortLabel: "Returned" },
  { status: "inspection", label: "Inspection",  shortLabel: "Inspection" },
  { status: "settlement", label: "Settlement",  shortLabel: "Settlement" },
  { status: "rated",      label: "Rated",       shortLabel: "Rated" },
];

export const STATUS_ORDER: TransactionStatus[] = [
  "requested", "accepted", "handover", "borrowed",
  "return_due", "returned", "inspection", "settlement", "rated",
];

export function getStepIndex(status: TransactionStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function isTerminalStatus(status: TransactionStatus): boolean {
  return ["rejected", "cancelled", "rated", "resolved"].includes(status);
}
