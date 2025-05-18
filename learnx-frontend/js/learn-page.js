// Learn page specific JavaScript

// Example function to fetch available sessions
async function fetchAvailableSessions() {
  try {
    // Show loading state
    const container = document.getElementById('available-sessions-container');
    container.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="text-secondary mb-4">Loading all sessions...</p>
        <div class="loader mx-auto"></div>
      </div>
    `;
    
    // Get API URL from config or fall back to localhost
    const serverUrl = window.CONFIG?.SERVER_URL || 'http://localhost:5000';
    
    // Fetch sessions from backend
    fetch(`${serverUrl}/api/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    })
    .then(data => {
      // Log the full sessions data for debugging
      console.log('Received sessions:', data.sessions || data);
      
      // Determine the sessions array (handle different response structures)
      const sessionsToDisplay = data.sessions || data || [];
      
      // Ensure we display ALL sessions
      console.log(`Total sessions received: ${sessionsToDisplay.length}`);
      
      // Make sure it's an array before proceeding
      if (!Array.isArray(sessionsToDisplay)) {
        console.error('Sessions data is not an array:', sessionsToDisplay);
        throw new Error('Invalid sessions format received');
      }
      
      // Map sessions to a consistent format with safe fallbacks
      const mappedSessions = sessionsToDisplay.map(session => {
        if (!session) return null;
        
        return {
          id: session.id || Date.now() + Math.floor(Math.random() * 1000),
          title: session.title || 'Untitled Session',
          description: session.description || 'No description provided',
          category: session.category || session.skill || 'Uncategorized',
          teacher: {
            id: session.teacher?.id || session.teacherId || null,
            name: session.teacher?.name || session.teacherName || 'Unknown Teacher',
            headline: session.teacher?.headline || session.teacherHeadline || 'Instructor',
            profilePic: session.teacher?.profilePic || session.teacherProfilePic || 'default-profile.png'
          },
          startTime: session.startTime || session.start_time || null,
          endTime: session.endTime || session.end_time || null,
          price: session.price || 0,
          current_students: session.current_students || 0,
          max_students: session.maxStudents || session.maxParticipants || 0
        };
      }).filter(session => session !== null); // Remove any null entries
      
      // Store safe version of sessions in localStorage for booking reference
      try {
        localStorage.setItem('availableSessions', JSON.stringify(sessionsToDisplay));
      } catch (storageError) {
        console.error('Error storing sessions in localStorage:', storageError);
        // If localStorage fails, we can still display the sessions
      }

      // --- Sync available listings for schedule page ---
      // Map sessions to a format suitable for schedule.html upcoming sessions
      const availableListings = sessionsToDisplay.map(session => {
        // Safe date handling
        let formattedDate = '';
        let formattedTime = '';
        let formattedDateTime = '';
        
        try {
          // Format dates
          try {
            // Handle date in various formats (ISO string, timestamp, etc.)
            let startDate;
            if (typeof session.startTime === 'string') {
              // Try to parse ISO string or other string formats
              startDate = new Date(session.startTime);
            } else if (typeof session.startTime === 'number') {
              // Handle timestamp
              startDate = new Date(session.startTime);
            } else {
              // Default fallback
              startDate = new Date();
            }
            
            if (isNaN(startDate.getTime())) {
              throw new Error('Invalid date format');
            }
            
            const startDateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            
            formattedDate = startDateStr;
            formattedTime = `${startTimeStr}`;
          } catch (error) {
            console.error('Error parsing start date:', error);
            // Provide fallback display
            formattedDate = 'Date not available';
            formattedTime = 'Time not available';
          }
        } catch (error) {
          console.error('Error formatting date for session:', session.title, error);
        }
        
        return {
          id: session.id,
          title: session.title,
          instructor: session.teacher?.name || session.teacherName || 'Unknown Instructor',
          category: session.category || session.skill || '',
          date: formattedDate,
          time: formattedTime,
          datetime: formattedDateTime,
          price: session.price || 0
        };
      });
      
      try {
        localStorage.setItem('available_listings', JSON.stringify(availableListings));
      } catch (storageError) {
        console.error('Error storing listings in localStorage:', storageError);
      }
      // --- End sync ---

      // Display ALL sessions
      displaySessions(sessionsToDisplay);
      
      // Update container with number of sessions
      container.setAttribute('data-session-count', sessionsToDisplay.length);
      console.log(`Displaying ${sessionsToDisplay.length} sessions`);
    })
    .catch(error => {
      console.error('Error fetching sessions:', error);
      container.innerHTML = `
        <div class="col-span-3 text-center text-red-500 py-8">
          <p>Failed to load sessions: ${error.message}</p>
          <button onclick="fetchAvailableSessions()" class="btn btn-primary mt-4">
            Try Again
          </button>
        </div>
      `;
    });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    const container = document.getElementById('available-sessions-container');
    if (container) {
      container.innerHTML = `
        <div class="col-span-3 text-center text-red-500 py-8">
          <p>Failed to load sessions: ${error.message}</p>
          <button onclick="fetchAvailableSessions()" class="btn btn-primary mt-4">
            Try Again
          </button>
        </div>
      `;
    }
  }
}

// Helper function to display error messages
function displayErrorMessage(title, message) {
  const errorContainer = document.getElementById('available-sessions-container');
  errorContainer.innerHTML = `
    <div class="col-span-3 text-center py-8">
      <p class="text-red-500 font-semibold mb-2">${title}</p>
      <p class="text-secondary mb-4">${message}</p>
      <button onclick="fetchAvailableSessions()" class="btn btn-primary mt-4">
        <i class="fas fa-sync-alt mr-2"></i> Try Again
      </button>
    </div>
  `;
}

// Display sessions
function displaySessions(sessions) {
  const container = document.getElementById('available-sessions-container');
  
  // Ensure container exists
  if (!container) {
    console.error('Available sessions container not found');
    return;
  }

  // Clear sample sessions
  container.innerHTML = '';
  
  // Validate sessions
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    // If no sessions, display a message
    container.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="text-secondary mb-4">No available teaching sessions found.</p>
        <p class="text-secondary">Check back later for new sessions or try adjusting your filters.</p>
      </div>
    `;
    return;
  }

  console.log("Displaying sessions:", sessions);
  
  // Initialize a demo session array for fallback
  const demoSessions = [];
  
  // Add each session card
  sessions.forEach((session, index) => {
    try {
      // Ensure session has required properties
      if (!session || !session.title) {
        console.warn('Skipping invalid session:', session);
        return;
      }

      // Extract teacher info with fallbacks
      const teacherId = session.teacherId || session.teacher?.id || null;
      const teacherName = session.teacherName || session.teacher?.name || "Unknown Teacher";
      const teacherHeadline = session.teacherHeadline || session.teacher?.headline || (session.skill ? `${session.skill} Expert` : "Instructor");
      
      // Format date and time with fallback
      let startDate, endDate, dateStr, timeStr;
      
      // Handle different date formats safely
      try {
        if (session.startTime) {
          startDate = new Date(session.startTime);
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid date');
          }
        } else if (session.date && session.startTime) {
          // Format like "2023-05-17" and "14:30:00"
          const [year, month, day] = session.date.split('-').map(Number);
          const [hours, minutes] = session.startTime.split(':').map(Number);
          startDate = new Date(year, month - 1, day, hours, minutes);
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid date components');
          }
        } else {
          startDate = new Date();
        }
      } catch (error) {
        console.warn('Error parsing start date:', error);
        startDate = new Date();
      }
      
      try {
        if (session.endTime) {
          // Handle different formats for endTime
          if (typeof session.endTime === 'string') {
            // Try parsing ISO string or other formats
            endDate = new Date(session.endTime);
          } else if (typeof session.endTime === 'number') {
            // Handle timestamp
            endDate = new Date(session.endTime);
          } else {
            // Default to 1 hour after start
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          }
          
          // Validate end date
          if (isNaN(endDate.getTime())) {
            throw new Error('Invalid end date format');
          }
        } else if (session.date && session.endTime) {
          // Format like "2023-05-17" and "14:30:00"
          try {
            const [year, month, day] = session.date.split('-').map(Number);
            const [hours, minutes] = session.endTime.split(':').map(Number);
            endDate = new Date(year, month - 1, day, hours, minutes);
            
            if (isNaN(endDate.getTime())) {
              throw new Error('Invalid date components');
            }
          } catch (e) {
            throw new Error('Invalid date format: ' + e.message);
          }
        } else if (startDate) {
          // Default to 1 hour after start time
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        } else {
          // Fallback
          endDate = new Date(new Date().getTime() + 60 * 60 * 1000);
        }
      } catch (error) {
        console.warn('Error parsing end date:', error);
        // Set a default end time 1 hour after start
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }
      
      dateStr = startDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      timeStr = `${startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })} - ${endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;

      // Create session card element
      const sessionCard = document.createElement('div');
      sessionCard.className = 'session-card bg-surface-1 p-6 rounded-xl shadow-lg card-hover';
      sessionCard.dataset.sessionId = session.id || (index + 1);
      
      // Get teacher profile image with fallback
      const profilePic = session.teacher?.profilePic || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=00bfa6&color=fff`;
      
      // Get category (skill or category)
      const category = session.category || session.skill || 'General';
      
      sessionCard.innerHTML = `
        <div class="flex justify-between mb-4">
          <span class="badge badge-primary">${category}</span>
          <span class="text-xs text-primary">${dateStr}</span>
        </div>
        <h3 class="text-xl font-semibold mb-2">${session.title}</h3>
        <p class="text-secondary mb-4">${session.description || 'No description provided.'}</p>
        <p class="text-xs text-secondary mb-2"><i class="fas fa-calendar-alt mr-1"></i> ${timeStr}</p>
        <div class="flex items-center mb-4">
          <img src="${profilePic}" alt="${teacherName}" class="w-10 h-10 rounded-full mr-3">
          <div>
            <p class="font-medium">${teacherName}</p>
            <p class="text-xs text-secondary">${teacherHeadline}</p>
          </div>
        </div>
        <div class="flex justify-between items-center pt-4 border-t border-gray-800">
          <p class="font-bold text-success">${session.price === 0 ? 'FREE' : `$${session.price || 0}`}</p>
          <button class="btn btn-primary py-2 px-4 book-session-btn" data-session-id="${session.id || (index + 1)}">Book Session</button>
        </div>
      `;
      
      container.appendChild(sessionCard);
      
      // Store formatted demo session for fallback
      demoSessions.push({
        id: session.id || (index + 1),
        title: session.title,
        description: session.description || 'No description provided.',
        category: category,
        teacher: {
          id: teacherId,
          name: teacherName,
          headline: teacherHeadline,
          profilePic: profilePic
        },
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        date: dateStr,
        time: timeStr,
        price: session.price || 0
      });
    } catch (error) {
      console.error('Error rendering session card:', error);
    }
  });

  // Store demo sessions in localStorage as fallback
  try {
    localStorage.setItem('demo_sessions', JSON.stringify(demoSessions));
  } catch (error) {
    console.error('Error storing demo sessions:', error);
  }

  // Add event listeners for book session buttons
  document.querySelectorAll('.book-session-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const sessionId = e.currentTarget.dataset.sessionId;
      if (sessionId) {
        bookSession(sessionId);
      }
    });
  });

  // If no valid sessions were added, show no sessions message
  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="text-secondary mb-4">No valid teaching sessions found.</p>
        <p class="text-secondary">Check back later for new sessions or try adjusting your filters.</p>
      </div>
    `;
  }
}

// Function to display booked sessions
function displayBookedSessions(sessions) {
  const bookedSessionsContainer = document.getElementById('booked-sessions-container');
  
  // If container doesn't exist, return
  if (!bookedSessionsContainer) {
    console.error('Booked sessions container not found');
    return;
  }
  
  // Clear the container
  bookedSessionsContainer.innerHTML = '';
  
  // Check if there are any booked sessions
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    bookedSessionsContainer.innerHTML = `
      <div class="col-span-2 text-center py-8">
        <i class="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-400">You haven't booked any sessions yet.</p>
        <p class="text-gray-500 mt-2">Browse available sessions above to get started!</p>
      </div>
    `;
    return;
  }

  console.log('Displaying booked sessions:', sessions);
  
  // Create a container for the sessions
  const sessionsGrid = document.createElement('div');
  sessionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
  
  // Add each booked session to the grid
  sessions.forEach(session => {
    // Create card for the session
    const sessionCard = document.createElement('div');
    sessionCard.className = 'bg-[#1E201E] rounded-lg p-4 shadow-md';
    sessionCard.dataset.bookingId = session.bookingId || session.id;
    
    // Format date and time (use the session's stored date/time if available)
    let dateStr = session.date || 'Upcoming';
    let timeStr = session.time || '';
    
    if (!dateStr && session.startTime) {
      try {
        const startDate = new Date(session.startTime);
        if (!isNaN(startDate.getTime())) {
          dateStr = startDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch (error) {
        console.warn('Error formatting date for booked session:', error);
      }
    }
    
    if (!timeStr && session.startTime && session.endTime) {
      try {
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          timeStr = `${startDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })} - ${endDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}`;
        }
      } catch (error) {
        console.warn('Error formatting time for booked session:', error);
      }
    }
    
    // Get instructor name
    const instructorName = session.teacherName || session.teacher?.name || 
                          session.instructorName || 'Instructor';
    
    sessionCard.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="text-lg font-medium mb-1">${session.title || 'Booked Session'}</h4>
          <p class="text-gray-400 mb-2">${dateStr} · ${timeStr}</p>
          <p class="text-sm mb-2">${session.description || 'No description available'}</p>
          <p class="text-secondary">${instructorName}</p>
        </div>
        <div class="flex flex-col space-y-2">
          <button class="cancel-booking-btn bg-[#1E201E] hover:bg-[#2C2E2C] text-white px-3 py-1 rounded" 
                  data-booking-id="${session.bookingId || session.id}">
            Cancel
          </button>
        </div>
      </div>
    `;
    
    sessionsGrid.appendChild(sessionCard);
  });
  
  // Add the grid to the container
  bookedSessionsContainer.appendChild(sessionsGrid);
  
  // Add event listeners for cancel buttons
  document.querySelectorAll('.cancel-booking-btn').forEach(button => {
    button.addEventListener('click', function() {
      const bookingId = this.getAttribute('data-booking-id');
      if (bookingId) {
        cancelBooking(bookingId);
      }
    });
  });
}

// Function to cancel a booking
async function cancelBooking(bookingId) {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      showToast("Please log in to cancel a booking", "error");
      return;
    }
    
    // Confirm cancellation
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    showToast("Cancelling booking...", "info");
    
    // Check if this is a client-generated ID (timestamp) or server UUID
    const isClientId = !bookingId.includes('-'); // Server IDs have hyphens as UUIDs
    
    if (!isClientId) {
      // If it's a server ID, make the API call
      try {
        const response = await fetch(`${window.CONFIG?.SERVER_URL || 'http://localhost:5000'}/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'cancelled'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update booking status');
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        // Continue with local update even if API fails
      }
    }
    
    // Always remove from localStorage for immediate UI update
    const bookedSessions = JSON.parse(localStorage.getItem('learnx_sessions') || '[]');
    const updatedSessions = bookedSessions.filter(session => {
      return session.bookingId != bookingId && session.id != bookingId;
    });
    
    localStorage.setItem('learnx_sessions', JSON.stringify(updatedSessions));
    
    // Show success message
    showToast("Booking cancelled successfully", "success");
    
    // Refresh display
    loadBookedSessions();
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    showToast("Error cancelling booking: " + error.message, "error");
  }
}

// Function to book a session
async function bookSession(sessionId) {
  try {
    console.log(`Booking session with ID: ${sessionId}`);
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      showToast("Please log in to book a session", "error");
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }
    
    // Get user data to check role
    let userData = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        userData = JSON.parse(userJson);
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
    
    // Check if user has learner role
    if (userData && userData.role && userData.role === "teacher") {
      showToast("Your account is a teacher-only account. To book sessions, you need a learner or dual role account.", "error");
      return;
    }
    
    // Try multiple sources for session data
    let session = null;
    
    // 1. First try available sessions from API
    try {
      const sessionsStr = localStorage.getItem('availableSessions');
      if (sessionsStr) {
        const availableSessions = JSON.parse(sessionsStr);
        if (Array.isArray(availableSessions)) {
          session = availableSessions.find(s => s.id == sessionId);
        }
      }
    } catch (parseError) {
      console.warn('Error parsing available sessions:', parseError);
    }
    
    // 2. If not found, try demo sessions
    if (!session) {
      try {
        const demoSessionsStr = localStorage.getItem('demo_sessions');
        if (demoSessionsStr) {
          const demoSessions = JSON.parse(demoSessionsStr);
          if (Array.isArray(demoSessions)) {
            session = demoSessions.find(s => s.id == sessionId);
          }
        }
      } catch (parseError) {
        console.warn('Error parsing demo sessions:', parseError);
      }
    }
    
    // 3. If still not found, try to extract from DOM
    if (!session) {
      const sessionCard = document.querySelector(`.session-card[data-session-id="${sessionId}"]`);
      if (sessionCard) {
        const title = sessionCard.querySelector('h3')?.textContent || 'Demo Session';
        const description = sessionCard.querySelector('p')?.textContent || 'Demo session description';
        const teacherName = sessionCard.querySelector('.font-medium')?.textContent || 'Demo Teacher';
        
        session = {
          id: sessionId,
          title: title,
          description: description,
          teacher: { name: teacherName },
          price: 0
        };
      }
    }
    
    // If session is still not found, show error
    if (!session) {
      showToast("Session not found", "error");
      return;
    }
    
    // Show booking confirmation UI
    showBookingConfirmation(session);
    
  } catch (error) {
    console.error('Error booking session:', error);
    showToast("Error booking session. Please try again.", "error");
  }
}

// Function to display booking confirmation dialog
function showBookingConfirmation(session) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  modal.id = 'booking-modal';
  
  // Format date and time for display
  let dateStr = 'Upcoming Session';
  let timeStr = '';
  
  try {
    if (session.startTime) {
      const startDate = new Date(session.startTime);
      
      // Check if date is valid before trying to format it
      if (!isNaN(startDate.getTime())) {
        const endDate = new Date(session.endTime || startDate.getTime() + 60 * 60 * 1000);
        
        dateStr = startDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        timeStr = `${startDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })} - ${endDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}`;
      }
    } else if (session.date) {
      // Alternative format: separate date and time fields
      dateStr = session.date;
      if (session.time) {
        timeStr = session.time;
      }
    }
  } catch (dateError) {
    console.error('Error formatting session date:', dateError);
    // Use default values set at the beginning
  }
  
  // Create confirmation content with safer property access
  modal.innerHTML = `
    <div class="bg-surface-1 rounded-xl p-6 max-w-md w-full">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Confirm Booking</h3>
        <button id="close-booking-modal" class="text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="mb-6">
        <h4 class="font-semibold text-lg mb-2">${session.title || 'Book Session'}</h4>
        <p class="text-secondary mb-4">${session.description || 'No description available'}</p>
        
        <div class="bg-surface-2 p-4 rounded-lg space-y-2 mb-4">
          <div class="flex items-center">
            <i class="fas fa-calendar-alt text-primary w-5 mr-2"></i>
            <span>${dateStr}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-clock text-primary w-5 mr-2"></i>
            <span>${timeStr || 'Time to be confirmed'}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-user text-primary w-5 mr-2"></i>
            <span>${session.teacher?.name || session.teacherName || 'Unknown Teacher'}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-tag text-primary w-5 mr-2"></i>
            <span>${session.price ? `$${session.price}` : 'FREE'}</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-between">
        <button id="cancel-booking-btn" class="py-2 px-6 rounded-lg bg-surface-2 hover:bg-surface-3">
          Cancel
        </button>
        <button id="confirm-booking-btn" class="py-2 px-6 rounded-lg bg-primary hover:bg-primary-dark">
          Confirm Booking
        </button>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('close-booking-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('cancel-booking-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('confirm-booking-btn').addEventListener('click', async () => {
    // Close modal
    document.body.removeChild(modal);
    
    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        showToast("You must be logged in to book a session", "error");
        return;
      }
      
      // Get user data to check role
      let userData = null;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          userData = JSON.parse(userJson);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
      
      // Check if user has learner role
      if (userData && userData.role === "teacher") {
        showToast("Your account is a teacher-only account. To book sessions, you need a learner or dual role account.", "error");
        return;
      }
      
      // Show loading toast
      showToast("Booking session...", "info");
      
      // Get current user ID from token
      let currentUserId = null;
      try {
        // Parse the token to get userId
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.id;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
      
      let serverBookingId = null;
      let apiSucceeded = false;
      
      // Try to make API call to book the session
      try {
        const response = await fetch(`${window.CONFIG?.SERVER_URL || 'http://localhost:5000'}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId: session.id,
            notes: ''
          })
        });
        
        const data = await response.json();
        
        // Log the complete response for debugging
        console.log('Booking API response:', {
          status: response.status,
          data: data,
          url: `${window.CONFIG?.SERVER_URL || 'http://localhost:5000'}/api/bookings`,
          request: {
            sessionId: session.id,
            notes: ''
          },
          userId: currentUserId
        });
        
        if (response.ok) {
          apiSucceeded = true;
          serverBookingId = data.booking?.id || null;
        } else {
          // If it's a role error, show specific message and return
          if (data.message && data.message.includes("role")) {
            throw new Error(data.message);
          }
          // For other errors, just log and continue with local storage approach
          console.warn("API booking failed:", data.message);
        }
      } catch (apiError) {
        // Only throw if it's a role-related error
        if (apiError.message && apiError.message.includes("role")) {
          throw apiError;
        }
        console.error("API error during booking:", apiError);
      }
      
      // Add to booked sessions in localStorage for immediate UI update
      const bookedSessions = JSON.parse(localStorage.getItem('learnx_sessions') || '[]');
      bookedSessions.push({
        id: session.id,
        bookingId: serverBookingId || Date.now().toString(), // Use server ID if available, otherwise generate
        title: session.title,
        description: session.description,
        teacherName: session.teacher?.name || session.teacherName || 'Unknown Teacher',
        date: dateStr,
        time: timeStr,
        price: session.price ? `$${session.price}` : 'FREE',
        startTime: session.startTime,
        endTime: session.endTime || (new Date(session.startTime).getTime() + 60 * 60 * 1000),
        // Add user ID to the session
        userId: currentUserId,
        learnerId: currentUserId
      });
      
      localStorage.setItem('learnx_sessions', JSON.stringify(bookedSessions));
      
      // Show success message (different depending on if API call worked)
      if (apiSucceeded) {
        showToast("Session booked successfully!", "success");
      } else {
        showToast("Session booked locally. Note: Server booking may have failed.", "success");
      }
      
      // Load and display the updated booked sessions
      loadBookedSessions();
    } catch (error) {
      console.error("Error booking session:", error);
      showToast("Error booking session: " + error.message, "error");
    }
  });
}

// Helper function to display toast messages
function showToast(message, type = 'info') {
  // Check if toast container exists
  let toast = document.getElementById('toast');
  
  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-y-8';
    document.body.appendChild(toast);
  }
  
  // Set toast type class
  toast.className = 'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-y-8';
  
  if (type === 'error') {
    toast.classList.add('bg-red-500', 'text-white');
  } else if (type === 'success') {
    toast.classList.add('bg-green-500', 'text-white');
  } else {
    toast.classList.add('bg-blue-500', 'text-white');
  }
  
  // Set message
  toast.textContent = message;
  
  // Show toast
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-8');
    toast.classList.add('opacity-100', 'translate-y-0');
  }, 10);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-8');
  }, 3000);
}

// Function to load booked sessions
function loadBookedSessions() {
  try {
    // Get booked sessions from localStorage
    const bookedSessionsStr = localStorage.getItem('learnx_sessions');
    if (!bookedSessionsStr) {
      displayBookedSessions([]);
      return;
    }
    
    const allBookedSessions = JSON.parse(bookedSessionsStr);
    if (!Array.isArray(allBookedSessions)) {
      console.warn('Booked sessions is not an array:', allBookedSessions);
      displayBookedSessions([]);
      return;
    }
    
    // Get current user ID from token
    const token = localStorage.getItem('token');
    let currentUserId = null;
    
    if (token) {
      try {
        // Parse the token to get userId
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.id;
        console.log('Current user ID:', currentUserId);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    
    // Filter sessions by user ID if available
    let userBookedSessions = allBookedSessions;
    if (currentUserId) {
      userBookedSessions = allBookedSessions.filter(session => {
        // Check if the session has a userId property that matches current user
        return session.userId === currentUserId || session.learnerId === currentUserId;
      });
      console.log(`Filtered ${allBookedSessions.length} sessions to ${userBookedSessions.length} for user ${currentUserId}`);
    } else {
      console.warn('No user ID found in token, showing all sessions');
    }
    
    // Display the filtered booked sessions
    displayBookedSessions(userBookedSessions);
    
    // Update UI indicators if any exist
    const bookedCount = document.getElementById('booked-count');
    if (bookedCount) {
      bookedCount.textContent = userBookedSessions.length.toString();
    }
  } catch (error) {
    console.error('Error loading booked sessions:', error);
    displayBookedSessions([]);
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load available sessions
    await fetchAvailableSessions();
    
    // Load user's booked sessions
    loadBookedSessions();
    
    console.log('Learn page initialized successfully');
  } catch (error) {
    console.error('Error initializing learn page:', error);
  }
});