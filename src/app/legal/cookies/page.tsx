import { redirect } from "next/navigation";

export default function LegacyCookiesRedirect() {
  redirect("/cookies");
}
