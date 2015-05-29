chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('../mock.html', {
    'resizable': true,
    'state': 'maximized'
  });
});