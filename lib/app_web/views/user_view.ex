defmodule AppWeb.UserView do
  use AppWeb, :view

  def render("index.json", %{users: users}) do
    %{users: render_many(users, AppWeb.UserView, "user.json")}
  end

  def render("user.json", %{user: user}) do
    %{uuid: user.uuid, name: user.name, avatar: user.avatar}
  end
end