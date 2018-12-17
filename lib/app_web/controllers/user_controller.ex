defmodule AppWeb.UserController do
  use AppWeb, :controller
  alias App.{UserManager, UserManager.Guardian, User, Repo}

  def login(conn, %{"user" => %{"email" => email, "password" => password}}) do
    UserManager.authenticate_user(email, password)
    |> login_reply(conn)
  end

  def create(conn, %{"uuid" => uuid, "email" => email, "password" => password}) do
    Repo.insert!(User.changeset(%User{}, %{encrypted_password: password, email: email, uuid: uuid}))
    UserManager.authenticate_user(email, password)
    |> login_reply(conn)
  end

  # def logout(conn, _) do
  #   conn
  #   |> Guardian.Plug.sign_out()
  #   |> redirect(to: "/login")
  # end

  defp login_reply({:ok, user}, conn) do
    conn = Guardian.Plug.sign_in(conn, user)
    jwt = Guardian.Plug.current_token(conn)
    claims = Guardian.Plug.current_claims(conn)
    render(conn, "session.json", jwt: jwt)
  end

  # defp login_reply({:error, reason}, conn) do
  #   conn
  #   |> put_flash(:error, to_string(reason))
  #   |> new(%{})
  # end
end
