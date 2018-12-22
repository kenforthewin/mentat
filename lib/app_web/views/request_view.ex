defmodule AppWeb.RequestView do
  use AppWeb, :view

  def render("index.json", %{requests: requests}) do
    %{requests: render_many(requests, AppWeb.RequestView, "request.json")}
  end

  def render("request.json", %{request: request}) do
    %{encrypted_team_private_key: request.encrypted_team_private_key, user_public_key: request.user_public_key, uuid: request.user.id, name: request.user.name, avatar: request.avatar}
  end
end