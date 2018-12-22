defmodule App.UserRequest do
  use Ecto.Schema
  import Ecto.Changeset

  schema "user_requests" do
    belongs_to :user, App.User
    field :public_key, :string
    field :encrypted_private_key, :string
    field :encrypted_passphrase, :string
  end

  @doc false
  def changeset(team, attrs) do
    team
    |> cast(attrs, [:user_id, :encrypted_private_key, :encrypted_passphrase])
    |> validate_required([:user_id, :public_key])
  end
end
