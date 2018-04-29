defmodule App.Repo.Migrations.CreateTags do
  use Ecto.Migration

  def change do
    create table(:tags) do
      add :name, :string
      add :team_id, :integer

      timestamps()
    end
    create index(:tags, [:team_id])
  end
end
