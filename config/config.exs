# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :app,
  ecto_repos: [App.Repo]

# Configures the endpoint
config :app, AppWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "dEuF49PzQHWcYkUeEiswToC575o5KGohPhcKvL/kt8ZebaA3HC9ziJOkPf2oLG0e",
  render_errors: [view: AppWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: App.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:user_id]

config :app, App.UserManager.Guardian,
  issuer: "app",
  secret_key: "wG2uSgkaxW+Bg0tytAvdtr2k863DzJjaIEE1MuB1yjyoaX1O+Snh8u0CwCkiv2t2"

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
