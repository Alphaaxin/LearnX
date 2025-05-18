/**
 * Ultimate Fix for Profile Image Display Issues
 * This script resolves all profile image problems by:
 * 1. Fixing localStorage data for maximum compatibility
 * 2. Using a working image service as fallback
 * 3. Ensuring consistent display across all pages
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Ultimate profile image fix initialized');
  // Run immediately but allow DOM to load first
  setTimeout(fixProfileImageGlobally, 100);
  
  // Also run after everything else is loaded
  window.addEventListener('load', () => {
    setTimeout(fixProfileImageGlobally, 300);
  });
});

/**
 * Fix profile images across the entire application
 */
function fixProfileImageGlobally() {
  try {
    console.log('🔧 Starting ultimate profile image fix...');
    
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('user');
    if (!storedUserData) {
      console.warn('🚫 No user data in localStorage');
      return;
    }
    
    let userData;
    try {
      userData = JSON.parse(storedUserData);
      console.log('📋 User data loaded:', userData);
    } catch (e) {
      console.error('❌ Failed to parse user data:', e);
      return;
    }
    
    // Extract user info for fallback generation
    const email = userData.email || 'user@example.com';
    const name = userData.name || email.split('@')[0];
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[1] : '';
    const initials = firstName.charAt(0).toUpperCase() + (lastName.charAt(0) || '').toUpperCase();
    
    // Check if existing profile image might be valid
    let profileImageMightWork = false;
    const existingImage = userData.profilePhoto || userData.profileImage || userData.profilePicture || userData.avatar;
    
    console.log('Examining profile image sources from localStorage:');
    console.log('- profilePhoto:', userData.profilePhoto);
    console.log('- profileImage:', userData.profileImage);
    console.log('- profilePicture:', userData.profilePicture);
    console.log('- avatar:', userData.avatar);
    console.log('- existingImage selected:', existingImage);
    
    if (existingImage) {
      if (existingImage.startsWith('data:image')) {
        // Data URLs should work fine
        console.log('🔍 Found valid data URL profile image');
        profileImageMightWork = true;
      } else if (existingImage.startsWith('http')) {
        // Most HTTP URLs should work, even localhost for images that exist
        console.log('🔍 Found HTTP URL profile image');
        profileImageMightWork = true;
      }
    }
    
    // Generate different fallback options
    const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=00BFA6&color=fff&size=128`;
    const robohashUrl = `https://robohash.org/${encodeURIComponent(email)}?set=set4&bgset=bg2&size=200x200`;
    
    // Use a better selection logic for image source
    let reliableImageUrl;
    
    // First choice: data URL (most reliable as it's embedded)
    if (existingImage && existingImage.startsWith('data:image')) {
      reliableImageUrl = existingImage;
      console.log('✓ Using data URL profile image');
    } 
    // Second choice: any valid HTTP URL that's not localhost and not UI avatars
    else if (existingImage && 
              existingImage.startsWith('http') && 
              !existingImage.includes('ui-avatars.com')) {
      reliableImageUrl = existingImage;
      console.log('✓ Using HTTP URL profile image');
    }
    // Third choice: if it looks like a valid relative URL (starts with /)
    else if (existingImage && existingImage.startsWith('/')) {
      // Don't modify the existing relative URL
      reliableImageUrl = existingImage;
      console.log('✓ Using relative URL profile image');
    }
    // Finally, use the generated avatar with initials as fallback
    else {
      reliableImageUrl = uiAvatarUrl;
      console.log('✓ Using UI Avatar fallback with initials');
    }
    
    console.log('🖼️ FINAL IMAGE URL CHOICE:', reliableImageUrl);
    
    // DON'T update localStorage if we're using a fallback
    // This ensures we don't overwrite potential valid URLs with fallbacks
    if (profileImageMightWork) {
      console.log('✓ Keeping original profile image data in localStorage');
    }
    // Only update if we don't have valid images
    else if (!profileImageMightWork && (!existingImage || existingImage.includes('robohash.org'))) {
      // Update only profileImage and avatar fields
      userData.profileImage = reliableImageUrl;
      userData.avatar = reliableImageUrl;
      
      // Save updated user data back to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('💾 Updated only fallback fields in localStorage');
    }
    
    // Find and update any avatar elements on the page
    updateAvatarElements(reliableImageUrl, initials);
    
    console.log('✅ Ultimate profile image fix complete!');
  } catch (error) {
    console.error('❌ Error in ultimate profile image fix:', error);
  }
}

/**
 * Update all avatar elements in the page with the reliable image
 */
function updateAvatarElements(imageUrl, initials) {
  // Look for avatar element with predictable IDs
  const avatarElements = [
    document.getElementById('sidebar-avatar'),
    document.querySelector('.avatar'),
    document.querySelector('[data-avatar]'),
    ...document.querySelectorAll('.user-avatar')
  ].filter(el => el); // Remove null elements
  
  if (avatarElements.length === 0) {
    console.log('⚠️ No avatar elements found on page');
    return;
  }
  
  console.log(`🔍 Found ${avatarElements.length} avatar elements to update`);
  
  // Update each avatar element
  avatarElements.forEach((avatarEl, index) => {
    // Do not clear sidebar-avatar if it already has a valid image
    const existingImg = avatarEl.querySelector('img');
    if (existingImg && 
        existingImg.complete && 
        !existingImg.naturalHeight === 0 && 
        existingImg.src && 
        !existingImg.src.includes('robohash.org')) {
      console.log(`✅ Avatar #${index+1} already has a valid image: ${existingImg.src}`);
      return;
    }
    
    // Clear any existing content
    avatarEl.innerHTML = '';
    
    // Set standard styling that works anywhere
    const styles = [
      'width: 40px !important', 
      'height: 40px !important',
      'border-radius: 50% !important',
      'overflow: hidden !important',
      'display: flex !important',
      'align-items: center !important',
      'justify-content: center !important',
      'background-color: #00bfa6 !important',
      'min-width: 40px !important',
      'min-height: 40px !important',
      'border: 2px solid rgba(255, 255, 255, 0.2) !important'
    ];
    
    // Apply styles
    avatarEl.setAttribute('style', styles.join('; '));
    
    // Create image element
    const img = document.createElement('img');
    img.alt = 'User Avatar';
    img.setAttribute('style', 
      'width: 100% !important; ' +
      'height: 100% !important; ' +
      'object-fit: cover !important;'
    );
    
    // Add cache buster to URL if not a data URL
    const finalImageUrl = imageUrl.startsWith('data:') 
      ? imageUrl 
      : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;
    
    console.log(`Setting image source for avatar #${index+1}:`, finalImageUrl);
    img.src = finalImageUrl;
    
    // Error handler that displays initials if image fails
    img.onerror = function() {
      console.log(`⚠️ Image failed to load for avatar #${index+1}, using text initials`);
      avatarEl.innerHTML = initials;
      avatarEl.style.fontSize = '16px';
      avatarEl.style.fontWeight = 'bold';
      avatarEl.style.color = 'white';
      
      // Try UI Avatar service specifically
      const uiAvatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=00BFA6&color=fff&size=128&bold=true&cache=${Date.now()}`;
      
      // Create a new image with UI Avatar
      const fallbackImg = document.createElement('img');
      fallbackImg.alt = 'User Avatar';
      fallbackImg.setAttribute('style', 
        'width: 100% !important; ' +
        'height: 100% !important; ' +
        'object-fit: cover !important;'
      );
      fallbackImg.src = uiAvatarUrl;
      
      // Only replace if UI Avatar loads successfully
      fallbackImg.onload = function() {
        console.log(`✅ Fallback UI Avatar loaded for avatar #${index+1}`);
        avatarEl.innerHTML = '';
        avatarEl.appendChild(fallbackImg);
      };
    };
    
    // Add success handler
    img.onload = function() {
      console.log(`✅ Avatar #${index+1} image loaded successfully:`, this.src);
    };
    
    // Add the image
    avatarEl.appendChild(img);
  });
}

// Make the function available globally for other scripts to call
window.fixProfileImageGlobally = fixProfileImageGlobally; 