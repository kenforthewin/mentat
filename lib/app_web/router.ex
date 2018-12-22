defmodule AppWeb.Router do
  use AppWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :auth do
    plug App.UserManager.Pipeline
  end

  pipeline :ensure_auth do
    plug Guardian.Plug.EnsureAuthenticated
  end

  scope "/auth", AppWeb do
    pipe_through [:api, :auth]

    post "/login", UserController, :login
    post "/sign_up", UserController, :create
  end

  scope "/api", AppWeb, as: :api do
    pipe_through [:api, :auth, :ensure_auth]

    resources "/teams", TeamController
  end

  scope "/", AppWeb do
    pipe_through :browser # Use the default browser stack

    get "/*path", PageController, :index
  end

  # Other scopes may use custom stacks.
  # scope "/api", AppWeb do
  #   pipe_through :api
  # end
end
