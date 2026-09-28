param(
    [Parameter(Mandatory)][string]$Prompt,
    [Parameter(Mandatory)][string]$Log,
    [switch]$Continue
)
Set-Location C:\Pidu-App
$Host.UI.RawUI.WindowTitle = "Kimi - $Log"
$kimiArgs = @('-p', $Prompt)
if ($Continue) { $kimiArgs = @('-c') + $kimiArgs }
Write-Host "=== Kimi mulai: $(Get-Date) ===" -ForegroundColor Cyan
Write-Host "Prompt: $Prompt`n" -ForegroundColor DarkGray
kimi @kimiArgs 2>&1 | Tee-Object -FilePath "docs\lead\$Log"
Write-Host "`n=== Kimi selesai: $(Get-Date) (exit $LASTEXITCODE) ===" -ForegroundColor Cyan
"`n=== DONE exit=$LASTEXITCODE $(Get-Date) ===" | Add-Content "docs\lead\$Log"


