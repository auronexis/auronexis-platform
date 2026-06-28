"use server";

import {
  submitContactLead,
  type CaptureActionState,
} from "@/lib/sales/capture-actions";

export type ContactActionState = CaptureActionState;

export async function submitContactForm(
  prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  return submitContactLead(prevState, formData);
}
