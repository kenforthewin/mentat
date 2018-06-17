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