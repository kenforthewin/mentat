defmodule App.Repo.Migrations.AddClaimsToTeams do
  use Ecto.Migration

  def change do
      alter table(:teams) do
        add :claim_id, :integer
      end
  end
end
