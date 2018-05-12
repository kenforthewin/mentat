defmodule App.Repo.Migrations.AddColorToUser do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :color, :string
    end
  end
end
