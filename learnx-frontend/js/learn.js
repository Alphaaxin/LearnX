// Learn Page JavaScript - with integrated session booking

document.addEventListener('DOMContentLoaded', () => {
  // Share existing bookings with schedule page
  shareExistingBookings();
  
  // Initialize any existing UI elements
  setupUIHandlers();
});

// Share existing bookings with schedule page
function shareExistingBookings() {
  // Find all booked sessions in the learn page
  const bookedSessionCards = document.querySelectorAll('.booked-session-card');
  console.log('Found booked session cards:', bookedSessionCards.length);
  
  // DEBUG: Log all card elements to see what we're working with
  bookedSessionCards.forEach((card, index) => {
    console.log(`Card ${index} HTML:`, card.outerHTML);
  });
  
  const existingBookings = [];
  
  // Extract session details from each booked card
  bookedSessionCards.forEach((card, index) => {
    console.log(`Processing card ${index}...`);
    
    // Extract all data with detailed logging
    const sessionTitle = card.querySelector('.session-title')?.textContent || 'Booked Session';
    console.log(`Title: ${sessionTitle}`);
    
    const sessionDesc = card.querySelector('.session-description')?.textContent || '';
    console.log(`Description: ${sessionDesc}`);
    
    const sessionTime = card.querySelector('.session-time')?.textContent || '';
    console.log(`Time: ${sessionTime}`);
    
    const instructorName = card.querySelector('.instructor-name')?.textContent || 'Instructor';
    console.log(`Instructor: ${instructorName}`);
    
    const sessionPrice = card.querySelector('.session-price')?.textContent || '';
    console.log(`Price: ${sessionPrice}`);
    
    const sessionDate = card.querySelector('.session-date')?.textContent || 'Upcoming';
    console.log(`Date: ${sessionDate}`);
    
    // Parse the time string to extract start and end times
    let startTime = '9:00 AM';
    let endTime = '10:00 AM';
    if (sessionTime) {
      const timeParts = sessionTime.split(' - ');
      if (timeParts.length === 2) {
        startTime = timeParts[0].trim();
        endTime = timeParts[1].trim();
      }
    }
    console.log(`Parsed times: ${startTime} - ${endTime}`);
    
    // Create session object with details from the booked card
    const session = {
      _id: 'booked-session-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: sessionTitle,
      date: sessionDate,
      startTime: startTime,
      endTime: endTime,
      description: sessionDesc,
      instructorName: instructorName,
      price: sessionPrice,
      source: 'learn-page-booked'
    };
    
    console.log(`Created session object:`, session);
    existingBookings.push(session);
  });
  
  // If we found any bookings, share them to schedule page
  if (existingBookings.length > 0) {
    console.log(`Found ${existingBookings.length} bookings to share with schedule page`);
    
    // IMPORTANT: We're going to REPLACE all sessions with what we found on this page
    // This ensures we don't have stale data or reference issues
    
    // Save ALL bookings directly - this is the source of truth
    localStorage.setItem('learnx_sessions', JSON.stringify(existingBookings));
    console.log('Saved all bookings to storage:', existingBookings.length);
    console.log('Session data:', JSON.stringify(existingBookings));
    
    // Force update any other open tabs
    try {
      // This will trigger the storage event in other tabs
      localStorage.setItem('learnx_sessions_updated', Date.now().toString());
    } catch (e) {
      console.error('Error triggering update event:', e);
    }
  } else {
    console.warn('No bookings found to share with schedule page');
  }
}

// Add mock booked sessions for demonstration purposes if none exist on the page
function addMockBookedSessions() {
  // Only add mock data if no real booked sessions exist
  const existingBookedCards = document.querySelectorAll('.booked-session-card');
  if (existingBookedCards.length > 0) {
    return; // Don't add mock data if real data exists
  }
  
  // Create a container for booked sessions if it doesn't exist
  let bookedContainer = document.querySelector('#booked-sessions-container');
  if (!bookedContainer) {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;
    
    bookedContainer = document.createElement('div');
    bookedContainer.id = 'booked-sessions-container';
    bookedContainer.className = 'mb-12';
    bookedContainer.innerHTML = `
      <h3 class="text-2xl font-semibold mb-6 flex items-center">
        <i class="fas fa-check-circle text-success mr-2"></i>
        Your Booked Sessions
      </h3>
      <div class="grid grid-cols-1 gap-4" id="booked-cards-grid"></div>
    `;
    
    // Add after the first section
    const firstSection = mainContent.querySelector('div.mb-12');
    if (firstSection) {
      mainContent.insertBefore(bookedContainer, firstSection.nextSibling);
    } else {
      mainContent.appendChild(bookedContainer);
    }
  }
  
  // Create the grid to hold booked cards if it doesn't exist
  let bookedCardsGrid = document.querySelector('#booked-cards-grid');
  if (!bookedCardsGrid) {
    bookedCardsGrid = document.createElement('div');
    bookedCardsGrid.id = 'booked-cards-grid';
    bookedCardsGrid.className = 'grid grid-cols-1 gap-4';
    bookedContainer.appendChild(bookedCardsGrid);
  }
  
  // Add a sample booked session - this is for testing only
  const mockSession = {
    title: 'Swimming',
    description: 'I will teach you how to swim',
    instructorName: 'Mohammad Sohail Pashe',
    date: 'Wed, May 14',
    time: '03:20 PM - 04:20 PM',
    price: '$2'
  };
  
  const sessionCard = document.createElement('div');
  sessionCard.className = 'booked-session-card bg-surface-1 p-6 rounded-xl shadow-lg';
  sessionCard.innerHTML = `
    <div class="mb-2">
      <h3 class="text-xl font-semibold session-title">${mockSession.title}</h3>
      <p class="text-secondary session-description">${mockSession.description}</p>
    </div>
    <div class="flex items-center mb-3">
      <i class="fas fa-clock text-primary mr-2"></i>
      <span class="session-time">${mockSession.time}</span>
    </div>
    <div class="flex items-center mb-4">
      <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Instructor" class="w-10 h-10 rounded-full mr-3">
      <div>
        <p class="font-medium instructor-name">${mockSession.instructorName}</p>
      </div>
    </div>
    <div class="flex justify-between items-center">
      <p class="font-bold text-success session-price">${mockSession.price}</p>
      <button class="btn btn-secondary py-2 px-4">Cancel Booking</button>
    </div>
  `;
  
  bookedCardsGrid.appendChild(sessionCard);
  console.log('Added mock booked session for demonstration');
}

// Setup UI handlers for the page
function setupUIHandlers() {
  // Add event listeners for any UI elements
  const filterPills = document.querySelectorAll('.filter-pill');
  if (filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', function() {
        // Remove active class from all pills
        filterPills.forEach(p => p.classList.remove('active'));
        // Add active class to clicked pill
        this.classList.add('active');
        // Filter sessions (would be implemented in a real app)
        console.log('Filter selected:', this.textContent);
      });
    });
  }
  
  // For demo purposes, add mock booked sessions if none exist
  setTimeout(() => {
    addMockBookedSessions();
    // Make sure to share these with schedule page
    shareExistingBookings();
  }, 1000);
}

// Save booked sessions to localStorage (shared with schedule.html)
function saveBookedSessionsToStorage(sessions) {
  if (sessions) {
    localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
    console.log('Saved booked sessions to shared localStorage:', sessions);
  }
}

// Load booked sessions from localStorage
function loadBookedSessionsFromStorage() {
  try {
    // Use the shared storage key
    const savedSessions = localStorage.getItem('learnx_sessions');
    if (savedSessions) {
      return JSON.parse(savedSessions);
    }
  } catch (e) {
    console.error('Error loading booked sessions from localStorage:', e);
  }
  return [];
}

// Setup UI handlers for the page
function setupUIHandlers() {
  // Add event listeners for any UI elements
  const filterPills = document.querySelectorAll('.filter-pill');
  if (filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', function() {
        // Remove active class from all pills
        filterPills.forEach(p => p.classList.remove('active'));
        // Add active class to clicked pill
        this.classList.add('active');
        // Filter sessions (would be implemented in a real app)
        console.log('Filter selected:', this.textContent);
      });
    });
  }
}

// Load demo sessions for development testing
function loadDemoSessions() {
  // For development purposes, add data-session-id attributes to session cards
  const sessionCards = document.querySelectorAll('.session-card');
  sessionCards.forEach((card, index) => {
    card.setAttribute('data-session-id', index + 1);
  });
}

// Toast notification system
function showToast(message, type = 'info') {
  // Do not try to use window.showToast to avoid recursive calls
  // This function will handle toast notifications itself
  
  // Otherwise create a new toast
  let toast = document.getElementById('toast');
  
  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-8 right-8 z-50 px-6 py-4 rounded-lg shadow-lg hidden';
    
    const toastContent = `
      <div>
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-medium">Information</h4>
          <button onclick="document.getElementById('toast').classList.add('hidden')" class="text-gray-400 hover:text-white">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div id="toast-message" class="text-sm"></div>
      </div>
    `;
    
    toast.innerHTML = toastContent;
    document.body.appendChild(toast);
  }
  
  // Get the message element
  const toastMessage = document.getElementById('toast-message');
  if (!toastMessage) return;
  
  // Set message
  toastMessage.textContent = message;
  
  // Set type-specific styling
  toast.className = 'fixed bottom-8 right-8 z-50 px-6 py-4 rounded-lg shadow-lg';
  
  if (type === 'error') {
    toast.classList.add('bg-red-800', 'text-white');
  } else if (type === 'success') {
    toast.classList.add('bg-green-700', 'text-white');
  } else {
    toast.classList.add('bg-[#232723]', 'text-white');
  }
  
  // Show toast
  toast.classList.remove('hidden');
  
  // Hide after 5 seconds
  setTimeout(function() {
    toast.classList.add('hidden');
  }, 5000);
}
