defmodule AppWeb.UserChannel do
  use Phoenix.Channel
  require Logger
  alias App.{Repo, User, UserRequest}

  def join("user:" <> user_id, %{"publicKey" => public_key}, socket) do
    {parsed_user_id, _} = Integer.parse(user_id)
    user = Guardian.Phoenix.Socket.current_resource(socket)
    case parsed_user_id == user.id do
      false -> 
        {:error, %{}}
      _ ->
        has_keys = public_key == user.public_key
        if (!has_keys) do
          Repo.insert!(UserRequest.changeset(%UserRequest{}, %{user_id: user.id, public_key: public_key}))
          broadcast! socket, "user_request", %{public_key: public_key}
        end
        {:ok, %{has_keys: has_keys}, socket}
    end
  end
end
