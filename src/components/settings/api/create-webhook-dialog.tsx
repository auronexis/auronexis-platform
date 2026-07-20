import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/types";

type CreateWebhookDialogProps = {
  onSubmit: (formData: FormData) => void;
  loading?: boolean;
};

export function CreateWebhookDialog({ onSubmit, loading = false }: CreateWebhookDialogProps) {
  return (
    <form action={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Input name="name" label="Endpoint name" placeholder="Production webhook" required />
      <Input
        name="url"
        label="Endpoint URL"
        type="url"
        placeholder="https://example.com/webhooks/auroranexis"
        required
      />
      <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
        {WEBHOOK_EVENTS.map((event) => (
          <label key={event} className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="events" value={event} defaultChecked />
            {event}
          </label>
        ))}
      </div>
      <Button type="submit" loading={loading}>
        Add webhook endpoint
      </Button>
    </form>
  );
}
