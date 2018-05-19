FROM elixir:1.6

RUN apt-get update && apt-get install -qq -y inotify-tools curl libnotify-bin --fix-missing --no-install-recommends

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update && apt-get install -qq -y nodejs  tar --fix-missing --no-install-recommends

WORKDIR /app
COPY ./mix* ./
RUN mix local.hex --force
RUN mix local.rebar --force
RUN export MIX_ENV=prod && mix do deps.get --force, deps.compile

WORKDIR /app
COPY ./ ./

WORKDIR /app/assets
RUN npm i
RUN npm run build
RUN mkdir -p /app/priv/static/js
RUN cp /app/assets/node_modules/openpgp/dist/openpgp.worker.min.js /app/priv/static/js
RUN cp /app/assets/node_modules/openpgp/dist/openpgp.min.js /app/priv/static/js

WORKDIR /app
RUN export MIX_ENV=prod && mix compile --force
RUN export MIX_ENV=prod && mix phx.digest
RUN rm -rf deps/*/.fetch

EXPOSE 4000
ENTRYPOINT [ "./docker-entrypoint.sh" ]
