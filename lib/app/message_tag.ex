defmodule App.MessageTag do
  use Ecto.Schema
  import Ecto.Changeset


  schema "message_tags" do
    belongs_to :message, App.Message
    belongs_to :tag, App.Tag
    timestamps()
  end

  @doc false
  def changeset(message_tag, attrs) do
    message_tag
    |> cast(attrs, [:tag_id, :message_id])
    |> validate_required([:tag_id, :message_id])
  end
end
