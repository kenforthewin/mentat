defmodule App.Team do
  use Ecto.Schema
  import Ecto.Changeset

  schema "teams" do
    field :name, :string
    field :claim_uuid, :string
    field :nickname, :string
    field :public, :boolean
    has_many :users, App.User
    has_many :messages, App.Message
    has_many :tags, App.Tag
    timestamps()
  end

  @doc false
  def changeset(team, attrs) do
    team
    |> cast(attrs, [:name, :claim_uuid, :nickname])
    |> validate_required([:name, :public])
  end
end
