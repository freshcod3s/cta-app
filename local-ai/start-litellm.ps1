param(
  [int]$Port = 4000,
  [string]$ConfigPath = "$PSScriptRoot\litellm.config.yaml",
  [string]$EnvPath = "$PSScriptRoot\env.example"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Import-DotEnvFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#")) {
      return
    }

    $pair = $line -split "=", 2
    if ($pair.Count -ne 2) {
      return
    }

    $name = $pair[0].Trim()
    $value = $pair[1].Trim()
    if (-not [string]::IsNullOrWhiteSpace($name)) {
      $existing = [Environment]::GetEnvironmentVariable($name)
      if ([string]::IsNullOrWhiteSpace($existing)) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}

if (-not (Test-Path $ConfigPath)) {
  throw "LiteLLM config not found at '$ConfigPath'."
}

Import-DotEnvFile -Path $EnvPath

if ([string]::IsNullOrWhiteSpace($env:LITELLM_MASTER_KEY) -or $env:LITELLM_MASTER_KEY -match "change-this|your-") {
  throw "LITELLM_MASTER_KEY is missing or placeholder. Set it in your environment or in '$EnvPath'."
}

if (-not [string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY) -and $env:OPENAI_API_KEY -match "your-openai-key|placeholder") {
  Write-Host "OPENAI_API_KEY is placeholder text. Clearing it so cloud fallback stays disabled."
  Remove-Item "Env:OPENAI_API_KEY" -ErrorAction SilentlyContinue
}

Write-Host "Starting LiteLLM on 127.0.0.1:$Port with config '$ConfigPath'"
Write-Host "Local-first route: local-coder -> cloud-fallback (only when needed)"
litellm --host 127.0.0.1 --port $Port --config $ConfigPath
