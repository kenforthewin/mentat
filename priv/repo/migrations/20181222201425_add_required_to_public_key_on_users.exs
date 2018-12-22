defmodule App.Repo.Migrations.AddRequiredToPublicKeyOnUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      modify :public_key, :text, null: false
    end
  end
end
