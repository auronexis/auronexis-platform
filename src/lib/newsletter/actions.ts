"use server";

import { redirect } from "next/navigation";
import {
  NEWSLETTER_CONFIRM_PATH,
  NEWSLETTER_UNSUBSCRIBE_PATH,
  confirmNewsletterSubscription,
  unsubscribeNewsletter,
} from "@/lib/newsletter/service";

/**
 * Confirm and unsubscribe run on an explicit button press (POST), never on GET: mail security
 * scanners open links automatically and would otherwise confirm or unsubscribe people.
 */
async function run(
  task: () => Promise<"ok" | "invalid">,
  path: string,
): Promise<never> {
  let status: "ok" | "invalid" | "error";
  try {
    status = await task();
  } catch (error) {
    console.error("[newsletter] link action failed:", error instanceof Error ? error.message : "unknown error");
    status = "error";
  }
  redirect(`${path}?status=${status}`);
}

export async function confirmNewsletterAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  await run(() => confirmNewsletterSubscription(token), NEWSLETTER_CONFIRM_PATH);
}

export async function unsubscribeNewsletterAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  await run(() => unsubscribeNewsletter(token, "page"), NEWSLETTER_UNSUBSCRIBE_PATH);
}
