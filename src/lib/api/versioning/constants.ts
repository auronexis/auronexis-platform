export const API_VERSION = "v1" as const;
export const API_BASE_PATH = `/api/${API_VERSION}`;

export const SUPPORTED_API_VERSIONS = ["v1"] as const;

export function buildVersionedPath(resource: string): string {
  return `${API_BASE_PATH}/${resource.replace(/^\//, "")}`;
}
