<#
.SYNOPSIS
  Read a Windows Credential Manager *Generic* credential's secret and write it
  (and only it) to stdout. Used by scripts/bws-exec.sh to fetch the Bitwarden
  Secrets Manager bootstrap access token at runtime.

.DESCRIPTION
  Uses the Win32 CredReadW API via P/Invoke. This is the most robust,
  dependency-free way to READ a stored secret from Git Bash on Windows:
    * cmdkey can create/list/delete generic credentials but cannot read the
      secret value back.
    * The PowerShell `CredentialManager` module (Get-StoredCredential) is not
      installed by default.
  CredRead is built into Windows (advapi32.dll) and needs no module.

  The secret is written with [Console]::Out.Write (no trailing newline) so the
  caller captures the exact value. It is never logged; failures print to stderr
  WITHOUT the value.

.PARAMETER Target
  The generic credential target name (default "bws_access_token").

.OUTPUTS
  stdout: the secret (no newline). Exit 0 ok, 2 not found, 3 empty blob.
#>
param([string]$Target = 'bws_access_token')

$ErrorActionPreference = 'Stop'

Add-Type -Namespace Win32Cred -Name Native -MemberDefinition @'
[DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode, EntryPoint="CredReadW")]
public static extern bool CredRead(string target, int type, int flags, out IntPtr credentialPtr);

[DllImport("advapi32.dll")]
public static extern void CredFree(IntPtr cred);

[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
public struct CREDENTIAL {
    public int    Flags;
    public int    Type;
    public IntPtr TargetName;
    public IntPtr Comment;
    public long   LastWritten;
    public int    CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int    Persist;
    public int    AttributeCount;
    public IntPtr Attributes;
    public IntPtr TargetAlias;
    public IntPtr UserName;
}
'@

$CRED_TYPE_GENERIC = 1
$ptr = [IntPtr]::Zero

if (-not [Win32Cred.Native]::CredRead($Target, $CRED_TYPE_GENERIC, 0, [ref]$ptr)) {
    [Console]::Error.Write("cred-get: no generic credential named '$Target' in Windows Credential Manager")
    exit 2
}

try {
    $cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure(
        $ptr, [type]([Win32Cred.Native+CREDENTIAL]))
    if ($cred.CredentialBlobSize -le 0) {
        [Console]::Error.Write("cred-get: credential '$Target' has an empty secret")
        exit 3
    }
    $bytes = New-Object byte[] $cred.CredentialBlobSize
    [System.Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
    $secret = [System.Text.Encoding]::Unicode.GetString($bytes).TrimEnd([char]0)
    [Console]::Out.Write($secret)
}
finally {
    [Win32Cred.Native]::CredFree($ptr)
}
exit 0
