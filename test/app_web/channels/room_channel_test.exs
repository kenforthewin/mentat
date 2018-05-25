defmodule AppWeb.RoomChannelTest do
  use AppWeb.ChannelCase
  alias AppWeb.{UserSocket}
  alias App.{Repo, Team, User, Message, Tag, MessageTag}
  import Ecto.Query

  setup do
    Repo.insert!(%Team{name: "lobby"})
    {:ok, socket} = connect(UserSocket, %{"uuid" => "111"})
    {:ok, _, socket} = subscribe_and_join(socket, "room:lobby", %{"tags" => ["general"], "uuid" => "111", "color" => "#FFF"} )
    {:ok, socket: socket}
  end

  test "new_msg broadcasts to room:lobby, creates a Tag and MessageTag", %{socket: socket} do
    ref = push socket, "new_msg", %{"uuid" => "111", "tags" => ["general"], "room" => "lobby", "text" => "hello world"}
    user = Repo.one(from u in User)
    name = user.name
    color = user.color
    assert_broadcast "new_msg", %{text: "hello world", name: name, color: color, tags: ["general"], room: "lobby"}
    assert_reply ref, :ok
    message = Repo.one(from m in Message)
    tag = Repo.one(from t in Tag)
    message_tag = Repo.one(from mt in MessageTag)
    assert message.body == "hello world"
    assert tag.name == "general"
    assert message_tag.message_id == message.id
  end

  test "new_message doesn't create a Tag if it already exists", %{socket: socket} do
    ref = push socket, "new_msg", %{"uuid" => "111", "tags" => ["general"], "room" => "lobby", "text" => "hello world"}
    assert_reply ref, :ok
    tag_count = Repo.aggregate(Tag, :count, :id)
    message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    assert tag_count == 1
    assert message_tag_count == 1
    ref = push socket, "new_msg", %{"uuid" => "111", "tags" => ["general"], "room" => "lobby", "text" => "hello world"}
    assert_reply ref, :ok
    new_tag_count = Repo.aggregate(Tag, :count, :id)
    assert new_tag_count == tag_count
    new_message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    assert new_message_tag_count == 2
  end

  test "new_name broadcasts to room:lobby", %{socket: socket} do
    push socket, "new_name", %{"uuid" => "111", "name" => "Test McTestface", "color" => "#AAA"}
    assert_broadcast "new_name", %{name: "Test McTestface", uuid: "111", color: "#AAA"}
    user = Repo.one(from u in User)
    assert user.name == "Test McTestface"
    assert user.color == "#AAA"
  end

  test "new_typing true pushes true to channel", %{socket: socket} do
    push socket, "new_typing", %{"uuid" => "111", "typing" => true}
    assert_broadcast "new_typing", %{uuid: "111", typing: true}
  end

  test "new_typing false pushes false to channel", %{socket: socket} do
    push socket, "new_typing", %{"uuid" => "111", "typing" => false}
    assert_broadcast "new_typing", %{uuid: "111", typing: false}
  end

  test "new_message_tag adds the tag only if it does not exist, and adds a message_tag + broadcasts only when the message_tag doesn't already exist", %{socket: socket} do
    message = Repo.insert!(%Message{body: "hello world"})
    message_id = message.id
    message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    tag_count = Repo.aggregate(Tag, :count, :id)
    assert message_tag_count == 0
    assert tag_count == 0
    push socket, "new_message_tag", %{"id" => message_id, "newTag" => "random"}
    assert_broadcast "new_message_tag", %{id: message_id, new_tag: "random"}
    new_message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    new_tag_count = Repo.aggregate(Tag, :count, :id)
    assert new_message_tag_count == 1
    assert new_tag_count == 1

    ref = push socket, "new_message_tag", %{"id" => message_id, "newTag" => "random"}
    assert_reply ref, :ok
    newer_message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    newer_tag_count = Repo.aggregate(Tag, :count, :id)
    assert newer_message_tag_count == 1
    assert newer_tag_count == 1

    team = Repo.one(from t in Team)
    Repo.insert!(%Tag{team_id: team.id, name: "new_one"})
    tag_already_exists_count = Repo.aggregate(Tag, :count, :id)
    assert tag_already_exists_count == 2
    push socket, "new_message_tag", %{"id" => message_id, "newTag" => "new_one"}
    assert_broadcast "new_message_tag", %{id: message_id, new_tag: "new_one"}

    tag_already_exists_after_push_count = Repo.aggregate(Tag, :count, :id)
    assert tag_already_exists_after_push_count == 2
    newest_message_tag_count = Repo.aggregate(MessageTag, :count, :id)
    assert newest_message_tag_count == 2
  end

  test "approve_request sends group public key, encrypted private key, and uuid", %{socket: socket} do
    push socket, "approve_request", %{"encryptedGroupPrivateKey" => "aaa", "uuid" => "111", "groupPublicKey" => "bbb"}
    assert_broadcast "approve_request", %{uuid: "111", encrypted_group_private_key: "aaa", group_public_key: "bbb"}
  end

  test "new_claim_or_invite claims room with no claim uuid", %{socket: socket} do
    push socket, "new_claim_or_invite", %{"uuid" => "111", "name" => "JimBob", "publicKey" => "aaa"}
    assert_broadcast "new_claim_or_invite", %{uuid: "111", claimed: true}
  end

  test "new_claim_or_invite doesn't claim room with current claim uuid", %{socket: socket} do
    team = Repo.one(from t in Team)
    team = Ecto.Changeset.change(team, %{claim_uuid: "222"})
    team = Repo.update!(team)
    push socket, "new_claim_or_invite", %{"uuid" => "111", "name" => "JimBob", "publicKey" => "aaa"}
    assert_broadcast "new_claim_or_invite", %{uuid: "111", claimed: false}
  end
end