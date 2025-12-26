# PowerShell script to find your local IP address
# Run with: .\scripts\get-local-ip.ps1

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "`n🌐 Your Local IP Address:" -ForegroundColor Green
    Write-Host "   $ipAddress" -ForegroundColor Yellow
    Write-Host "`n📝 Update this in: src/config/api.ts" -ForegroundColor Cyan
    Write-Host "   Change LOCAL_IP to: '$ipAddress'`n" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Could not find local IP address`n" -ForegroundColor Red
}


