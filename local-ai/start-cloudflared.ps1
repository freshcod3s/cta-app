param(
  [int]$LocalPort = 4000
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Cloudflare quick tunnel to http://localhost:$LocalPort"
Write-Host "Keep this terminal open. Copy the HTTPS URL and use it as Cursor base URL."

cloudflared tunnel --url "http://localhost:$LocalPort"
