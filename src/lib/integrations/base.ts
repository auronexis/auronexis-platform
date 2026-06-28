import type {
  IntegrationHealthSnapshot,
  IntegrationProvider,
  IntegrationExecuteInput,
  IntegrationExecutionResult,
  IntegrationSimulateInput,
  IntegrationSimulationResult,
  IntegrationValidationResult,
} from "@/lib/integrations/types";
import { buildDefaultRequestPreview } from "@/lib/integrations/http";
import { evaluateProviderHealth } from "@/lib/integrations/health";
import { validateIntegrationConfig } from "@/lib/integrations/validation";

export type StubProviderDefinition = Pick<
  IntegrationProvider,
  "id" | "name" | "description" | "category"
> & {
  supportedActions: readonly string[];
  defaultUrl?: string;
  defaultMethod?: import("@/lib/integrations/types").HttpMethod;
  requiredFields?: readonly string[];
};

export class BaseIntegrationProvider implements IntegrationProvider {
  readonly id: IntegrationProvider["id"];
  readonly name: string;
  readonly description: string;
  readonly category: IntegrationProvider["category"];
  readonly supportedActions: string[];
  readonly liveExecutionSupported: boolean = false;
  private readonly defaultUrl: string;
  private readonly defaultMethod: import("@/lib/integrations/types").HttpMethod;
  private readonly requiredFields: readonly string[];

  constructor(definition: StubProviderDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.description = definition.description;
    this.category = definition.category;
    this.supportedActions = [...definition.supportedActions];
    this.defaultUrl = definition.defaultUrl ?? "https://example.com/simulated";
    this.defaultMethod = definition.defaultMethod ?? "POST";
    this.requiredFields = definition.requiredFields ?? [];
  }

  validate(config: unknown): IntegrationValidationResult {
    return validateIntegrationConfig(config, [...this.requiredFields]);
  }

  simulate(input: IntegrationSimulateInput): IntegrationSimulationResult {
    const started = Date.now();
    const config = (input.config ?? {}) as Record<string, unknown>;
    const validation = this.validate(config);
    const requestPreview = buildDefaultRequestPreview({
      method: (config.method as import("@/lib/integrations/types").HttpMethod | undefined) ?? this.defaultMethod,
      url: (config.url as string | undefined) ?? this.defaultUrl,
      headers: config.headers as Record<string, string> | undefined,
      body: config.body ?? config.payload ?? { simulated: true, provider: this.id },
      auth: config.auth as import("@/lib/integrations/http").HttpAuthConfig | undefined,
      timeoutMs: config.timeoutMs as number | undefined,
      retryCount: config.retryCount as number | undefined,
      templateContext: input.templateContext,
    });

    return {
      providerId: this.id,
      providerName: this.name,
      simulated: true,
      requestPreview,
      validationErrors: validation.errors,
      durationMs: Date.now() - started,
      secretReferenceStatus: "not_required",
      message: validation.valid
        ? `[Simulation] ${this.name} request prepared — no outbound call made.`
        : `[Simulation] ${this.name} configuration incomplete — preview only.`,
    };
  }

  async execute(input: IntegrationExecuteInput): Promise<IntegrationExecutionResult> {
    const simulation = this.simulate(input);
    const hasErrors = simulation.validationErrors.length > 0;
    return {
      providerId: simulation.providerId,
      providerName: simulation.providerName,
      deliveryStatus: hasErrors ? "failed" : "delivered",
      success: !hasErrors,
      simulated: true,
      durationMs: simulation.durationMs,
      message: `[Placeholder] ${simulation.message}`,
      retryCount: 0,
      validationErrors: simulation.validationErrors,
      secretReferenceStatus: simulation.secretReferenceStatus,
    };
  }

  health(config?: unknown): IntegrationHealthSnapshot {
    return evaluateProviderHealth(this, config);
  }
}
