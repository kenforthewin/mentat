const INITIAL_STATE = {
  uuid: null,
  name: '',
  color: '#'+Math.floor(Math.random()*16777215).toString(16),
  urlPreviews: true,
  token: null,
  authErrors: {}
}

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case '@@router/LOCATION_CHANGE':
      return {
        ...state,
        authErrors: {}
      }
    case 'expire_token':
      return {
        ...state,
        token: null
      }
    case 'set_name':
      return {
        ...state,
        name: action.name,
        color: action.color
      }
    case 'auth_errors':
      return {
        ...state,
        authErrors: action.errors
      }
    case 'burn_browser':
      return INITIAL_STATE;
    case 'set_url_previews':
      return {
        ...state,
        urlPreviews: action.urlPreviews
      }
    case 'sign_in':
      return {
        ...state,
        token: action.token,
        uuid: action.id,
        color: action.color,
        name: action.name,
        authErrors: {}
      }
    default:
      return state;
  }
}