defmodule AppWeb.TagView do
  use AppWeb, :view

  def render("index.json", %{tags: tags}) do
    %{tags: render_many(tags, AppWeb.TagView, "tag.json")}
  end

  def render("tag.json", %{tag: tag}) do
    %{name: tag.name}
  end
end