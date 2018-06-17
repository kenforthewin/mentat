import uuidv1 from 'uuid/v1';

const INITIAL_STATE = {
  uuid: uuidv1(),
  name: '',
  color: '#'+Math.floor(Math.random()*16777215).toString(16),
  urlPreviews: true
}

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'set_name':
      return {
        ...state,
        name: action.name,
        color: action.color
      }
    case 'burn_browser':
      return INITIAL_STATE;
    case 'set_url_previews':
      return {
        ...state,
        urlPreviews: action.urlPreviews
      }
    default:
      return state;
  }
}