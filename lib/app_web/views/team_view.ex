defmodule AppWeb.TeamView do
  use AppWeb, :view

  def render("team.json", %{team: team}) do
    %{uuid: team.name, nickname: team.nickname}
  end
end