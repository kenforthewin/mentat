#!/usr/bin/env bash
set -e
echo $MIX_ENV

mix deps.get
mix compile --force
mix ecto.create
mix ecto.migrate

cd /app/assets && npm i
cp /app/assets/node_modules/openpgp/dist/openpgp.worker.min.js /app/priv/static/js
cp /app/assets/node_modules/openpgp/dist/openpgp.min.js /app/priv/static/js

cd /app && exec mix phx.server
