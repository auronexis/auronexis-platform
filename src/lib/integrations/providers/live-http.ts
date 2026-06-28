import { BaseIntegrationProvider, type StubProviderDefinition } from "@/lib/integrations/base";
import { executeLiveIntegration } from "@/lib/integrations/execution/executor";
import type {
  IntegrationExecuteInput,
  IntegrationExecutionResult,
  IntegrationSimulateInput,
} from "@/lib/integrations/types";
import { extractSecretIdFromConfig } from "@/lib/integrations/secrets/references";

export class LiveHttpIntegrationProvider extends BaseIntegrationProvider {
  readonly liveExecutionSupported: boolean = true;

  constructor(definition: StubProviderDefinition) {
    super(definition);
  }

  async execute(input: IntegrationExecuteInput): Promise<IntegrationExecutionResult> {
    const secretId = input.secretId ?? extractSecretIdFromConfig(input.config);
    const enriched: IntegrationExecuteInput = {
      ...input,
      secretId,
    };

    if (input.forceSimulation) {
      const simulation = this.simulate(input as IntegrationSimulateInput);
      const hasErrors = simulation.validationErrors.length > 0;
      return {
        providerId: simulation.providerId,
        providerName: simulation.providerName,
        deliveryStatus: hasErrors ? "failed" : "delivered",
        success: !hasErrors,
        simulated: true,
        durationMs: simulation.durationMs,
        message: simulation.message,
        retryCount: 0,
        validationErrors: simulation.validationErrors,
        secretReferenceStatus: simulation.secretReferenceStatus,
      };
    }

    return executeLiveIntegration(this, enriched);
  }
}
