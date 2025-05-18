// Scheduled Sessions Page JavaScript

// Global variable to store booked sessions
let bookedSessions = [];

// Once DOM is fully loaded
$(document).ready(function() {
  console.log('Schedule page initialized');
  
  // Make sure we have the demo sessions in localStorage
  addDemoSessions();
  
  // Load sessions from localStorage
  bookedSessions = loadBookedSessionsFromStorage() || [];
  console.log('Loaded sessions for display:', bookedSessions);
  
  // Initialize the calendar
  initializeCalendar();
  
  // Display booked sessions
  displayBookedSessions();
  
  // Add refresh button
  addRefreshButton();
});

// Initialize the calendar
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
  
  // Add booked sessions to calendar after a delay to ensure calendar is ready
  setTimeout(function() {
    if (bookedSessions && bookedSessions.length > 0) {
      bookedSessions.forEach(session => {
        addBookedSessionToCalendar(session);
      });
    }
  }, 500);
}

// Display booked sessions in the UI
function displayBookedSessions() {
  const bookedSessionsContainer = document.getElementById('booked-upcoming-sessions');
  
  if (!bookedSessionsContainer) {
    console.error("Error: Could not find booked sessions container!");
    return;
  }
  
  // Hide the "no sessions" message if it exists
  const noSessionsElement = document.getElementById('no-booked-sessions');
  if (noSessionsElement) {
    noSessionsElement.style.display = 'none';
  }
  
  // Clear existing sessions
  bookedSessionsContainer.innerHTML = '';
  
  // Check if we have any booked sessions
  if (!bookedSessions || bookedSessions.length === 0) {
    // Show the no sessions message
    if (noSessionsElement) {
      noSessionsElement.style.display = 'block';
    } else {
      bookedSessionsContainer.innerHTML = '<div class="p-4 text-center"><p class="text-secondary">No booked sessions yet. Book a session to see it here!</p></div>';
    }
    return;
  }
  
  // Create session cards for each booked session
  bookedSessions.forEach(session => {
    // Create the session card
    const sessionCard = createSessionCard(session);
    
    // Add to container
    bookedSessionsContainer.appendChild(sessionCard);
  });
}

// Create a session card element
function createSessionCard(session) {
  // Create card element
  const sessionCard = document.createElement('div');
  sessionCard.className = 'bg-[#1E201E] rounded-lg p-4 mb-4 shadow-md';
  sessionCard.dataset.sessionId = session._id;
  
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
        <button class="cancel-booking-btn bg-[#1E201E] hover:bg-[#2C2E2C] text-white px-3 py-1 rounded" data-booking-id="${session._id}">
          Cancel
        </button>
      </div>
    </div>
  `;
  
  return sessionCard;
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
    instructor: session.instructorName
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

// Function to add demo sessions from screenshot
function addDemoSessions() {
  // First check if there are existing sessions
  try {
    const existingSessions = localStorage.getItem('learnx_sessions');
    if (existingSessions) {
      // If we already have sessions, don't add duplicates
      const sessions = JSON.parse(existingSessions);
      if (sessions && sessions.length > 0) {
        console.log('Using existing sessions, not adding demos');
        return sessions;
      }
    }
  } catch (e) {
    console.error('Error checking existing sessions:', e);
  }
  
  // Get current user ID from token
  let currentUserId = null;
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      // Parse the token to get userId
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id;
      console.log('Current user ID for demo sessions:', currentUserId);
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }
  
  // Create the sessions from learn.html (shown in screenshot 2)
  const sessions = [
    {
      _id: 'gym-session-1',
      title: 'gym',
      description: 'i would help you guys i n upper body worouts',
      date: 'Wed, May 14',
      startTime: '02:30 PM',
      endTime: '04:30 PM',
      instructorName: 'Mohammad Sohail Pashe',
      price: '$5',
      userId: currentUserId,
      learnerId: currentUserId
    },
    {
      _id: 'scratch-session-1',
      title: 'scratch',
      description: 'bf j 4 n2 njqnj',
      date: 'Fri, May 16',
      startTime: '04:30 PM',
      endTime: '05:30 PM',
      instructorName: 'rafey mohd',
      price: '$5',
      userId: currentUserId,
      learnerId: currentUserId
    }
  ];
  
  // Save to localStorage only if we don't have sessions
  localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
  console.log('Added booked sessions from learn.html to localStorage:', sessions);
  return sessions;
}

// Save booked sessions to localStorage
function saveBookedSessionsToStorage(sessions) {
  if (sessions) {
    localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
    console.log('Saved booked sessions to localStorage:', sessions);
  }
}

// Load booked sessions from localStorage
function loadBookedSessionsFromStorage() {
  try {
    // Clear any existing sessions first
    localStorage.removeItem('learnx_booked_sessions');
    
    // Get the shared storage key
    const sharedSessions = localStorage.getItem('learnx_sessions');
    if (sharedSessions) {
      try {
        const sessions = JSON.parse(sharedSessions);
        console.log('Loaded ALL sessions from localStorage:', sessions);
        
        // If there are no sessions, add our demo sessions
        if (!sessions || sessions.length === 0) {
          return addDemoSessions();
        }
        
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
        if (currentUserId) {
          const userSessions = sessions.filter(session => {
            // Check if the session has a userId property that matches current user
            return session.userId === currentUserId || session.learnerId === currentUserId;
          });
          console.log(`Filtered ${sessions.length} sessions to ${userSessions.length} for user ${currentUserId}`);
          return userSessions;
        } else {
          console.warn('No user ID found in token, showing all sessions');
          return sessions;
        }
      } catch (parseError) {
        console.error('Error parsing shared sessions:', parseError);
        // If there's an error, add our demo sessions
        return addDemoSessions();
      }
    } else {
      // If no sessions exist, add our demo sessions
      return addDemoSessions();
    }
  } catch (e) {
    console.error('Error loading booked sessions from localStorage:', e);
    // If there's an error, add our demo sessions
    return addDemoSessions();
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
      // Reload from storage
      bookedSessions = loadBookedSessionsFromStorage() || [];
      
      // Clear calendar
      $('#calendar').fullCalendar('removeEvents');
      
      // Display sessions
      displayBookedSessions();
      
      // Add sessions to calendar
      if (bookedSessions.length > 0) {
        bookedSessions.forEach(session => {
          addBookedSessionToCalendar(session);
        });
      }
      
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
