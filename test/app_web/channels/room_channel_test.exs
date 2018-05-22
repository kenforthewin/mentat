defmodule AppWeb.RoomChannelTest do
  use AppWeb.ChannelCase
  alias AppWeb.{UserSocket}
  alias App.{Repo, Team, User, Message}
  import Ecto.Query

  setup do
    lobby = Repo.insert!(%Team{name: "lobby"})
    {:ok, socket} = connect(UserSocket, %{"uuid" => "111"})
    {:ok, _, socket} = subscribe_and_join(socket, "room:lobby", %{"tags" => ["general"], "uuid" => "111", "color" => "#FFF"} )
    {:ok, socket: socket}
  end

  test "new_msg broadcasts to room:lobby", %{socket: socket} do
    ref = push socket, "new_msg", %{"uuid" => "111", "tags" => ["general"], "room" => "lobby", "text" => "hello world"}
    user = Repo.one(from u in User)
    name = user.name
    color = user.color
    assert_broadcast "new_msg", %{text: "hello world", name: name, color: color, tags: ["general"], room: "lobby"}
    assert_reply ref, :ok
    message = Repo.one(from m in Message)
    assert message.body == "hello world"
  end
end