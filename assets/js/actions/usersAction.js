export const addUser = (user) => {
  return {
    type: 'add_user',
    user
  }
}

export const setLastSynced = (lastSynced) => {
  return {
    type: 'set_last_synced',
    lastSynced
  }
}