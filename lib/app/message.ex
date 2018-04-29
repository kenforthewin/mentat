defmodule App.Message do
  use Ecto.Schema
  import Ecto.Changeset

  schema "messages" do
    field :body, :string
    has_many :message_tags, App.MessageTag
    many_to_many :tags, App.Tag, join_through: "message_tags"
    belongs_to :user, App.User
    belongs_to :team, App.Team
    timestamps()
  end

  @doc false
  def changeset(message, attrs) do
    message
    |> cast(attrs, [:body, :team_id, :user_id])
    |> validate_required([:body, :team_id, :user_id])
  end
end
