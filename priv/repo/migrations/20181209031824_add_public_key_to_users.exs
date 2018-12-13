defmodule App.Repo.Migrations.AddPublicKeyToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :public_key, :text
    end
  end
end
