export default (state = { lastSynced: null, users: {} }, action) => {
  switch (action.type) {
    case 'add_user':
      return {
        ...state,
        users: {
          ...state.users,
          [action.user.uuid]: action.user
        }
      }
    case 'set_last_synced':
      return {
        ...state,
        lastSynced: action.lastSynced
      }
    case 'burn_browser':
      return INITIAL_STATE;
    default:
      return state;
  }
}