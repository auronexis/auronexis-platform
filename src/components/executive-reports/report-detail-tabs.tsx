import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";

type ReportDetailTabsProps = {
  reportId: string;
  activeTab: "standard" | "executive";
};

export function ReportDetailTabs({ reportId, activeTab }: ReportDetailTabsProps) {
  return (
    <ArchiveFilterTabs
      tabs={[
        {
          label: "Report workspace",
          href: `/reports/${reportId}`,
          active: activeTab === "standard",
        },
        {
          label: "Executive",
          href: `/reports/${reportId}?tab=executive`,
          active: activeTab === "executive",
        },
      ]}
    />
  );
}
