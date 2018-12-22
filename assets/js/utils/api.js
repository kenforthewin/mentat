export const isAuthenticated = (userReducer) => {
  return !!userReducer.token
}

