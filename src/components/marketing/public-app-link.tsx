import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublicNavState } from "@/lib/marketing/public-nav";
import { resolvePublicAppShortcut } from "@/lib/marketing/auth-context";

type PublicAppLinkProps = {
  className?: string;
};

/** Auth-aware shortcut from public docs pages back to the workspace or sign-in. */
export async function PublicAppLink({ className }: PublicAppLinkProps) {
  const auth = await getPublicNavState();
  const shortcut = resolvePublicAppShortcut(auth);

  return (
    <Link href={shortcut.href} className={className}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {shortcut.label}
    </Link>
  );
}
