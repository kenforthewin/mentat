#!/usr/bin/env bash
set -e
echo $MIX_ENV

mix deps.get
mix compile --force
mix ecto.create
mix ecto.migrate

cd /app/assets && npm i

cd /app && exec mix phx.server
