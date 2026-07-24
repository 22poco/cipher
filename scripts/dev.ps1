#
# Run the cipher backend (FastAPI) and frontend (Next.js) together.
#
# Usage:
#   .\scripts\dev.ps1
#
# Prerequisites (see the README quickstart):
#   - Postgres is running:     docker compose up -d
#   - Python venv with deps:   pip install -r requirements.txt
#   - backend\.env exists:     Copy-Item backend\.env.example backend\.env
#   - Demo classroom seeded:   python -m backend.seed_course
#
# Ports are chosen automatically: the script starts from the preferred port and
# scans upward for the first free one, so it never dies on "address already in
# use". Both servers bind to all interfaces, so the app is reachable at
# http://localhost:<port> AND at http://<your-machine-ip>:<port> from other
# devices on the same network.
#
# Environment overrides:
#   BACKEND_PORT   preferred backend port  (default 8000, scans upward if busy)
#   FRONTEND_PORT  preferred frontend port (default 3000, scans upward if busy)
#   BIND_HOST      interface to bind        (default 0.0.0.0 = all interfaces)
#   HOST_IP        LAN IP to advertise      (default: auto-detected)
#
$ErrorActionPreference = "Stop"

# Resolve the repo root (parent of scripts/) so this works from any directory.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

# --- port scanning --------------------------------------------------------- #

# Return $true if nothing is listening on the given TCP port (tries to bind it).
function Test-PortFree([int]$Port) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Return the first free port at or above the preferred one.
function Find-FreePort([int]$Start) {
    for ($p = $Start; $p -le ($Start + 200); $p++) {
        if (Test-PortFree $p) { return $p }
    }
    throw "no free port found in $Start-$($Start + 200)"
}

# --- LAN IP detection ------------------------------------------------------ #

function Get-HostIp {
    if ($env:HOST_IP) { return $env:HOST_IP }

    # Primary: the local address the OS would use to reach the internet.
    try {
        $sock = [System.Net.Sockets.Socket]::new(
            [System.Net.Sockets.AddressFamily]::InterNetwork,
            [System.Net.Sockets.SocketType]::Dgram,
            [System.Net.Sockets.ProtocolType]::Udp)
        $sock.Connect("1.1.1.1", 65530)
        $ip = ([System.Net.IPEndPoint]$sock.LocalEndPoint).Address.ToString()
        $sock.Dispose()
        if ($ip -and $ip -ne "0.0.0.0") { return $ip }
    } catch { }

    # Fallback: IPv4 of the active adapter that has a default gateway.
    try {
        $cfg = Get-NetIPConfiguration -ErrorAction Stop |
            Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
            Select-Object -First 1
        if ($cfg) { return $cfg.IPv4Address.IPAddress }
    } catch { }

    return "127.0.0.1"
}

# --- resolve ports + host -------------------------------------------------- #

$PreferredBackend = if ($env:BACKEND_PORT) { [int]$env:BACKEND_PORT } else { 8000 }
$PreferredFrontend = if ($env:FRONTEND_PORT) { [int]$env:FRONTEND_PORT } else { 3000 }
$BindHost = if ($env:BIND_HOST) { $env:BIND_HOST } else { "0.0.0.0" }

$BackendPort = Find-FreePort $PreferredBackend
# Start the frontend scan above the backend port to avoid picking the same one.
$FeStart = $PreferredFrontend
if ($FeStart -eq $BackendPort) { $FeStart++ }
$FrontendPort = Find-FreePort $FeStart

if ($BackendPort -ne $PreferredBackend) {
    Write-Host "note: backend port $PreferredBackend busy -> using $BackendPort"
}
if ($FrontendPort -ne $PreferredFrontend) {
    Write-Host "note: frontend port $PreferredFrontend busy -> using $FrontendPort"
}

$HostIp = Get-HostIp

# Point the browser at the machine IP so API calls work both locally and from
# other devices on the LAN, and allow that origin through CORS.
if (-not $env:NEXT_PUBLIC_API_BASE_URL) {
    $env:NEXT_PUBLIC_API_BASE_URL = "http://${HostIp}:${BackendPort}"
}
if (-not $env:BACKEND_CORS_ORIGINS) {
    $env:BACKEND_CORS_ORIGINS = "http://localhost:${FrontendPort},http://127.0.0.1:${FrontendPort},http://${HostIp}:${FrontendPort}"
}

# Activate the local virtualenv if present so `python` resolves to it.
$VenvActivate = Join-Path $RootDir ".venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) {
    . $VenvActivate
}

# --- run both servers ------------------------------------------------------ #

$Backend = $null
$Frontend = $null

# Kill a process and its whole tree (e.g. npm -> next/node).
function Stop-Tree($Proc) {
    if ($null -eq $Proc) { return }
    try { if ($Proc.HasExited) { return } } catch { return }
    if ($env:OS -eq "Windows_NT") {
        taskkill /PID $Proc.Id /T /F 2>$null | Out-Null
    } else {
        Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
    }
}

try {
    $Backend = Start-Process -FilePath "python" `
        -ArgumentList "-m", "uvicorn", "backend.main:app", "--reload", "--host", $BindHost, "--port", $BackendPort `
        -NoNewWindow -PassThru

    $Frontend = Start-Process -FilePath "npm" `
        -ArgumentList "run", "dev", "--", "--hostname", $BindHost, "--port", $FrontendPort `
        -WorkingDirectory (Join-Path $RootDir "frontend") `
        -NoNewWindow -PassThru

    Write-Host ""
    Write-Host "  cipher is running (Ctrl+C to stop)"
    Write-Host "  --------------------------------------------"
    Write-Host "  frontend   local     http://localhost:$FrontendPort"
    Write-Host "             network   http://${HostIp}:$FrontendPort"
    Write-Host "  backend    local     http://localhost:$BackendPort"
    Write-Host "             network   http://${HostIp}:$BackendPort"
    Write-Host "             api docs  http://${HostIp}:$BackendPort/docs"
    Write-Host "  --------------------------------------------"
    Write-Host ""

    while (-not ($Backend.HasExited -or $Frontend.HasExited)) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "shutting down..."
    Stop-Tree $Frontend
    Stop-Tree $Backend
}
