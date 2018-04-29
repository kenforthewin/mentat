defmodule App.User do
  use Ecto.Schema
  import Ecto.Changeset


  schema "users" do
    field :name, :string
    belongs_to :team, App.Team
    has_many :messages, App.Message
    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :team_id])
    |> validate_required([:name, :team_id])
  end
end
