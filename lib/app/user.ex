defmodule App.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Comeonin.Bcrypt

  schema "users" do
    field :name, :string
    field :color, :string
    field :avatar, :string
    field :public_key, :string
    field :email, :string
    field :encrypted_password, :string
    belongs_to :team, App.Team
    has_many :messages, App.Message
    has_many :user_requests, App.UserRequest
    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :team_id, :color, :avatar, :public_key, :email, :encrypted_password])
    |> validate_required([:email, :encrypted_password, :public_key])
    |> validate_format(:email, ~r/\A[^@\s]+@([^@\s]+\.)+[^@\W]+\z/)
    |> validate_length(:encrypted_password, min: 8)
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp put_password_hash(%Ecto.Changeset{valid?: true, changes: %{encrypted_password: encrypted_password}} = changeset) do
    change(changeset, encrypted_password: Bcrypt.hashpwsalt(encrypted_password))
  end

  defp put_password_hash(changeset), do: changeset
end
