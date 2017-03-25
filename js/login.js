if (Cookies.get('isLoggedIn') !== 'true') {
  if (prompt('password') === 'badpassword') {
    Cookies.set('isLoggedIn', 'true')
  } else {
    window.location = 'https://google.com'
  }
}
