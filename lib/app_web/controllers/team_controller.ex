defmodule AppWeb.TeamController do
  use AppWeb, :controller

  def create(conn, %{"uuid" => uuid, "name" => nickname}) do
    team = %App.Team{name: uuid, nickname: nickname}
    team = App.Repo.insert!(team)
    # App.Repo.insert!(%App.Tag{name: "memes", team_id: team.id})
    render conn, "team.json", team: team 
  end
end
