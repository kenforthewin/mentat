defmodule App.Repo.Migrations.AddBodyIndexToTags do
  use Ecto.Migration

  def change do
    create index(:tags, [:name])
  end
end
