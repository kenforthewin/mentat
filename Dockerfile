FROM elixir:1.6

RUN apt-get update && apt-get install -qq -y inotify-tools curl --fix-missing --no-install-recommends

RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get update && apt-get install -qq -y nodejs --fix-missing --no-install-recommends

RUN mix local.hex --force
RUN mix local.rebar --force

WORKDIR /app
COPY ./ ./

EXPOSE 80
ENTRYPOINT [ "./docker-entrypoint.sh" ]
