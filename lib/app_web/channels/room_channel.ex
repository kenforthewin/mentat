defmodule AppWeb.RoomChannel do
  use Phoenix.Channel
  import Ecto.Query
  require Logger
  alias App.{Repo, Message, Tag, Team, MessageTag, User}
  alias AppWeb.{MessageView, TagView, Presence}

  def join("room:" <> private_room_id, %{"tags" => tags, "uuid" => uuid, "color" => color}, socket) do
    team = Repo.one(from t in Team, where: t.name == ^private_room_id)
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team.id, select: t.id)
    user = Repo.one(from u in User, where: u.uuid == ^uuid) || Repo.insert!(%User{uuid: uuid, color: color})
    if length(tag_ids) > 0 do
      messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == ^team.id and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    else
      messages = Repo.all(from m in Message, where: m.team_id == ^team.id, order_by: [desc: m.inserted_at], limit: 15)
    end

    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    tags = Repo.all(from t in Tag, where: t.team_id == ^team.id)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    send(self(), :after_join)
    {:ok, %{messages: rendered_todos, tags: rendered_tags, name: user.name, color: user.color}, assign(socket, :team_id, team.id)}
  end
  
  def join("user_room:" <> uuid, %{"room" => private_room_id}, socket) do
    team = Repo.one(from t in Team, where: t.name == ^private_room_id)

    # user_room handles events such as:
    ## - user scrolls up to load previous messages
    user = Repo.one(from u in User, where: u.uuid == ^uuid) || Repo.insert!(%User{uuid: uuid})
    {:ok, %{}, assign(socket, :team_id, team.id)}
  end

  def handle_in("more_messages", %{"id" => id, "tags" => tags, "room" => team}, socket) do
    team_id = socket.assigns.team_id

    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id, select: t.id)
    if length(tag_ids) > 0 do
      messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == ^team_id and t.tag_id in ^tag_ids and m.id < ^id, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    else
      messages = Repo.all(from m in Message, where: m.team_id == ^team_id and m.id < ^id, order_by: [desc: m.inserted_at], limit: 15)
    end
    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_messages = MessageView.render("index.json", %{messages: messages})
    broadcast! socket, "more_messages", %{messages: rendered_messages, room: team}
    {:noreply, socket}
  end


  def handle_in("new_msg", %{"uuid" => uuid, "room" => team, "tags" => tags, "text" => text}, socket) do
    # TODO run a set of validations on message here:
    #### 3. Each tag has string length > 0

    user = Repo.one(from u in User, where: u.uuid == ^uuid)
    team_id = socket.assigns.team_id
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(tags, fn(t) -> if !Enum.any?(tag_ids, fn(i) -> i.name == t end), do: tag = Repo.insert!(%Tag{team_id: team_id, name: t}) end)
    message = Repo.insert!(%Message{body: text, team_id: team_id, user_id: user.id})
    broadcast! socket, "new_msg", %{text: text, name: user.name, color: user.color, tags: tags, room: team, id: message.id}
    final_tags = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(final_tags, fn(t) -> Repo.insert!(%MessageTag{message_id: message.id, tag_id: t.id}) end)
    {:reply, {:ok, %{}}, socket}
  end

  def handle_in("new_tags", %{"room" => team, "tags" => tags, "uuid" => uuid}, socket) do
    team_id = socket.assigns.team_id
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id, select: t.id)
    if length(tag_ids) > 0 do
      messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == ^team_id and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    else
      messages = Repo.all(from m in Message, where: m.team_id == ^team_id, order_by: [desc: m.inserted_at], limit: 15)
    end
    messages = Repo.preload messages, :tags
    messages = Repo.preload messages, :user
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    broadcast! socket, "new_tags", %{messages: rendered_todos, uuid: uuid}
    {:noreply, socket}
  end

  def handle_in("get_tags", %{"room" => team}, socket) do
    tags = Repo.all(from t in Tag, where: t.team_id == ^socket.assigns.team_id)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    broadcast! socket, "get_tags", rendered_tags
    {:noreply, socket}
  end

  def handle_in("new_message_tag", %{"id" => id, "newTag" => new_tag}, socket) do
    team_id = socket.assigns.team_id
    tag = Repo.one(from t in Tag, where: t.team_id == ^team_id and t.name == ^new_tag)
    if !tag do
      tag = Repo.insert!(%Tag{team_id: team_id, name: new_tag})
      Repo.insert!(%MessageTag{message_id: id, tag_id: tag.id})
      broadcast! socket, "new_message_tag", %{id: id, new_tag: new_tag}
    else
      message_tag = Repo.one(from t in MessageTag, where: t.tag_id == ^tag.id and t.message_id == ^id)
      if !message_tag do
        Repo.insert!(%MessageTag{message_id: id, tag_id: tag.id})
        broadcast! socket, "new_message_tag", %{id: id, new_tag: new_tag}
      end
    end
    {:noreply, socket}
  end

  def handle_in("new_name", %{"uuid" => uuid, "name" => name, "color" => color}, socket) do
    user = Repo.one(from u in User, where: u.uuid == ^uuid)
    user = Ecto.Changeset.change(user, %{name: name, color: color})
    Repo.update!(user)
    broadcast! socket, "new_name", %{ name: name, uuid: uuid, color: color }
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
    team_id = socket.assigns.team_id
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