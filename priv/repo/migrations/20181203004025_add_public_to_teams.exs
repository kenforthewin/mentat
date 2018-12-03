defmodule App.Repo.Migrations.AddPublicToTeams do
  use Ecto.Migration

  def change do
    alter table(:teams) do
      add :public, :boolean, default: false
    end
  end
end
