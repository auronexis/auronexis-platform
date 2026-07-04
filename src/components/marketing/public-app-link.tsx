import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getMarketingAuthState, resolvePublicAppShortcut } from "@/lib/marketing/auth-context";

type PublicAppLinkProps = {
  className?: string;
};

/** Auth-aware shortcut from public docs pages back to the workspace or sign-in. */
export async function PublicAppLink({ className }: PublicAppLinkProps) {
  const session = await getSession();
  const auth = getMarketingAuthState(session);
  const shortcut = resolvePublicAppShortcut(auth);

  return (
    <Link href={shortcut.href} className={className}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {shortcut.label}
    </Link>
  );
}
