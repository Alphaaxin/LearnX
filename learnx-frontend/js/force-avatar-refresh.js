/**
 * Force Avatar Refresh
 * This script forces the sidebar avatar to display correctly
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Force avatar refresh script loaded');
  setTimeout(forceAvatarRefresh, 200);
});

function forceAvatarRefresh() {
  try {
    // Get the sidebar avatar element
    const avatarElement = document.getElementById('sidebar-avatar');
    if (!avatarElement) {
      console.warn('Avatar element not found');
      return;
    }

    // Clear the element
    avatarElement.innerHTML = '';
    
    // Get user info from token
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userName = payload.name || payload.email || 'User';
      
      // Create image with UI Avatars
      const img = document.createElement('img');
      img.className = 'w-full h-full object-cover';
      img.alt = userName;
      
      // Generate direct UI Avatar URL
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00BFA6&color=fff&size=128&bold=true`;
      img.src = avatarUrl;
      
      // Add to DOM
      avatarElement.appendChild(img);
      console.log('Avatar refreshed with:', avatarUrl);
      
    } catch (error) {
      console.error('Error processing token for avatar:', error);
    }
  } catch (error) {
    console.error('Force avatar refresh error:', error);
  }
}

// Make it available globally
window.forceAvatarRefresh = forceAvatarRefresh; 