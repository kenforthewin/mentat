const INITIAL_STATE = {
  messages: {

  }
}

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'add_message':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.id]: action.message
        }
      }
    case 'new_url':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.id]: {
            ...state.messages[action.id],
            urlData: action.urlData
          }
        }
      }
    case 'new_tag':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.id]: {
            ...state.messages[action.id],
            tags: [
              ...state.messages[action.id].tags,
              action.tag
            ]
          }
        }
      }
    case 'update_tags':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.id]: {
            ...state.messages[action.id],
            tags: action.tags
          }
        }
      };
    default:
      return state;
  }
}