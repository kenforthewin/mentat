defmodule AppWeb.TeamController do
  use AppWeb, :controller

  def create(conn, %{"uuid" => uuid}) do
    team = %App.Team{name: uuid}
    team = App.Repo.insert!(team)
    general_tag = App.Repo.insert!(%App.Tag{name: "general", team_id: team.id})
    random_tag = App.Repo.insert!(%App.Tag{name: "random", team_id: team.id})
    render conn, "team.json", team: team 
  end
end
