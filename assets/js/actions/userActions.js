export const updateName = (name, color) => {
  return {
    type: 'set_name',
    name,
    color
  }
}

export const updateUrlPreviews = (urlPreviews) => {
  return {
    type: 'set_url_previews',
    urlPreviews
  }
}

export const signUp = (email, password) => {
  return (dispatch, getState) => {
    const state = getState()
    fetch('/api/sign_up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uuid: state.userReducer.uuid,
        email,
        password
      })
    }).then((response) => {
      return response.json();
    }).then((response) => {
      dispatch({
        type: 'sign_in',
        token: response.jwt
      })
    })
  }
}