defmodule App.Repo.Migrations.CreateMessages do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add :body, :text
      add :team_id, :integer
      add :user_id, :integer

      timestamps()
    end

    create index(:messages, [:team_id])
    create index(:messages, [:user_id])
  end
end
