import { requireModuleAccess } from "@/lib/rbac/route-guards";

export default async function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess("knowledge");
  return children;
}
