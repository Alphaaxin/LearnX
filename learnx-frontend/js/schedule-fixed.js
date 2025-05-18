// Scheduled Sessions Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize variables for booked sessions
  let bookedSessions = [];

  // Once DOM is fully loaded
  $(document).ready(function() {
    // Add swimming session to localStorage
    initializeWithSwimmingSession();
    
    // Load sessions from localStorage
    bookedSessions = loadBookedSessionsFromStorage() || [];
    
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
    
    // Add existing booked sessions to calendar
    setTimeout(() => {
      if (bookedSessions && bookedSessions.length > 0) {
        bookedSessions.forEach(session => {
          addBookedSessionToCalendar(session);
        });
      }
    }, 500);
  }
  
  // Function to display booked sessions in the UI
  function displayBookedSessions() {
    const bookedSessionsContainer = document.getElementById('booked-sessions-container');
    
    if (!bookedSessionsContainer) {
      console.error("Error: Could not find booked sessions container!");
      return;
    }
    
    // Clear current sessions
    bookedSessionsContainer.innerHTML = '';
    
    // Check if we have any booked sessions
    if (!bookedSessions || bookedSessions.length === 0) {
      // No sessions booked yet
      bookedSessionsContainer.innerHTML = '<div class="p-6 text-center">No booked sessions yet. Book a session to see it here!</div>';
      return;
    }
    
    // Loop through each booked session and display it
    bookedSessions.forEach(session => {
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
      
      // Add the card to the container
      bookedSessionsContainer.appendChild(sessionCard);
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
  
  // Initialize with gym and scratch sessions that match the screenshots
  function initializeWithSwimmingSession() {
    // Always reset the sessions to match what's in learn.html
    
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
        price: '$5'
      },
      {
        _id: 'scratch-session-1',
        title: 'scratch',
        description: 'bf j 4 n2 njqnj',
        date: 'Fri, May 16',
        startTime: '04:30 PM',
        endTime: '05:30 PM',
        instructorName: 'rafey mohd',
        price: '$5'
      }
    ];
    
    // Save to localStorage, completely replacing any existing sessions
    localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
    console.log('Added booked sessions from learn.html to localStorage:', sessions);
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
      // Clear any existing old format sessions
      localStorage.removeItem('learnx_booked_sessions');
      
      // Get the shared storage key
      const sharedSessions = localStorage.getItem('learnx_sessions');
      if (sharedSessions) {
        try {
          const sessions = JSON.parse(sharedSessions);
          console.log('Loaded sessions from localStorage:', sessions);
          return sessions;
        } catch (parseError) {
          console.error('Error parsing sessions:', parseError);
        }
      }
    } catch (e) {
      console.error('Error loading sessions from localStorage:', e);
    }
    return [];
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
});
