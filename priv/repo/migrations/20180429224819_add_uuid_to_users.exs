defmodule App.Repo.Migrations.AddUUIDToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :uuid, :string
    end
    create index(:users, [:uuid])
  end
end
