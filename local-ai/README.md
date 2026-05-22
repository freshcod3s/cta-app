# Local-First AI Routing for Cursor

This directory runs a local-first stack:

- Ollama on `127.0.0.1:11434`
- LiteLLM on `127.0.0.1:4000`
- Primary model: `local-coder` (`ollama/qwen2.5-coder:14b`)
- Optional fallback: `cloud-fallback` (`openai/gpt-4o-mini`)

LiteLLM is bound to loopback only, so it is not publicly exposed.

## Start the stack

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\local-ai\start-litellm.ps1
```

The script validates configuration before launch and fails fast if `LITELLM_MASTER_KEY` is missing or still placeholder text.

## Cursor integration

Use these values in Cursor's OpenAI-compatible provider settings:

- Base URL: `http://localhost:4000/v1`
- API key: `LITELLM_MASTER_KEY`
- Model name in Cursor: `local-coder`

`local-coder` is the default route. `cloud-fallback` is configured only as backup and is not used unless local routing fails repeatedly or context limits require fallback.

## Security defaults

- Bind address is `127.0.0.1` only
- No tunnel is started by default
- No public endpoint is exposed unless explicitly added later
