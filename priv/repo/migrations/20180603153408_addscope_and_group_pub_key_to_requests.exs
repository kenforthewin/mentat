defmodule App.Repo.Migrations.AddscopeAndGroupPubKeyToRequests do
  use Ecto.Migration

  def change do
    create unique_index(:requests, [:user_id, :team_id])
    alter table(:requests) do
      add :team_public_key, :text
    end
  end
end
