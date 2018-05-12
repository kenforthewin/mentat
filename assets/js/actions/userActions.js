export const updateName = (name, color) => {
  return {
    type: 'set_name',
    name,
    color
  }
}