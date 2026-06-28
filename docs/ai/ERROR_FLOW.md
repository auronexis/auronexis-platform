# Error Flow

All server actions catch errors and return `toAIActionError(error)`.

## Error codes

| Code | User message | Retryable |
|------|--------------|-----------|
| `plan_restricted` | Plan upgrade message | No |
| `rate_limit` | Monthly limit message | No |
| `access_denied` | Permission message | No |
| `validation` | Invalid request | No |
| `timeout` | Timeout message | Yes |
| `provider_error` | Generic retry message | Yes |
| `invalid_response` | Validation failed | Yes |
| `cancelled` | Cancelled message | Yes |

Provider internals are never returned to the client.
