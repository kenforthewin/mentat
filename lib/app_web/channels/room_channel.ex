defmodule AppWeb.RoomChannel do
  use Phoenix.Channel
  import Ecto.Query
  alias App.{Repo, Message, Tag, Team, MessageTag}
  alias AppWeb.{MessageView, TagView}

  def join("room:lobby", %{"tags" => tags}, socket) do
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == 1, select: t.id)

    messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == 1 and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    messages = Repo.preload messages, :tags
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    tags = Repo.all(from t in Tag, where: t.team_id == 1)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    {:ok, %{messages: rendered_todos, tags: rendered_tags}, socket}
  end

  def join("room:" <> _private_room_id, _params, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"name" => name, "room" => team, "tags" => tags, "text" => text}, socket) do
    # TODO run a set of validations on message here:
    #### 1. message length > 0
    #### 2. tags.length > 0
    #### 3. Each tag has string length > 0
    broadcast! socket, "new_msg", %{text: text, name: name, tags: tags, room: team}
    team_id = 1
    # team_id = Repo.one(from t in Team, where: t.name == ^team, select: t.id) 
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(tags, fn(t) ->
      if !Enum.any?(tag_ids, fn(i) -> i.name == t end) do
        tag = Repo.insert!(%Tag{team_id: team_id, name: t})
      end
    end)
    message = Repo.insert!(%Message{body: text, team_id: 1, user_id: 1})
    final_tags = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == ^team_id)
    Enum.each(final_tags, fn(t) -> Repo.insert!(%MessageTag{message_id: message.id, tag_id: t.id}) end)
    {:noreply, socket}
  end

  def handle_in("new_tags", %{"room" => team, "tags" => tags}, socket) do
    tag_ids = Repo.all(from t in Tag, where: t.name in ^tags and t.team_id == 1, select: t.id)
    messages = Repo.all(from m in Message, join: t in MessageTag, on:  m.id == t.message_id, where: m.team_id == 1 and t.tag_id in ^tag_ids, order_by: [desc: m.inserted_at], limit: 15, distinct: true )
    messages = Repo.preload messages, :tags
    rendered_todos = MessageView.render("index.json", %{messages: messages})
    broadcast! socket, "new_tags", rendered_todos
    {:noreply, socket}
  end

  def handle_in("get_tags", %{"room" => team}, socket) do
    tags = Repo.all(from t in Tag, where: t.team_id == 1)
    rendered_tags = TagView.render("index.json", %{tags: tags})
    broadcast! socket, "get_tags", rendered_tags
    {:noreply, socket}
  end
end