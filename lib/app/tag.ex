defmodule App.Tag do
  use Ecto.Schema
  import Ecto.Changeset


  schema "tags" do
    field :name, :string
    belongs_to :team, App.Team
    has_many :message_tags, App.MessageTag
    many_to_many :messages, App.Message, join_through: "message_tags"

    timestamps()
  end

  @doc false
  def changeset(tag, attrs) do
    tag
    |> cast(attrs, [:name, :team_id])
    |> validate_required([:name, :team_id])
    |> validate_length(:name, min: 1)
    |> unique_constraint(:name, name: :tags_name_team_id_index)
  end
end
