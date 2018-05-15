#!/usr/bin/env bash
set -e
echo $MIX_ENV

mix deps.get
# mix compile --force
mix ecto.create
mix ecto.migrate

mkdir -p /app/priv/static/js
cd /app/assets && npm i
cp /app/assets/node_modules/openpgp/dist/openpgp.worker.min.js /app/priv/static/js
cp /app/assets/node_modules/openpgp/dist/openpgp.min.js /app/priv/static/js

if [ "$MIX_ENV" != prod ]; then
  cd /app && exec mix phx.server
else
  cd /app/assets && npm run build
  cd /app && mix phx.digest
  cd /app && exec mix phx.server
fi
