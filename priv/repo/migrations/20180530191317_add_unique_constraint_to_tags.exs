defmodule App.Repo.Migrations.AddUniqueConstraintToTags do
  use Ecto.Migration

  def change do
    create unique_index(:tags, [:name, :team_id])
  end
end
