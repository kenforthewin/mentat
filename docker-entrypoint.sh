#!/usr/bin/env bash
set -e


cd /app && mix ecto.create
cd /app && mix ecto.migrate
cd /app && exec mix phx.server
