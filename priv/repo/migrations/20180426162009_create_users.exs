defmodule App.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string
      add :team_id, :integer
      timestamps()
    end

    create index(:users, [:team_id])
  end
end
