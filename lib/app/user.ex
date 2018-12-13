defmodule App.User do
  use Ecto.Schema
  import Ecto.Changeset


  schema "users" do
    field :name, :string
    field :uuid, :string
    field :color, :string
    field :avatar, :string
    field :public_key, :string
    belongs_to :team, App.Team
    has_many :messages, App.Message
    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :team_id, :uuid, :color, :avatar, :public_key])
    |> validate_required([:uuid])
  end
end
