#!/usr/bin/env bash
# Sube un secreto a Cloudflare leyéndolo de un archivo: quita saltos de línea y se niega a subirlo si
# contiene cualquier carácter invisible o raro (un secreto corrupto así rompió Stripe en producción).
# Uso: bash scripts/put-secret.sh NOMBRE_DEL_SECRETO ruta/al/archivo.txt
set -euo pipefail
# wrangler necesita correr en la raíz del proyecto (lee wrangler.jsonc); así funciona desde cualquier carpeta.
cd "$(dirname "$0")/.."
name="${1:?falta el nombre del secreto}"
file="${2:?falta la ruta del archivo}"
if [ ! -f "$file" ]; then
  echo "NO EXISTE EL ARCHIVO: $file (¿lo guardaste con otro nombre, p. ej. stripe-key.txt.txt?)" >&2
  exit 1
fi
k=$(tr -d '\r\n' < "$file")
if ! printf '%s' "$k" | grep -qE '^[A-Za-z0-9_-]+$'; then
  echo "EL VALOR EN $file TIENE UN CARACTER RARO O INVISIBLE; no se subió nada." >&2
  exit 1
fi
printf '%s' "$k" | npx wrangler secret put "$name"
