/**
 * LearnX - Sidebar Loader
 * Consistently loads the sidebar across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
  loadSidebar();
  setupMobileMenu();
  highlightActiveLink();
});

/**
 * Loads the sidebar content
 */
function loadSidebar() {
  // Find sidebar placeholder
  const sidebarPlaceholder = document.querySelector('.sidebar-placeholder');
  if (!sidebarPlaceholder) return;
  
  // Create sidebar element
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar w-64 bg-surface-1 p-6 h-screen fixed top-0 left-0 shadow-xl z-10';
  sidebar.innerHTML = `
    <div class="flex flex-col space-y-8">
      <a href="dashboard.html" class="text-2xl font-bold text-white flex items-center">
        <span class="text-primary mr-2">Learn</span><span class="bg-primary text-white px-2 py-1 rounded">X</span>
      </a>
      
      <div class="flex items-center space-x-3 mb-6">
        <div id="sidebar-avatar" class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold overflow-hidden border-2 border-white border-opacity-20">
          <span>U</span>
        </div>
        <div>
          <p id="sidebar-name" class="font-medium">User</p>
          <p class="text-xs text-secondary" id="sidebar-role">Student</p>
        </div>
      </div>
      
      <nav>
        <ul class="flex flex-col space-y-2">
          <li><a href="dashboard.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-chart-line w-6"></i> Dashboard</a></li>
          <li><a href="learn.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-graduation-cap w-6"></i> Learn</a></li>
          <li><a href="teach.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-chalkboard-teacher w-6"></i> Teach</a></li>
          <li><a href="schedule.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-calendar-alt w-6"></i> Schedule</a></li>
          <li><a href="live-session.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-video w-6"></i> Live Session</a></li>
          <li><a href="profile.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-user w-6"></i> Profile</a></li>
          <li><a href="chat.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-comments w-6"></i> Messages</a></li>
          <li><a href="wallet.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-wallet w-6"></i> Wallet</a></li>
          <li><a href="todo.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-tasks w-6"></i> Tasks</a></li>
          <li><a href="settings.html" class="sidebar-link py-2 px-2 rounded flex items-center"><i class="fas fa-cog w-6"></i> Settings</a></li>
        </ul>

      </nav>
      
      <div class="mt-auto pt-6 border-t border-gray-800">
        <button id="logout-btn" class="flex items-center text-gray-400 hover:text-white transition-colors">
          <i class="fas fa-sign-out-alt mr-2"></i> Logout
        </button>
      </div>
    </div>
    
    <!-- Mobile menu toggle button (only visible on small screens) -->
    <button id="mobile-menu-toggle" class="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg md:hidden flex items-center justify-center">
      <i class="fas fa-bars"></i>
    </button>
  `;
  
  // Replace the placeholder with the sidebar
  sidebarPlaceholder.replaceWith(sidebar);
  
  // Add main content margin
  const mainContent = document.querySelector('.flex-1');
  if (mainContent && !mainContent.classList.contains('ml-0')) {
    mainContent.classList.add('ml-64');
  }
  
  // Handle logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show toast notification if it exists
      const toast = document.getElementById('toast');
      if (toast) {
        const toastMessage = document.getElementById('toast-message');
        if (toastMessage) {
          toastMessage.textContent = 'Logging out...';
        }
        toast.classList.add('show');
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      } else {
        window.location.href = 'login.html';
      }
    });
  }
  
  // Load user info into sidebar
  loadUserInfo();
}

/**
 * Loads user information into the sidebar
 */
function loadUserInfo() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // Parse the token to get userId
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Update avatar with first letter of name or email
    const avatarElement = document.getElementById('sidebar-avatar');
    const nameElement = document.getElementById('sidebar-name');
    const roleElement = document.getElementById('sidebar-role');
    
    if (avatarElement && nameElement && roleElement) {
      const userName = payload.name || payload.email || 'User';
      nameElement.textContent = userName;
      
      // Clear existing content in avatar element
      avatarElement.innerHTML = '';
      avatarElement.className = 'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center';
      
      // Get user data from localStorage for profile image
      let userData = null;
      try {
        const storedData = localStorage.getItem('user');
        if (storedData) {
          userData = JSON.parse(storedData);
          console.log('Using stored user data for sidebar:', userData);
          
          // Debug profile image data
          if (userData.profileImage) console.log('Found profileImage:', userData.profileImage);
          if (userData.profilePhoto) console.log('Found profilePhoto:', userData.profilePhoto);
          if (userData.profilePicture) console.log('Found profilePicture:', userData.profilePicture);
          if (userData.avatar) console.log('Found avatar:', userData.avatar);
        }
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
      
      // Try to get the profile photo from various sources with more debugging
      const profilePhoto = userData?.profileImage || userData?.profilePhoto || userData?.profilePicture || userData?.avatar || '';
      console.log('Selected profile image source:', profilePhoto);
      
      // Create an image element
      const img = document.createElement('img');
      img.alt = userName;
      img.className = 'w-full h-full object-cover';
      img.crossOrigin = 'anonymous'; // Try to avoid CORS issues
      
      // Get name parts for avatar fallback or UI avatar
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[1] : '';
      const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=00BFA6&color=fff&size=128&bold=true&cache=${Date.now()}`;
      
      // Determine the correct image source
      if (profilePhoto) {
        if (profilePhoto.startsWith('data:image')) {
          // Data URL - use directly
          console.log('Using data URL directly for profile image');
          img.src = profilePhoto;
        } else if (profilePhoto.startsWith('http')) {
          // Full URL - use directly
          console.log('Using HTTP URL directly for profile image:', profilePhoto);
          img.src = profilePhoto;
        } else {
          // Server-side path - construct full URL
          const serverUrl = 'http://localhost:5000';
          const fullPath = profilePhoto.startsWith('/') ? 
            `${serverUrl}${profilePhoto}` : 
            `${serverUrl}/uploads/${profilePhoto}`;
          
          console.log('Constructed server path URL for profile image:', fullPath);
          img.src = fullPath;
        }
      } else {
        // No profile image - use UI Avatars as fallback
        console.log('No profile image found, using UI Avatars');
        img.src = uiAvatarUrl;
      }
      
      // Add error handler with helpful debugging
      img.onerror = function() {
        console.error('❌ Profile image failed to load:', this.src);
        
        // Try UI Avatars if the image fails to load
        if (this.src !== uiAvatarUrl) {
          console.log('Trying UI Avatar fallback');
          this.src = uiAvatarUrl;
        } else {
          // If UI Avatars also fails, use text initial
          console.log('UI Avatar fallback failed, using text initial');
          avatarElement.innerHTML = firstName.charAt(0).toUpperCase() + (lastName.charAt(0).toUpperCase() || '');
          avatarElement.className = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold';
        }
      };
      
      // Add load success handler
      img.onload = function() {
        console.log('✓ Profile image loaded successfully:', this.src);
      };
      
      // Add the image
      avatarElement.appendChild(img);
      
      // Set role
      if (payload.role) {
        roleElement.textContent = payload.role.charAt(0).toUpperCase() + payload.role.slice(1);
      }
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
}

// Generate default SVG avatar with user initials
function generateDefaultAvatarSVG(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : 'U';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = firstInitial + (lastInitial || '');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#00BFA6"/>
    <text x="50" y="50" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
}

/**
 * Sets up the mobile menu toggle functionality
 */
function setupMobileMenu() {
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }
}

/**
 * Highlights the active link in the sidebar based on current page
 */
function highlightActiveLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
} 