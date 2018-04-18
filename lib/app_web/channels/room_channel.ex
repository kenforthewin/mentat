defmodule AppWeb.RoomChannel do
  use Phoenix.Channel

  def join("room:lobby", _message, socket) do
    {:ok, socket}
  end
  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"text" => text, "name" => name}, socket) do
    broadcast! socket, "new_msg", %{text: text, name: name}
    {:noreply, socket}
  end
end