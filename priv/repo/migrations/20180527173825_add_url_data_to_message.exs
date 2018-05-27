defmodule App.Repo.Migrations.AddUrlDataToMessage do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :url_data, :map
    end
  end
end
