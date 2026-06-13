<#
.SYNOPSIS
  One-time: store the Bitwarden Secrets Manager ACCESS TOKEN in the Windows
  Credential Manager as a Generic credential, without the token ever touching
  shell history or appearing on screen.

.DESCRIPTION
  Prompts for the token with Read-Host -AsSecureString (hidden input; Read-Host
  input is NOT recorded in PSReadLine history), then writes it via the Win32
  CredWriteW API. The plaintext is held only transiently and the unmanaged blob
  is zeroed before being freed.

  Run this in Windows PowerShell (not Git Bash):
      powershell -NoProfile -ExecutionPolicy Bypass -File scripts/set-bws-token.ps1

  Alternative with no terminal at all: Control Panel > Credential Manager >
  Windows Credentials > Add a generic credential
      Internet or network address: bws_access_token
      User name:                   bws
      Password:                    <the BWS access token>

.PARAMETER Target  Generic credential target name (default "bws_access_token").
.PARAMETER User    Username stored alongside the secret (default "bws").
#>
param([string]$Target = 'bws_access_token', [string]$User = 'bws')

$ErrorActionPreference = 'Stop'

$sec = Read-Host -AsSecureString "Paste the BWS access token (input hidden)"
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
try {
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Error 'Empty token; nothing stored.'
    exit 1
}

Add-Type -Namespace Win32Cred -Name Writer -MemberDefinition @'
[DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode, EntryPoint="CredWriteW")]
public static extern bool CredWrite(ref CREDENTIAL userCredential, int flags);

[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
public struct CREDENTIAL {
    public int    Flags;
    public int    Type;
    public string TargetName;
    public string Comment;
    public long   LastWritten;
    public int    CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int    Persist;
    public int    AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
}
'@

$bytes = [System.Text.Encoding]::Unicode.GetBytes($plain)
$blob  = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
try {
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $blob, $bytes.Length)

    $cred = New-Object Win32Cred.Writer+CREDENTIAL
    $cred.Type               = 1          # CRED_TYPE_GENERIC
    $cred.TargetName         = $Target
    $cred.UserName           = $User
    $cred.CredentialBlobSize = $bytes.Length
    $cred.CredentialBlob     = $blob
    $cred.Persist            = 2          # CRED_PERSIST_LOCAL_MACHINE

    if (-not [Win32Cred.Writer]::CredWrite([ref]$cred, 0)) {
        $code = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw "CredWrite failed (Win32 error $code)"
    }
    Write-Host "Stored generic credential '$Target' (user '$User') in Windows Credential Manager."
    Write-Host "scripts/bws-exec.sh will now be able to read it. The token was never echoed or written to disk."
}
finally {
    # Scrub the unmanaged blob, then free it; drop the managed plaintext.
    $zero = New-Object byte[] $bytes.Length
    [System.Runtime.InteropServices.Marshal]::Copy($zero, 0, $blob, $bytes.Length)
    [System.Runtime.InteropServices.Marshal]::FreeHGlobal($blob)
    $plain = $null
    [System.GC]::Collect()
}
