defmodule App.Repo.Migrations.AddNameIndexToTeams do
  use Ecto.Migration

  def change do
    create index(:teams, [:name])
  end
end
