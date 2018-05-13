defmodule AppWeb.RoomChannel do
  use Phoenix.Channel
  import Ecto.Query
  require Logger
  alias App.{Repo, Message, Tag, Team, MessageTag, User}
  alias AppWeb.{MessageView, TagView, Presence}

  def join("room:lobby", %{"tags" => tags, "uuid" => uuid, "color" => color}, socket) do
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == 1, select: t.id)
    user = Repo.one(from u in User, where: u.uuid == ^uuid) || Repo.insert!(%User{uuid: uuid, color: color})
    messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == 1 and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    tags = Repo.all(from t in Tag, where: t.team_id == 1)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    send(self(), :after_join)
    {:ok, %{messages: rendered_todos, tags: rendered_tags, name: user.name, color: user.color}, socket}
  end

  def join("user_room:" <> uuid, params, socket) do
    # user_room handles events such as:
    ## - user scrolls up to load previous messages
    user = Repo.one(from u in User, where: u.uuid == ^uuid) || Repo.insert!(%User{uuid: uuid})
    {:ok, %{}, socket}
  end

  def handle_in("more_messages", %{"id" => id, "tags" => tags}, socket) do
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == 1, select: t.id)
    messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == 1 and t.tag_id in ^tag_ids and m.id < ^id, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_messages = MessageView.render("index.json", %{messages: messages})
    tags = Repo.all(from t in Tag, where: t.team_id == 1)
    broadcast! socket, "more_messages", %{messages: rendered_messages}
    {:noreply, socket}
  end

  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"uuid" => uuid, "room" => team, "tags" => tags, "text" => text}, socket) do
    # TODO run a set of validations on message here:
    #### 1. message length > 0
    #### 2. tags.length > 0
    #### 3. Each tag has string length > 0
    user = Repo.one(from u in User, where: u.uuid == ^uuid)
    team_id = 1
    # team_id = Repo.one(from t in Team, where: t.name == ^team, select: t.id) 
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(tags, fn(t) ->
      if !Enum.any?(tag_ids, fn(i) -> i.name == t end) do
        tag = Repo.insert!(%Tag{team_id: team_id, name: t})
      end
    end)
    message = Repo.insert!(%Message{body: text, team_id: 1, user_id: user.id})
    broadcast! socket, "new_msg", %{text: text, name: user.name, color: user.color, tags: tags, room: team, id: message.id}
    final_tags = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(final_tags, fn(t) -> Repo.insert!(%MessageTag{message_id: message.id, tag_id: t.id}) end)
    {:noreply, socket}
  end

  def handle_in("new_tags", %{"room" => team, "tags" => tags, "uuid" => uuid}, socket) do
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == 1, select: t.id)
    messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == 1 and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    broadcast! socket, "new_tags", %{messages: rendered_todos, uuid: uuid}
    {:noreply, socket}
  end

  def handle_in("get_tags", %{"room" => team}, socket) do
    tags = Repo.all(from t in Tag, where: t.team_id == 1)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    broadcast! socket, "get_tags", rendered_tags
    {:noreply, socket}
  end

  def handle_in("new_name", %{"uuid" => uuid, "name" => name, "color" => color}, socket) do
    user = Repo.one(from u in User, where: u.uuid == ^uuid)
    user = Ecto.Changeset.change(user, %{name: name, color: color})
    Repo.update!(user)
    {:noreply, socket}
  end

  def handle_in("new_typing", %{"uuid" => uuid, "typing" => typing}, socket) do
    broadcast! socket, "new_typing", %{uuid: uuid, typing: typing}
    {:noreply, socket}
  end

  def handle_in("approve_request", %{"encryptedGroupPrivateKey" => encrypted_group_private_key, "uuid" => uuid, "groupPublicKey" => group_public_key}, socket) do
    broadcast! socket, "approve_request", %{uuid: uuid, encrypted_group_private_key: encrypted_group_private_key, group_public_key: group_public_key}
    {:noreply, socket}
  end

  def handle_in("new_claim_or_invite", %{"uuid" => uuid, "name" => name, "publicKey" => public_key}, socket) do
    team_id = 1
    team = Repo.one(from t in Team, where: t.id == ^team_id)
    if (!team.claim_uuid) do
      team = Ecto.Changeset.change(team, %{claim_uuid: uuid})
      Repo.update!(team)
      broadcast! socket, "new_claim_or_invite", %{uuid: uuid, claimed: true}
    else
      if team.claim_uuid == uuid do
        broadcast! socket, "new_claim_or_invite", %{uuid: uuid, claimed: true}
      else
        broadcast! socket, "new_claim_or_invite", %{uuid: uuid, claimed: false, name: name, public_key: public_key}
      end
    end
    {:noreply, socket}
  end

  def handle_info(:after_join, socket) do
    push socket, "presence_state", Presence.list(socket)
    uuid = socket.assigns.uuid
    user = Repo.one(from u in User, where: u.uuid == ^uuid)

    {:ok, _} = Presence.track(socket, socket.assigns.uuid, %{
      online_at: inspect(System.system_time(:seconds)),
      name: user.name,
      color: user.color
    })
    {:noreply, socket}
  end
end