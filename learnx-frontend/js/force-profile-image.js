/**
 * Force Profile Image Display
 * This script ensures profile images display correctly by fixing localStorage data
 * and handling image loading issues.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Force profile image script initialized');
  setTimeout(fixProfileImages, 200);
});

/**
 * Fix profile images by ensuring localStorage has correct data
 * and forcing images to display properly
 */
function fixProfileImages() {
  try {
    console.log('Fixing profile images...');
    
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('user');
    if (!storedUserData) {
      console.warn('No user data in localStorage');
      return;
    }
    
    let userData;
    try {
      userData = JSON.parse(storedUserData);
      console.log('User data loaded:', userData);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return;
    }
    
    // Check if we have a profile picture in any field
    let profilePicture = userData.profilePhoto || userData.profileImage || userData.profilePicture || userData.avatar;
    
    if (profilePicture) {
      console.log('Found profile picture:', profilePicture);
      
      // Make sure the profile picture is available in all fields for maximum compatibility
      userData.profilePhoto = profilePicture;
      userData.profileImage = profilePicture;
      userData.profilePicture = profilePicture;
      userData.avatar = profilePicture;
      
      // Save updated user data back to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Updated user data saved to localStorage');
    } else {
      console.log('No profile picture found in user data');
      
      // Create a UI Avatars URL based on the user's name
      const userName = userData.name || userData.email || 'User';
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[1] : '';
      
      // Generate UI Avatars URL
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=00BFA6&color=fff&size=128&bold=true&cache=${Date.now()}`;
      
      // Set all profile picture fields
      userData.profilePhoto = avatarUrl;
      userData.profileImage = avatarUrl;
      userData.profilePicture = avatarUrl;
      userData.avatar = avatarUrl;
      
      // Save updated user data back to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Created and saved avatar URL to localStorage:', avatarUrl);
    }
    
    // Now force refresh the sidebar avatar display
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) {
      console.log('Refreshing sidebar avatar display');
      
      // Clear any existing content
      sidebarAvatar.innerHTML = '';
      sidebarAvatar.className = 'w-10 h-10 rounded-full overflow-hidden flex items-center justify-center';
      sidebarAvatar.style.width = '40px';
      sidebarAvatar.style.height = '40px';
      sidebarAvatar.style.borderRadius = '50%';
      sidebarAvatar.style.overflow = 'hidden';
      sidebarAvatar.style.display = 'flex';
      sidebarAvatar.style.alignItems = 'center';
      sidebarAvatar.style.justifyContent = 'center';
      
      // Create image element
      const img = document.createElement('img');
      img.alt = userData.name || 'User';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.crossOrigin = 'anonymous';
      
      // Set image source to the profile picture
      img.src = userData.profilePhoto || userData.profileImage || userData.avatar;
      
      // Add error handling
      img.onerror = function() {
        console.error('Failed to load profile image, using fallback avatar');
        const userName = userData.name || userData.email || 'User';
        const nameParts = userName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[1] : '';
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=00BFA6&color=fff&size=128&bold=true&cache=${Date.now()}`;
        
        // If that also fails, show text initial
        this.onerror = function() {
          console.error('Failed to load fallback avatar, using text initial');
          sidebarAvatar.innerHTML = firstName.charAt(0).toUpperCase() + (lastName.charAt(0).toUpperCase() || '');
          sidebarAvatar.style.backgroundColor = '#00bfa6';
          sidebarAvatar.style.color = 'white';
          sidebarAvatar.style.fontWeight = 'bold';
        };
      };
      
      // Add the image to the sidebar avatar
      sidebarAvatar.appendChild(img);
      console.log('Added image to sidebar avatar');
    }
    
  } catch (error) {
    console.error('Error fixing profile images:', error);
  }
}

// Make the function available globally
window.fixProfileImages = fixProfileImages; 