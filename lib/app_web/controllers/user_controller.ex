defmodule AppWeb.UserController do
  use AppWeb, :controller
  alias App.{UserManager, UserManager.Guardian, User, Repo}
  import AppWeb.ErrorHelpers

  def login(conn, %{"email" => email, "password" => password}) do
    UserManager.authenticate_user(email, password)
    |> login_reply(conn)
  end

  def create(conn, %{"email" => email, "password" => password, "publicKey" => public_key, "color" => color}) do
    Repo.insert(User.changeset(%User{}, %{encrypted_password: password, email: email, public_key: public_key, color: color, name: email}))
    |> create_reply(conn, password)
  end

  defp create_reply({:ok, user}, conn, password) do
    UserManager.authenticate_user(user.email, password)
    |> login_reply(conn)
  end

  defp create_reply({:error, user}, conn, _) do
    conn
    |> put_status(:bad_request)
    |> json(%{errors: Ecto.Changeset.traverse_errors(user, &translate_error/1)})
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
    render(conn, "session.json", jwt: jwt, id: user.id, name: user.name, color: user.color, public_key: user.public_key)
  end

  defp login_reply({:error, reason}, conn) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: reason})
  end
end
