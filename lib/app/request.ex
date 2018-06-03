defmodule App.Request do
  use Ecto.Schema
  import Ecto.Changeset


  schema "requests" do
    field :encrypted_team_private_key, :string
    field :user_public_key, :string
    field :team_public_key, :string
    belongs_to :user, App.User
    belongs_to :team, App.Team
    timestamps()
  end

  @doc false
  def changeset(request, attrs) do
    request
    |> cast(attrs, [:user_public_key, :encrypted_team_private_key, :user_id, :team_id, :team_public_key])
    |> validate_required([:user_public_key, :user_id, :team_id])
    |> unique_constraint(:user_id, name: :requests_user_id_team_id_index)
  end
end
