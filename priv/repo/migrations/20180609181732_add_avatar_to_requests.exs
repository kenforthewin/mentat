defmodule App.Repo.Migrations.AddAvatarToRequests do
  use Ecto.Migration

  def change do
    alter table(:requests) do
      add :avatar, :text
    end
  end
end
