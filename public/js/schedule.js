// Scheduled Sessions Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize variables for booked sessions
  let bookedSessions = [];

  // Listen for changes to localStorage from other tabs
  window.addEventListener('storage', function(e) {
    console.log('Storage event detected:', e.key);
    if (e.key === 'learnx_sessions' || e.key === 'learnx_sessions_updated') {
      console.log('Sessions updated in another tab, reloading...');
      loadAndDisplaySessions();
    }
  });
  
  // Function to load and display sessions
  function loadAndDisplaySessions() {
    console.log('Loading and displaying sessions...');
    
    // Always get the freshest sessions from localStorage
    try {
      const storedSessions = localStorage.getItem('learnx_sessions');
      console.log('Raw stored sessions:', storedSessions);
      
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        console.log('Parsed sessions:', parsed);
        
        if (Array.isArray(parsed)) {
          // Get current user ID from token
          let currentUserId = null;
          const token = localStorage.getItem('token');
          
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
          let allSessions = parsed;
          if (currentUserId) {
            allSessions = parsed.filter(session => {
              // Check if the session has a userId property that matches current user
              return session.userId === currentUserId || session.learnerId === currentUserId;
            });
            console.log(`Filtered ${parsed.length} sessions to ${allSessions.length} for user ${currentUserId}`);
          } else {
            console.warn('No user ID found in token, showing all sessions');
          }
          
          bookedSessions = allSessions;
          console.log('Loaded sessions from localStorage:', bookedSessions.length);
          
          // Debug: log each session
          bookedSessions.forEach((session, index) => {
            console.log(`Session ${index}:`, session);
          });
        } else {
          console.error('Stored sessions is not an array:', parsed);
          bookedSessions = [];
        }
      } else {
        bookedSessions = [];
        console.log('No sessions found in localStorage');
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
      bookedSessions = [];
    }

    // Defensive: Log warning if any session is missing details
    bookedSessions.forEach((session, idx) => {
      if (!session.title || !session.description || !session.instructorName || !session.date || !session.startTime || !session.endTime) {
        console.warn('Session missing details at index', idx, session);
      }
    });

    // Remove old UI elements
    const bookedSessionsContainer = document.getElementById('booked-upcoming-sessions');
    if (bookedSessionsContainer) {
      bookedSessionsContainer.innerHTML = '';
      console.log('Cleared existing session container');
    } else {
      console.warn('Could not find booked-upcoming-sessions container');
    }

    // Clear calendar
    if ($('#calendar').fullCalendar) {
      $('#calendar').fullCalendar('removeEvents');
      console.log('Cleared calendar events');
    }

    // Display sessions
    displayBookedSessions();

    // Add sessions to calendar
    bookedSessions.forEach(session => {
      addBookedSessionToCalendar(session);
    });

    console.log('Sessions loaded and displayed:', bookedSessions.length);
  }

  // Always load latest sessions on page load
  window.addEventListener('DOMContentLoaded', loadAndDisplaySessions);

  // Reload sessions whenever the tab becomes active (for instant sync)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      loadAndDisplaySessions();
    }
  });
  
  // Once DOM is fully loaded
  $(document).ready(function() {
    // Load and display sessions
    loadAndDisplaySessions();
    
    // Initialize the calendar
    initializeCalendar();
    
    // Display booked sessions in the UI
    displayBookedSessions();
    
    // Add refresh button
    addRefreshButton();
  });
  
  // Function to initialize the calendar
  function initializeCalendar() {
    if (!$('#calendar').length) {
      console.error("Calendar container not found");
      return;
    }
    
    $('#calendar').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      defaultView: 'month',
      navLinks: true,
      editable: false,
      eventLimit: true,
      events: [],
      eventRender: function(event, element) {
        // Customize event appearance
        element.find('.fc-title').html(`
          <div>
            <strong>${event.title}</strong>
            ${event.instructor ? `<div class="text-xs">with ${event.instructor}</div>` : ''}
          </div>
        `);
      }
    });
    
    // Initialize the calendar with existing booked sessions
    console.log('Calendar initialized');
  }
  
  // Function to display booked sessions in the UI
  function displayBookedSessions() {
    // Get the container for booked sessions
    const bookedSessionsContainer = document.getElementById('booked-upcoming-sessions');
    if (!bookedSessionsContainer) {
      console.error('Booked sessions container not found');
      return;
    }
    
    // Clear any existing sessions
    bookedSessionsContainer.innerHTML = '';
    console.log('Displaying booked sessions, count:', bookedSessions.length);
    
    // Check if we have any booked sessions
    if (!bookedSessions || bookedSessions.length === 0) {
      // Display a message when no sessions are booked
      bookedSessionsContainer.innerHTML = `
        <div class="text-center p-8">
          <i class="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No booked sessions yet. Go to the Learn page to book sessions.</p>
        </div>
      `;
      console.log('No booked sessions to display');
      return;
    }
    
    // Log the sessions we're about to display
    console.log('About to display these sessions:', JSON.stringify(bookedSessions));
    
    // Loop through booked sessions and add them to the UI
    bookedSessions.forEach(session => {
      // Create card element
      const sessionCard = document.createElement('div');
      sessionCard.className = 'bg-[#1E201E] rounded-lg p-4 mb-4 shadow-md';
      sessionCard.dataset.sessionId = session._id || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Format the date and time
      const formattedDate = session.date || 'Upcoming';
      const formattedStartTime = session.startTime || '00:00';
      const formattedEndTime = session.endTime || '00:00';
      
      // Set the card content
      sessionCard.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-lg font-medium mb-1">${session.title || 'Booked Session'}</h4>
            <p class="text-gray-400 mb-2">${formattedDate} · ${formattedStartTime} - ${formattedEndTime}</p>
            <p class="text-sm mb-2">${session.description || 'No description available'}</p>
            <p class="text-secondary">${session.instructorName || 'Instructor'}</p>
          </div>
          <div class="flex flex-col space-y-2">
            <button class="cancel-booking-btn bg-[#1E201E] hover:bg-[#2C2E2C] text-white px-3 py-1 rounded" data-booking-id="${session._id || ''}">
              Cancel
            </button>
          </div>
        </div>
      `;
      
      // Add to container
      bookedSessionsContainer.appendChild(sessionCard);
      console.log('Added session card for:', session.title);
    });
  }
  
  // Add a booked session to the calendar
  function addBookedSessionToCalendar(session) {
    // Only proceed if we have access to the calendar
    if (!$('#calendar').fullCalendar) {
      console.error('Calendar not initialized');
      return;
    }
    
    // Parse the date and times
    let startDateTime, endDateTime;
    
    try {
      // Try to create date objects from the session data
      const dateStr = session.date || 'Tomorrow';
      const startTimeStr = session.startTime || '09:00 AM';
      const endTimeStr = session.endTime || '10:00 AM';
      
      // Create date objects based on the strings
      startDateTime = new Date(`${dateStr} ${startTimeStr}`);
      endDateTime = new Date(`${dateStr} ${endTimeStr}`);
      
      // If not valid dates, use current date + 1 day
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0);
        startDateTime = tomorrow;
        
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(10, 0, 0);
        endDateTime = tomorrowEnd;
      }
    } catch (e) {
      console.error('Error parsing session dates:', e);
      return;
    }
    
    // Create calendar event object
    const calendarEvent = {
      id: session._id,
      title: session.title,
      start: startDateTime,
      end: endDateTime,
      allDay: false,
      backgroundColor: '#10b981',
      borderColor: '#047857',
      textColor: '#ffffff',
      extendedProps: {
        type: 'booked',
        description: session.description,
        instructor: session.instructorName
      }
    };
    
    // Add the event to the calendar
    $('#calendar').fullCalendar('renderEvent', calendarEvent, true);
  }
  
  // Remove a booked session from the calendar
  function removeBookedSessionFromCalendar(session) {
    if (!$('#calendar').fullCalendar) return;
    
    // Remove the event by ID
    $('#calendar').fullCalendar('removeEvents', session._id);
  }
  
  // Function to cancel a booking
  function cancelBooking(bookingId) {
    // Find the booking in our array
    const bookingIndex = bookedSessions.findIndex(session => session._id === bookingId);
    
    if (bookingIndex === -1) {
      showToast('Booking not found', 'error');
      return;
    }
    
    // Get the session before removing it
    const session = bookedSessions[bookingIndex];
    
    // Remove from the array
    bookedSessions.splice(bookingIndex, 1);
    
    // Save updated sessions to storage
    saveBookedSessionsToStorage(bookedSessions);
    
    // Remove from calendar
    removeBookedSessionFromCalendar(session);
    
    // Refresh the UI
    displayBookedSessions();
    
    // Show confirmation
    showToast('Booking cancelled successfully', 'success');
  }
  
  // This function now explicitly adds both gym and swimming sessions
  function addDemoSessions() {
    // Create the sessions from learn.html (shown in screenshot)
    const sessions = [
      {
        _id: 'gym-session-1',
        title: 'gym',
        description: 'i would help you guys i n upper body worouts',
        date: 'Wed, May 14',
        startTime: '02:30 PM',
        endTime: '04:30 PM',
        instructorName: 'Mohammad Sohail Pashe',
        price: '$5'
      },
      {
        _id: 'swimming-session-1',
        title: 'swimming',
        description: 'i will techh you howw to swimm',
        date: 'Wed, May 14',
        startTime: '03:20 PM',
        endTime: '04:20 PM',
        instructorName: 'Mohammad Sohail Pashe',
        price: '$2'
      }
    ];
    
    // Save to localStorage
    localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
    console.log('Added both gym and swimming sessions to localStorage:', sessions);
    return sessions;
  }
  
  // Add the swimming session if it's missing
  function initializeWithSwimmingSession() {
    // For now, just use the addDemoSessions function to ensure both sessions are present
    return addDemoSessions();
  }
  
  // Save booked sessions to localStorage
  function saveBookedSessionsToStorage(sessions) {
    if (sessions) {
      localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
      console.log('Saved booked sessions to localStorage:', sessions);
    }
  }
  
  // Load booked sessions from localStorage - respect empty sessions from learn.html
  // And filter out any generic or incomplete sessions
  function loadBookedSessionsFromStorage() {
    try {
      // Clear any existing sessions first
      localStorage.removeItem('learnx_booked_sessions');
      
      // Get the shared storage key
      const sharedSessions = localStorage.getItem('learnx_sessions');
      if (sharedSessions) {
        try {
          const sessions = JSON.parse(sharedSessions);
          console.log('Loaded sessions from localStorage:', sessions);
          
          // Only filter out truly generic sessions, not proper sessions
          // We want to keep both gym and swimming sessions
          const filteredSessions = sessions.filter(session => {
            // Keep any session that has a proper title that's not just "Booked Session"
            const hasProperTitle = session.title && 
                                  session.title !== 'Booked Session' &&
                                  session.title.length > 0;
                                  
            // Special case to always include swimming and gym sessions
            const isSpecialSession = session.title && 
                                   (session.title.toLowerCase() === 'swimming' ||
                                    session.title.toLowerCase() === 'gym');
            
            if (isSpecialSession) {
              console.log('Found special session, keeping it:', session.title);
              return true;
            }
            
            if (!hasProperTitle) {
              console.log('Filtering out session without proper title:', session);
              return false;
            }
            
            return true;
          });
          
          console.log('Filtered sessions:', filteredSessions);
          return filteredSessions || [];
        } catch (parseError) {
          console.error('Error parsing shared sessions:', parseError);
          return [];
        }
      } else {
        // No sessions exist - respect this empty state
        console.log('No sessions found in localStorage');
        return [];
      }
    } catch (e) {
      console.error('Error loading booked sessions from localStorage:', e);
      return [];
    }
  }
  
  // Add a refresh button
  function addRefreshButton() {
    // Create refresh button if it doesn't exist
    if (!$('#refresh-sessions-btn').length) {
      const refreshBtn = $('<button id="refresh-sessions-btn" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;"><i class="fas fa-sync-alt mr-2"></i>Refresh</button>');
      $('body').append(refreshBtn);
      
      // Add click handler
      refreshBtn.on('click', function() {
        // Reload from storage and redisplay
        loadAndDisplaySessions();
        
        // Show toast
        showToast('Sessions refreshed', 'success');
      });
    }
  }
  
  // Toast notification function
  function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed bottom-4 right-4 z-50';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'py-2 px-4 rounded-lg shadow-lg mb-2 flex items-center text-white';
    
    // Set color based on type
    if (type === 'error') {
      toast.classList.add('bg-red-600');
    } else if (type === 'success') {
      toast.classList.add('bg-green-600');
    } else {
      toast.classList.add('bg-blue-600');
    }
    
    // Add message
    toast.innerHTML = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
  
  // Set up event delegation for buttons
  document.addEventListener('click', function(event) {
    // Check if the clicked element is a cancel booking button
    if (event.target.classList.contains('cancel-booking-btn')) {
      const bookingId = event.target.getAttribute('data-booking-id');
      cancelBooking(bookingId);
    }
  });
});
