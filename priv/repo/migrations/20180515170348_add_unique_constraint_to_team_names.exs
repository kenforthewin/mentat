defmodule App.Repo.Migrations.AddUniqueConstraintToTeamNames do
  use Ecto.Migration

  def change do
    drop index(:teams, [:name])

    create unique_index(:teams, [:name])
  end
end
