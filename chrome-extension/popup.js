// Check if user is logged in
chrome.storage.local.get(['supabase_token', 'user_id'], (result) => {
  const isLoggedIn = !!(result.supabase_token && result.user_id);
  
  if (!isLoggedIn) {
    document.getElementById('authWarning').style.display = 'flex';
  }
});

// Open dashboard
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

// Open login
document.getElementById('loginBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/login' });
});