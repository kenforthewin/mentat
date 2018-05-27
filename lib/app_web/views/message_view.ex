defmodule AppWeb.MessageView do
  use AppWeb, :view

  def render("index.json", %{messages: messages}) do
    %{messages: render_many(messages, AppWeb.MessageView, "message.json")}
  end

  def render("show.json", %{message: message}) do
    %{message: render_one(message, AppWeb.MessageView, "message.json")}
  end

  def render("message.json", %{message: message}) do
    %{id: message.id, body: message.body, inserted_at: message.inserted_at, tags: render_many(message.tags, AppWeb.MessageView, "message_tag.json"), user: render_one(message.user, AppWeb.MessageView, "message_user.json"), url_data: message.url_data}
  end

  def render("message_tag.json", tag) do
    %{name: tag.message.name}
  end

  def render("message_user.json", user) do
    %{name: user.message.name, color: user.message.color}
  end
end