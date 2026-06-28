import { Button } from "@/components/ui/button";
import { disablePortalUserAction } from "@/lib/client-portal/actions";

type DisablePortalUserButtonProps = {
  portalUserId: string;
};

export function DisablePortalUserButton({ portalUserId }: DisablePortalUserButtonProps) {
  const disableAction = disablePortalUserAction.bind(null, portalUserId);

  return (
    <form action={disableAction}>
      <Button type="submit" variant="ghost">
        Disable
      </Button>
    </form>
  );
}
