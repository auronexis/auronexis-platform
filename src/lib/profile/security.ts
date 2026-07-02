import { createClient } from "@/lib/supabase/server";

export type AccountSecurityContext = {
  hasPasswordProvider: boolean;
  authProviders: string[];
};

/** Auth provider details for profile security UI — server-only. */
export async function getAccountSecurityContext(): Promise<AccountSecurityContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const identities = user?.identities ?? [];
  const providers = identities.map((identity) => identity.provider);
  const hasPasswordProvider = providers.includes("email");

  return {
    hasPasswordProvider,
    authProviders: providers.length > 0 ? providers : hasPasswordProvider ? ["email"] : [],
  };
}
