#!/usr/bin/env bash
#
# Run the cipher backend (FastAPI) and frontend (Next.js) together.
#
# Usage:
#   ./scripts/dev.sh
#
# Prerequisites (see the README quickstart):
#   - Postgres is running:     docker compose up -d
#   - Python venv with deps:   pip install -r requirements.txt
#   - backend/.env exists:     cp backend/.env.example backend/.env
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
set -euo pipefail

# Resolve the repo root (parent of scripts/) so this works from any directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

BIND_HOST="${BIND_HOST:-0.0.0.0}"

# Activate the local virtualenv if present so `uvicorn` is on PATH.
if [ -f ".venv/bin/activate" ]; then
  # shellcheck source=/dev/null
  source ".venv/bin/activate"
fi

command -v uvicorn >/dev/null 2>&1 || {
  echo "error: uvicorn not found. Activate your venv and run: pip install -r requirements.txt" >&2
  exit 1
}
command -v npm >/dev/null 2>&1 || {
  echo "error: npm not found. Install Node.js first." >&2
  exit 1
}

# --- port scanning --------------------------------------------------------- #

# Return success (0) if nothing is listening on the given TCP port.
is_port_free() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"$port" -sTCP:LISTEN -Pn >/dev/null 2>&1
  elif command -v nc >/dev/null 2>&1; then
    ! nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    ! (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null
  fi
}

# Print the first free port at or above the preferred one.
find_free_port() {
  local port="$1" max=$(( $1 + 200 ))
  while [ "$port" -le "$max" ]; do
    if is_port_free "$port"; then
      echo "$port"
      return 0
    fi
    port=$(( port + 1 ))
  done
  echo "error: no free port found in ${1}-${max}" >&2
  return 1
}

# --- LAN IP detection ------------------------------------------------------ #

detect_host_ip() {
  local ip=""
  # macOS
  if command -v ipconfig >/dev/null 2>&1; then
    for iface in en0 en1 en2 en3; do
      ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
      [ -n "$ip" ] && { echo "$ip"; return 0; }
    done
  fi
  # Linux (hostname -I)
  if command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  fi
  # Linux (ip route)
  if command -v ip >/dev/null 2>&1; then
    ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  fi
  echo ""
}

PREFERRED_BACKEND_PORT="${BACKEND_PORT:-8000}"
PREFERRED_FRONTEND_PORT="${FRONTEND_PORT:-3000}"

BACKEND_PORT="$(find_free_port "$PREFERRED_BACKEND_PORT")"
# Start the frontend scan above the backend port to avoid picking the same one.
FE_START="$PREFERRED_FRONTEND_PORT"
[ "$FE_START" -eq "$BACKEND_PORT" ] && FE_START=$(( FE_START + 1 ))
FRONTEND_PORT="$(find_free_port "$FE_START")"

[ "$BACKEND_PORT" != "$PREFERRED_BACKEND_PORT" ] &&
  echo "note: backend port ${PREFERRED_BACKEND_PORT} busy -> using ${BACKEND_PORT}"
[ "$FRONTEND_PORT" != "$PREFERRED_FRONTEND_PORT" ] &&
  echo "note: frontend port ${PREFERRED_FRONTEND_PORT} busy -> using ${FRONTEND_PORT}"

HOST_IP="${HOST_IP:-$(detect_host_ip)}"
[ -z "$HOST_IP" ] && HOST_IP="127.0.0.1"

# Point the browser at the machine IP so API calls work both locally and from
# other devices on the LAN, and allow that origin through CORS.
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://${HOST_IP}:${BACKEND_PORT}}"
export BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS:-http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT},http://${HOST_IP}:${FRONTEND_PORT}}"

# --- run both servers ------------------------------------------------------ #

backend_pid=""
frontend_pid=""

# Kill a process and its direct children (e.g. npm -> next/node).
kill_tree() {
  local pid="$1"
  [ -z "$pid" ] && return
  pkill -P "$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  echo ""
  echo "shutting down..."
  kill_tree "$frontend_pid"
  kill_tree "$backend_pid"
  wait 2>/dev/null || true
}
trap cleanup INT TERM

uvicorn backend.main:app --reload --host "$BIND_HOST" --port "$BACKEND_PORT" &
backend_pid=$!

npm --prefix frontend run dev -- --hostname "$BIND_HOST" --port "$FRONTEND_PORT" &
frontend_pid=$!

echo ""
echo "  cipher is running (Ctrl+C to stop)"
echo "  ────────────────────────────────────────────"
echo "  frontend   local     http://localhost:${FRONTEND_PORT}"
echo "             network   http://${HOST_IP}:${FRONTEND_PORT}"
echo "  backend    local     http://localhost:${BACKEND_PORT}"
echo "             network   http://${HOST_IP}:${BACKEND_PORT}"
echo "             api docs  http://${HOST_IP}:${BACKEND_PORT}/docs"
echo "  ────────────────────────────────────────────"
echo ""

wait
