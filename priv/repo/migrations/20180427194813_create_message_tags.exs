defmodule App.Repo.Migrations.CreateMessageTags do
  use Ecto.Migration

  def change do
    create table(:message_tags) do
      add :tag_id, :integer
      add :message_id, :integer

      timestamps()
    end
    create index(:message_tags, [:tag_id])
    create index(:message_tags, [:message_id])
  end
end
