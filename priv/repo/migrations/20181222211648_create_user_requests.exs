defmodule App.Repo.Migrations.CreateUserRequests do
  use Ecto.Migration

  def change do
    create table(:user_requests) do
      add :public_key, :text, null: false
      add :encrypted_private_key, :text
      add :encrypted_passphrase, :text
      add :user_id, :integer, null: false
      timestamps()
    end

    create index(:user_requests, [:user_id])
  end
end
