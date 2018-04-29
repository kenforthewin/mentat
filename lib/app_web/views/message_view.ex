defmodule AppWeb.MessageView do
  use AppWeb, :view

  def render("index.json", %{messages: messages}) do
    %{messages: render_many(messages, AppWeb.MessageView, "message.json")}
  end

  def render("show.json", %{message: message}) do
    %{message: render_one(message, AppWeb.MessageView, "message.json")}
  end

  def render("message.json", %{message: message}) do
    %{body: message.body, inserted_at: message.inserted_at, tags: render_many(message.tags, AppWeb.MessageView, "message_tag.json")}
  end

  def render("message_tag.json", tag) do
    %{name: tag.message.name}
  end

end