// Live Sessions Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const liveSessionsContainer = document.getElementById('live-sessions-container');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorContainer = document.getElementById('error-container');
  const jitsiContainer = document.getElementById('jitsi-container');

  let jitsiMeetExternalAPI = null;

  // Function to fetch live sessions
  async function fetchLiveSessions() {
    try {
      // Show loading indicator
      loadingIndicator.classList.remove('hidden');
      errorContainer.classList.add('hidden');
      liveSessionsContainer.innerHTML = '';

      // Get user ID from local storage or session
      const userId = localStorage.getItem('userId');

      // Fetch live sessions
      const response = await fetch(`/api/live-sessions${userId ? `?userId=${userId}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      // Hide loading indicator
      loadingIndicator.classList.add('hidden');

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch live sessions');
      }

      // Display sessions
      displayLiveSessions(result.data);
    } catch (error) {
      // Handle errors
      loadingIndicator.classList.add('hidden');
      errorContainer.classList.remove('hidden');
      errorContainer.textContent = error.message;
      console.error('Error fetching live sessions:', error);
    }
  }

  // Function to display live sessions
  function displayLiveSessions(sessions) {
    if (!sessions || sessions.length === 0) {
      liveSessionsContainer.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-video-slash text-6xl text-secondary mb-4"></i>
          <p class="text-xl text-secondary">No live sessions available right now</p>
        </div>
      `;
      return;
    }

    sessions.forEach(session => {
      const sessionCard = document.createElement('div');
      sessionCard.className = 'session-card bg-surface-2 p-6 rounded-lg shadow-md mb-4 hover:shadow-lg transition-all';
      
      // Format dates
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);

      sessionCard.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <span class="badge badge-success">Live Now</span>
          <span class="text-sm text-secondary">
            ${startDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        <h3 class="text-xl font-semibold mb-2">${session.title}</h3>
        <p class="text-secondary mb-4">${session.description || 'No description provided'}</p>
        
        <div class="flex items-center mb-4">
          <img src="${session.teacher_profile_pic || 'default-profile.png'}" 
               alt="${session.teacher_name}" 
               class="w-12 h-12 rounded-full mr-4">
          <div>
            <p class="font-medium">${session.teacher_name}</p>
            <p class="text-xs text-secondary">${session.teacher_headline || 'Instructor'}</p>
          </div>
        </div>
        
        <div class="flex justify-between items-center border-t pt-4">
          <div class="flex items-center">
            <i class="fas fa-users text-primary mr-2"></i>
            <span class="text-sm">
              ${session.current_participants || 0} Participants
            </span>
          </div>
          <button onclick="joinLiveSession('${session.id}')" 
                  class="btn btn-success btn-sm">
            Join Session
          </button>
        </div>
      `;

      liveSessionsContainer.appendChild(sessionCard);
    });
  }

  // Function to join a live session
  async function joinLiveSession(sessionId) {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        showToast('Please log in to join a session', 'error');
        return;
      }

      const response = await fetch('/api/live-sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, sessionId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to join session');
      }

      // Initialize Jitsi Meet
      initializeJitsiMeet(sessionId);
    } catch (error) {
      console.error('Error joining live session:', error);
      showToast(error.message, 'error');
    }
  }

  // Initialize Jitsi Meet for video conferencing
  function initializeJitsiMeet(sessionId) {
    // Clean up any existing Jitsi instance
    if (jitsiMeetExternalAPI) {
      jitsiMeetExternalAPI.dispose();
    }

    // Get user details
    const userName = localStorage.getItem('userName') || 'Anonymous User';
    const userEmail = localStorage.getItem('userEmail') || '';

    // Jitsi Meet configuration
    const domain = 'meet.jit.si';
    const options = {
      roomName: `LearnX-Session-${sessionId}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer,
      userInfo: {
        displayName: userName,
        email: userEmail
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false
      }
    };

    // Create Jitsi Meet instance
    jitsiMeetExternalAPI = new JitsiMeetExternalAPI(domain, options);

    // Event listeners
    jitsiMeetExternalAPI.on('videoConferenceJoined', () => {
      console.log('Joined video conference');
      showToast('Successfully joined the live session', 'success');
    });

    jitsiMeetExternalAPI.on('videoConferenceLeft', () => {
      console.log('Left video conference');
      leaveLiveSession(sessionId);
    });
  }

  // Leave a live session
  async function leaveLiveSession(sessionId) {
    try {
      const userId = localStorage.getItem('userId');
      
      await fetch('/api/live-sessions/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, sessionId })
      });

      // Clean up Jitsi instance
      if (jitsiMeetExternalAPI) {
        jitsiMeetExternalAPI.dispose();
        jitsiMeetExternalAPI = null;
      }

      showToast('Left the live session', 'info');
      fetchLiveSessions(); // Refresh sessions
    } catch (error) {
      console.error('Error leaving live session:', error);
    }
  }

  // Initialize page
  fetchLiveSessions();

  // Attach global functions
  window.joinLiveSession = joinLiveSession;
  window.leaveLiveSession = leaveLiveSession;
});
