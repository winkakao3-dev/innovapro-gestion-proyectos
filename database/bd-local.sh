#!/bin/sh
# Base de datos PostgreSQL local y desechable para desarrollar y probar sin tocar Supabase.
# Uso: sh database/bd-local.sh iniciar | detener | reiniciar
set -eu

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DATOS="$RAIZ/.bd-local"
PUERTO="${PUERTO_BD_LOCAL:-54329}"
BIN="$(dirname "$(command -v pg_ctl)")"
for version in 17 16; do
  if [ -x "/opt/homebrew/opt/postgresql@$version/bin/pg_ctl" ]; then BIN="/opt/homebrew/opt/postgresql@$version/bin"; break; fi
done

iniciar() {
  if [ ! -d "$DATOS" ]; then
    "$BIN/initdb" -D "$DATOS" -U postgres --auth=trust --encoding=UTF8 --locale=C >/dev/null
  fi
  # En macOS el servidor se cierra al arrancar si no hay una locale válida en el entorno.
  LC_ALL=C "$BIN/pg_ctl" -D "$DATOS" -o "-p $PUERTO -k /tmp" -l "$DATOS/servidor.log" -w start >/dev/null
  "$BIN/psql" -h localhost -p "$PUERTO" -U postgres -tc "select 1 from pg_database where datname = 'gestion_proyectos'" | grep -q 1 || {
    "$BIN/createdb" -h localhost -p "$PUERTO" -U postgres gestion_proyectos
    for archivo in "$RAIZ"/database/migraciones/*.sql "$RAIZ"/database/semillas/*.sql; do
      "$BIN/psql" -h localhost -p "$PUERTO" -U postgres -d gestion_proyectos -v ON_ERROR_STOP=1 -q -f "$archivo" >/dev/null
    done
  }
  echo "Base local lista: postgres://postgres@localhost:$PUERTO/gestion_proyectos"
}

detener() {
  [ -d "$DATOS" ] && "$BIN/pg_ctl" -D "$DATOS" -m fast stop >/dev/null 2>&1 || true
  echo "Base local detenida"
}

case "${1:-}" in
  iniciar) iniciar ;;
  detener) detener ;;
  reiniciar) detener; rm -rf "$DATOS"; iniciar ;;
  *) echo "Uso: sh database/bd-local.sh iniciar | detener | reiniciar" >&2; exit 1 ;;
esac
