defmodule AppWeb.UserView do
  use AppWeb, :view

  def render("index.json", %{users: users}) do
    %{users: render_many(users, AppWeb.UserView, "user.json")}
  end

  def render("user.json", %{user: user}) do
    %{uuid: user.uuid, name: user.name, avatar: user.avatar}
  end

  def render("session.json", %{jwt: jwt, id: id, name: name, color: color, public_key: public_key}) do
    %{jwt: jwt, id: id, name: name, color: color, public_key: public_key}
  end
end
