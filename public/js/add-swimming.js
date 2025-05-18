// Script to add the swimming session to localStorage
// Run this once to ensure both gym and swimming appear

function addSwimmingSession() {
  try {
    // Get existing sessions
    const existingSessions = localStorage.getItem('learnx_sessions');
    let sessions = [];
    
    if (existingSessions) {
      sessions = JSON.parse(existingSessions);
    }
    
    // Check if swimming session already exists
    const hasSwimming = sessions.some(session => 
      session.title && session.title.toLowerCase() === 'swimming');
    
    // If swimming is missing, add it
    if (!hasSwimming) {
      // Swimming session from the screenshot
      const swimmingSession = {
        _id: 'swimming-session-1',
        title: 'swimming',
        description: 'i will techh you howw to swimm',
        date: 'Wed, May 14',
        startTime: '03:20 PM',
        endTime: '04:20 PM',
        instructorName: 'Mohammad Sohail Pashe',
        price: '$2'
      };
      
      // Add swimming to sessions
      sessions.push(swimmingSession);
      
      // Save updated sessions
      localStorage.setItem('learnx_sessions', JSON.stringify(sessions));
      console.log('Added swimming session to sessions:', sessions);
    } else {
      console.log('Swimming session already exists');
    }
    
    // Return the updated sessions
    return sessions;
  } catch (e) {
    console.error('Error adding swimming session:', e);
    return [];
  }
}

// Run the function
addSwimmingSession();
