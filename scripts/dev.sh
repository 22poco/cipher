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
#   HOST_IP        IP to advertise          (default: NetBird IP, then LAN IP)
#   NETBIRD_IP     explicit NetBird IP      (default: auto-detected)
#   NETBIRD_FQDN   explicit NetBird DNS name(default: auto-detected)
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

# --- host IP detection ----------------------------------------------------- #

is_netbird_ipv4() {
  local ip="$1"
  [[ "$ip" =~ ^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.([0-9]{1,3})\.([0-9]{1,3})$ ]]
}

first_netbird_ipv4_from_stdin() {
  local candidate=""
  while IFS= read -r candidate; do
    if is_netbird_ipv4 "$candidate"; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

detect_netbird_ip() {
  local ip=""

  if [ -n "${NETBIRD_IP:-}" ]; then
    echo "$NETBIRD_IP"
    return 0
  fi

  # Linux: NetBird commonly exposes a WireGuard-style tunnel interface.
  if command -v ip >/dev/null 2>&1; then
    ip="$(
      ip -o -4 addr show up 2>/dev/null |
        awk 'tolower($2) ~ /(netbird|wt|nb|tun)/ { split($4, a, "/"); print a[1] }' |
        first_netbird_ipv4_from_stdin || true
    )"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  fi

  # macOS / BSD: VPN tunnels usually appear in ifconfig as utun*.
  if command -v ifconfig >/dev/null 2>&1; then
    ip="$(
      ifconfig 2>/dev/null |
        awk '
          /^[[:alnum:]][[:alnum:]_.-]*:/ { iface=$1; sub(":", "", iface) }
          tolower(iface) ~ /^(netbird|wt|nb|utun)/ && $1 == "inet" { print $2 }
        ' |
        first_netbird_ipv4_from_stdin || true
    )"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  fi

  if command -v netbird >/dev/null 2>&1; then
    ip="$(
      netbird status --json 2>/dev/null |
        grep -Eo '"netbirdIp":"([0-9]{1,3}\.){3}[0-9]{1,3}(/[0-9]+)?"' |
        tail -n 1 |
        sed -E 's/.*"netbirdIp":"(([0-9]{1,3}\.){3}[0-9]{1,3}).*/\1/' |
        first_netbird_ipv4_from_stdin || true
    )"
    [ -n "$ip" ] && { echo "$ip"; return 0; }

    ip="$(
      netbird status 2>/dev/null |
        awk '/NetBird IP|netbird IP|IP:/ { print }' |
        grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' |
        first_netbird_ipv4_from_stdin || true
    )"
    [ -n "$ip" ] && { echo "$ip"; return 0; }
  fi

  return 1
}

detect_netbird_fqdn() {
  local fqdn=""

  if [ -n "${NETBIRD_FQDN:-}" ]; then
    echo "$NETBIRD_FQDN"
    return 0
  fi

  if command -v netbird >/dev/null 2>&1; then
    fqdn="$(
      netbird status --json 2>/dev/null |
        grep -Eo '"fqdn":"[^"]+"' |
        tail -n 1 |
        sed -E 's/.*"fqdn":"([^"]+)".*/\1/' || true
    )"
    [ -n "$fqdn" ] && { echo "$fqdn"; return 0; }
  fi

  return 1
}

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

add_csv_value() {
  local current="$1" value="$2"
  [ -z "$value" ] && { echo "$current"; return 0; }
  [ -z "$current" ] && { echo "$value"; return 0; }
  case ",$current," in
    *",$value,"*) echo "$current" ;;
    *) echo "${current},${value}" ;;
  esac
}

add_frontend_origin_for_host() {
  local current="$1" host="$2"
  [ -z "$host" ] && { echo "$current"; return 0; }
  add_csv_value "$current" "http://${host}:${FRONTEND_PORT}"
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

LAN_IP="$(detect_host_ip)"
NETBIRD_DETECTED_IP="$(detect_netbird_ip || true)"
NETBIRD_DETECTED_FQDN="$(detect_netbird_fqdn || true)"
HOST_SOURCE="auto"

if [ -n "${HOST_IP:-}" ]; then
  HOST_SOURCE="override"
elif [ -n "$NETBIRD_DETECTED_IP" ]; then
  HOST_IP="$NETBIRD_DETECTED_IP"
  HOST_SOURCE="netbird"
else
  HOST_IP="$LAN_IP"
  HOST_SOURCE="lan"
fi
[ -z "$HOST_IP" ] && HOST_IP="127.0.0.1"

DEFAULT_BACKEND_CORS_ORIGINS="http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}"
DEFAULT_BACKEND_CORS_ORIGINS="$(add_frontend_origin_for_host "$DEFAULT_BACKEND_CORS_ORIGINS" "$HOST_IP")"
DEFAULT_BACKEND_CORS_ORIGINS="$(add_frontend_origin_for_host "$DEFAULT_BACKEND_CORS_ORIGINS" "$LAN_IP")"
DEFAULT_BACKEND_CORS_ORIGINS="$(add_frontend_origin_for_host "$DEFAULT_BACKEND_CORS_ORIGINS" "$NETBIRD_DETECTED_IP")"
DEFAULT_BACKEND_CORS_ORIGINS="$(add_frontend_origin_for_host "$DEFAULT_BACKEND_CORS_ORIGINS" "$NETBIRD_DETECTED_FQDN")"

DEFAULT_NEXT_ALLOWED_DEV_ORIGINS="localhost,127.0.0.1"
DEFAULT_NEXT_ALLOWED_DEV_ORIGINS="$(add_csv_value "$DEFAULT_NEXT_ALLOWED_DEV_ORIGINS" "$HOST_IP")"
DEFAULT_NEXT_ALLOWED_DEV_ORIGINS="$(add_csv_value "$DEFAULT_NEXT_ALLOWED_DEV_ORIGINS" "$LAN_IP")"
DEFAULT_NEXT_ALLOWED_DEV_ORIGINS="$(add_csv_value "$DEFAULT_NEXT_ALLOWED_DEV_ORIGINS" "$NETBIRD_DETECTED_IP")"
DEFAULT_NEXT_ALLOWED_DEV_ORIGINS="$(add_csv_value "$DEFAULT_NEXT_ALLOWED_DEV_ORIGINS" "$NETBIRD_DETECTED_FQDN")"

# Point the browser at the machine IP so API calls work both locally and from
# other devices on the LAN. Allow the frontend origin through backend CORS and
# allow the LAN host through Next.js dev-only asset protection.
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://${HOST_IP}:${BACKEND_PORT}}"
export BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS:-$DEFAULT_BACKEND_CORS_ORIGINS}"
export NEXT_ALLOWED_DEV_ORIGINS="${NEXT_ALLOWED_DEV_ORIGINS:-$DEFAULT_NEXT_ALLOWED_DEV_ORIGINS}"

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
echo "  host       source    ${HOST_SOURCE} (${HOST_IP})"
echo "  frontend   local     http://localhost:${FRONTEND_PORT}"
echo "             network   http://${HOST_IP}:${FRONTEND_PORT}"
[ -n "$NETBIRD_DETECTED_FQDN" ] && echo "             netbird   http://${NETBIRD_DETECTED_FQDN}:${FRONTEND_PORT}"
echo "  backend    local     http://localhost:${BACKEND_PORT}"
echo "             network   http://${HOST_IP}:${BACKEND_PORT}"
[ -n "$NETBIRD_DETECTED_FQDN" ] && echo "             netbird   http://${NETBIRD_DETECTED_FQDN}:${BACKEND_PORT}"
echo "             api docs  http://${HOST_IP}:${BACKEND_PORT}/docs"
echo "  ────────────────────────────────────────────"
echo ""

wait
