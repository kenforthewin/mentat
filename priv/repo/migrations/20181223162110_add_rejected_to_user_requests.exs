defmodule App.Repo.Migrations.AddRejectedToUserRequests do
  use Ecto.Migration

  def change do
    alter table(:user_requests) do
      add :rejected, :boolean, null: false, default: false
    end
  end
end
