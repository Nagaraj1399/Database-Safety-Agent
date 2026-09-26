# TrueForge Security Model

## Non-Negotiable Security Rules

1. **Production Write Invariant**: The Autonomous Agent NEVER writes directly to production. The production execution route requires a signed human operator token and deliberate UI interaction.
2. **Zero Credential Exposure to LLM**: Connection strings, database passwords, and raw access tokens are never transmitted to LLM context windows or logs.
3. **Network Isolation**: The Sandbox container runs on a restricted Docker network with zero route to external internet or production endpoints.
4. **Timeouts & Resource Bounds**: All sandbox migration runs enforce strict statement timeouts (15 seconds) to prevent infinite loops or query deadlocks from exhausting memory.
5. **Audit Logging & Cryptographic Signatures**: Every action, tool call, schema diff, and operator approval is stamped with a unique cryptographic hash and timestamp.
