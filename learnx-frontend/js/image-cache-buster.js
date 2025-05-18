/**
 * Utility script to bust browser cache for profile pictures
 * This helps ensure that profile pictures are always loaded fresh
 */

// Refresh profile pictures after page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Image cache buster initialized');
  setTimeout(refreshProfileImages, 500);
});

// Refresh profile images
function refreshProfileImages() {
  try {
    // Get all profile picture elements
    const profileImages = [
      document.getElementById('sidebar-avatar')?.querySelector('img'),
      document.getElementById('profile-img'),
      document.getElementById('edit-profile-img')
    ];
    
    // Add a cache-busting parameter to each image
    profileImages.forEach(img => {
      if (img && img.src) {
        console.log('Refreshing image:', img.src);
        
        // Only add cache busting for non-data URLs
        if (!img.src.startsWith('data:')) {
          // Add or update cache-busting parameter
          const url = new URL(img.src);
          url.searchParams.set('_cb', Date.now());
          img.src = url.toString();
        }
      }
    });
    
    console.log('Profile images refreshed');
  } catch (error) {
    console.error('Error refreshing profile images:', error);
  }
}

// Export for direct use in other scripts
window.refreshProfileImages = refreshProfileImages; 