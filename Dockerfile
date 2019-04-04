FROM elixir:1.6

RUN apt-get update && apt-get install -qq -y inotify-tools curl libnotify-bin --fix-missing --no-install-recommends

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update && apt-get install -qq -y nodejs  tar --fix-missing --no-install-recommends

ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUST_VERSION=1.33.0
RUN set -eux; \
    \
    dpkgArch="$(dpkg --print-architecture)"; \
    case "${dpkgArch##*-}" in \
        amd64) rustArch='x86_64-unknown-linux-gnu'; rustupSha256='c9837990bce0faab4f6f52604311a19bb8d2cde989bea6a7b605c8e526db6f02' ;; \
        armhf) rustArch='armv7-unknown-linux-gnueabihf'; rustupSha256='297661e121048db3906f8c964999f765b4f6848632c0c2cfb6a1e93d99440732' ;; \
        arm64) rustArch='aarch64-unknown-linux-gnu'; rustupSha256='a68ac2d400409f485cb22756f0b3217b95449884e1ea6fd9b70522b3c0a929b2' ;; \
        i386) rustArch='i686-unknown-linux-gnu'; rustupSha256='27e6109c7b537b92a6c2d45ac941d959606ca26ec501d86085d651892a55d849' ;; \
        *) echo >&2 "unsupported architecture: ${dpkgArch}"; exit 1 ;; \
    esac; \
    \
    url="https://static.rust-lang.org/rustup/archive/1.11.0/${rustArch}/rustup-init"; \
    wget "$url"; \
    echo "${rustupSha256} *rustup-init" | sha256sum -c -; \
    chmod +x rustup-init; \
    ./rustup-init -y --no-modify-path --default-toolchain $RUST_VERSION; \
    rm rustup-init; \
    chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
    rustup --version; \
    cargo --version; \
    rustc --version;

WORKDIR /app
COPY ./mix* ./
RUN mix local.hex --force
RUN mix local.rebar --force
RUN export MIX_ENV=prod && mix deps.get --force
RUN cd deps/html5ever/native/html5ever_nif && cargo update
RUN export MIX_ENV=prod && mix deps.compile

COPY ./assets/package* ./assets/
RUN cd assets && npm i
COPY ./assets ./assets/
RUN cd assets && npm run build
RUN mkdir -p /app/priv/static/js
RUN cp /app/assets/node_modules/openpgp/dist/openpgp.worker.min.js /app/priv/static/js
RUN cp /app/assets/node_modules/openpgp/dist/openpgp.min.js /app/priv/static/js


COPY ./manifest.json ./priv/static/
COPY ./react-logo.png ./priv/static/images/
COPY ./ ./
RUN export MIX_ENV=prod && mix compile --force
RUN export MIX_ENV=prod && mix phx.digest
RUN rm -rf deps/*/.fetch

EXPOSE 4000
ENTRYPOINT [ "./docker-entrypoint.sh" ]
