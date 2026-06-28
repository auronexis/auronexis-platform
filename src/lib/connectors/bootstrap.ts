import { registerConnector, freezeConnectorRegistry } from "@/lib/connectors/registry";
import { ALL_CONNECTOR_CONFIGS } from "@/lib/connectors/definitions";
import { buildConnectorDefinition } from "@/lib/connectors/shared/module-config";

let bootstrapped = false;

export function bootstrapConnectors(): void {
  if (bootstrapped) {
    return;
  }

  for (const config of ALL_CONNECTOR_CONFIGS) {
    registerConnector(buildConnectorDefinition(config));
  }

  freezeConnectorRegistry();
  bootstrapped = true;
}

export { ALL_CONNECTOR_CONFIGS };
