defmodule App.Repo.Migrations.CreateRequests do
  use Ecto.Migration

  def change do
    create table(:requests) do
      add :user_public_key, :text
      add :encrypted_team_private_key, :text
      add :user_id, :integer
      add :team_id, :integer

      timestamps()
    end

  end
end
