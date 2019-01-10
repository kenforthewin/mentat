defmodule AppWeb.UserChannel do
  use Phoenix.Channel
  require Logger
  alias App.{Repo, User, UserRequest, Request}
  import Ecto.Query

  def join("user:" <> user_id, %{"publicKey" => public_key}, socket) do
    {parsed_user_id, _} = Integer.parse(user_id)
    user = Guardian.Phoenix.Socket.current_resource(socket)
    case parsed_user_id == user.id do
      false -> 
        {:error, %{}}
      _ ->
        has_keys = public_key == user.public_key
        case has_keys do
          false ->
            user_request = Repo.one(from r in UserRequest, where: r.public_key == ^public_key and r.user_id == ^user.id)
            case !!user_request do
              false ->
                Repo.insert!(UserRequest.changeset(%UserRequest{}, %{user_id: user.id, public_key: public_key, rejected: false}))
                socket = assign(socket, :public_key, public_key)
                send(self, :after_join)
                {:ok, %{has_keys: has_keys}, socket}
              _ ->
                case !!user_request.encrypted_private_key do
                  false ->
                    {:ok, %{has_keys: has_keys}, socket}
                  _ ->
                    requests = Repo.all(from r in Request, where: r.user_id == ^user.id)
                    requests = Repo.preload requests, [:user, :team]
                    rendered_requests = AppWeb.RequestView.render("index.json", %{requests: requests})
                    {:ok, %{has_keys: has_keys, public_key: user.public_key, encrypted_private_key: user_request.encrypted_private_key, encrypted_passphrase: user_request.encrypted_passphrase, requests: rendered_requests}, socket}
                end
            end
          _ ->
            user_requests = Repo.all(from r in UserRequest, where: r.user_id == ^user.id and is_nil(r.encrypted_private_key) and not r.rejected)
            rendered_user_requests = AppWeb.UserRequestView.render("index.json", %{user_requests: user_requests})
            requests = Repo.all(from r in Request, where: r.user_id == ^user.id and not is_nil(r.encrypted_team_private_key))
            requests = Repo.preload requests, [:user, :team]
            rendered_requests = AppWeb.RequestView.render("index.json", %{requests: requests})
            {:ok, %{has_keys: has_keys, user_requests: rendered_user_requests, requests: rendered_requests}, socket}
        end
    end
  end

  def handle_in("approve_user_request", %{"publicKey" => public_key, "encryptedPrivateKey" => encrypted_private_key, "encryptedPassphrase" => encrypted_passphrase}, socket) do
    user = Guardian.Phoenix.Socket.current_resource(socket)
    user_request = Repo.one(from r in UserRequest, where: r.public_key == ^public_key and r.user_id == ^user.id)
    user_request = Repo.update!(UserRequest.changeset(user_request, %{encrypted_private_key: encrypted_private_key, encrypted_passphrase: encrypted_passphrase}))
    requests = Repo.all(from r in Request, where: r.user_id == ^user.id)
    requests = Repo.preload requests, [:user, :team]
    rendered_requests = AppWeb.RequestView.render("index.json", %{requests: requests})
    broadcast! socket, "approve_user_request", %{public_key: public_key, new_public_key: user.public_key, encrypted_private_key: encrypted_private_key, encrypted_passphrase: encrypted_passphrase, requests: rendered_requests}
    {:reply, {:ok, %{}}, socket}
  end

  def handle_in("reject_user_request", %{"publicKey" => public_key}, socket) do
    user = Guardian.Phoenix.Socket.current_resource(socket)
    user_request = Repo.one(from r in UserRequest, where: r.public_key == ^public_key and r.user_id == ^user.id)
    user_request = Repo.update!(UserRequest.changeset(user_request, %{rejected: true}))
    {:reply, {:ok, %{}}, socket}
  end

  def handle_in("approve_import_key", %{"devicePublicKey" => public_key, "userPublicKey" => user_public_key}, socket) do
    user = Guardian.Phoenix.Socket.current_resource(socket)
    user_request = Repo.one(from r in UserRequest, where: r.public_key == ^public_key and r.user_id == ^user.id)

    if user_public_key == user.public_key do
      Repo.update!(UserRequest.changeset(user_request, %{encrypted_private_key: "---"}))
      requests = Repo.all(from r in Request, where: r.user_id == ^user.id)
      requests = Repo.preload requests, [:user, :team]
      rendered_requests = AppWeb.RequestView.render("index.json", %{requests: requests})
      {:reply, {:ok, %{requests: rendered_requests}}, socket}
    else
      {:reply, {:error, %{}}, socket}
    end
  end

  def handle_info(:after_join, socket) do
    broadcast! socket, "user_request", %{public_key: socket.assigns.public_key}
    {:noreply, socket}
  end
end
