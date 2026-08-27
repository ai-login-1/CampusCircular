import { supabase } from "@/lib/supabase";

// ─── In-app notification creator ─────────────────────────────────────────────
export async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" | "request" | "exchange",
  link?: string
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    link: link ?? null,
  });
  if (error) console.error("createInAppNotification error:", error.message);
}

// ─── Exchange lifecycle notifications ─────────────────────────────────────────
export async function notifyExchangeEvent(
  event: string,
  exchangeId: string,
  borrowerId: string,
  borrowerName: string,
  ownerId: string,
  ownerName: string,
  resourceTitle: string,
  adminIds?: string[]
) {
  const link = `/exchanges/${exchangeId}`;

  const notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error" | "request" | "exchange";
  }> = [];

  switch (event) {
    case "requested":
      notifications.push({
        userId: ownerId,
        title: "New Borrow Request",
        message: `${borrowerName} wants to borrow your ${resourceTitle}. Review and respond.`,
        type: "request",
      });
      break;

    case "accepted":
      notifications.push({
        userId: borrowerId,
        title: "Request Accepted! 🎉",
        message: `${ownerName} accepted your request for ${resourceTitle}. Proceed to handover.`,
        type: "success",
      });
      break;

    case "rejected":
      notifications.push({
        userId: borrowerId,
        title: "Request Not Accepted",
        message: `${ownerName} was unable to accept your request for ${resourceTitle}.`,
        type: "info",
      });
      break;

    case "handover":
      notifications.push({
        userId: borrowerId,
        title: "Item Ready for Pickup",
        message: `${ownerName} has handed over ${resourceTitle}. Confirm receipt when you collect it.`,
        type: "exchange",
      });
      break;

    case "borrowed":
      notifications.push({
        userId: ownerId,
        title: "Borrowing Confirmed",
        message: `${borrowerName} confirmed receipt of ${resourceTitle}. Borrowing period has started.`,
        type: "exchange",
      });
      break;

    case "return_due":
      notifications.push({
        userId: borrowerId,
        title: "Return Due Tomorrow ⏰",
        message: `Your borrowed ${resourceTitle} is due for return tomorrow. Please ensure timely return.`,
        type: "warning",
      });
      break;

    case "overdue":
      notifications.push({
        userId: borrowerId,
        title: "Item Overdue ⚠️",
        message: `Your borrowed ${resourceTitle} is overdue. Return immediately to avoid additional charges.`,
        type: "error",
      });
      notifications.push({
        userId: ownerId,
        title: "Overdue Return Alert",
        message: `${borrowerName}'s return of ${resourceTitle} is overdue.`,
        type: "warning",
      });
      // Notify admins too
      if (adminIds) {
        for (const adminId of adminIds) {
          notifications.push({
            userId: adminId,
            title: "Overdue Exchange",
            message: `${resourceTitle} borrowed by ${borrowerName} from ${ownerName} is overdue.`,
            type: "warning",
          });
        }
      }
      break;

    case "returned":
      notifications.push({
        userId: ownerId,
        title: "Item Returned",
        message: `${borrowerName} has returned ${resourceTitle}. Please start the inspection.`,
        type: "exchange",
      });
      break;

    case "settlement":
      notifications.push({
        userId: borrowerId,
        title: "Settlement Ready",
        message: `Inspection complete for ${resourceTitle}. Review the settlement summary.`,
        type: "success",
      });
      notifications.push({
        userId: ownerId,
        title: "Settlement Complete",
        message: `Settlement for ${resourceTitle} has been finalised.`,
        type: "success",
      });
      break;

    case "disputed":
      notifications.push({
        userId: ownerId,
        title: "Dispute Raised",
        message: `A dispute has been raised on your exchange of ${resourceTitle}.`,
        type: "error",
      });
      notifications.push({
        userId: borrowerId,
        title: "Dispute Under Review",
        message: `Your dispute for ${resourceTitle} is under admin review.`,
        type: "warning",
      });
      if (adminIds) {
        for (const adminId of adminIds) {
          notifications.push({
            userId: adminId,
            title: "New Dispute Requires Review",
            message: `Dispute raised on exchange of ${resourceTitle} between ${borrowerName} and ${ownerName}.`,
            type: "error",
          });
        }
      }
      break;

    case "rated":
      notifications.push({
        userId: borrowerId,
        title: "Exchange Complete ✅",
        message: `Your exchange of ${resourceTitle} is fully complete. Thank you!`,
        type: "success",
      });
      notifications.push({
        userId: ownerId,
        title: "Exchange Complete ✅",
        message: `The exchange of ${resourceTitle} with ${borrowerName} is fully complete.`,
        type: "success",
      });
      break;
  }

  // Insert all notifications
  for (const n of notifications) {
    await createInAppNotification(n.userId, n.title, n.message, n.type, link);
  }
}

// ─── Admin ID fetcher ─────────────────────────────────────────────────────────
export async function getAdminIds(): Promise<string[]> {
  const { data } = await supabase.from("user_profiles").select("id").eq("role", "admin");
  return (data ?? []).map((r: any) => r.id);
}
