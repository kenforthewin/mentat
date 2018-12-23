defmodule AppWeb.UserRequestView do
  use AppWeb, :view

  def render("index.json", %{user_requests: user_requests}) do
    %{user_requests: render_many(user_requests, AppWeb.UserRequestView, "user_request.json")}
  end

  def render("user_request.json", %{user_request: user_request}) do
    %{public_key: user_request.public_key, encrypted_private_key: user_request.encrypted_private_key, encrypted_passphrase: user_request.encrypted_passphrase}
  end
end
