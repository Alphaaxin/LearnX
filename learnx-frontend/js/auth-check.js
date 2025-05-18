// Check if auth-check.js exists - if not, create it with proper auth/profile image handling
// Check if user is authenticated
function checkAuthentication() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // If not logged in and not on login/register page, redirect to login
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const publicPages = ['login.html', 'register.html', 'index.html', 'about-faq-support.html'];
    
    if (!publicPages.includes(currentPage)) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
    }
    return;
  }
  
  try {
    // Verify token hasn't expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expiryTime) {
      // Token expired - clear and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }
    
    // Check if user data is missing or incomplete
    const userData = localStorage.getItem('user');
    if (!userData || !JSON.parse(userData).profilePhoto) {
      // Fetch fresh user data with profile image
      fetchUserProfile(token);
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}

// Fetch user profile data including profile image
async function fetchUserProfile(token) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Process profile image URLs if needed
      if (data.user) {
        processProfileImageURLs(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Updated user data with profile image:', data.user);
      }
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}

// Process profile image URLs
function processProfileImageURLs(userData) {
  if (!userData) return;
  
  // Handle profile image paths
  ['profileImage', 'profilePhoto', 'profilePicture', 'avatar'].forEach(field => {
    const imagePath = userData[field];
    if (imagePath && typeof imagePath === 'string') {
      // Only process server paths, not data URLs or full URLs
      if (!imagePath.startsWith('data:') && !imagePath.startsWith('http')) {
        // Convert relative server paths to absolute URLs
        const serverUrl = 'http://localhost:5000';
        userData[field] = imagePath.startsWith('/') ? 
          `${serverUrl}${imagePath}` : 
          `${serverUrl}/uploads/${imagePath}`;
      }
    }
  });
  
  return userData;
}

// Run authentication check when page loads
document.addEventListener('DOMContentLoaded', checkAuthentication);
