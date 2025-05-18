// LearnX API Integration
// Use the configuration values if available, otherwise fallback to localhost
const API_BASE_URL = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token
function getToken() {
  return localStorage.getItem('token');
}

// Helper for API calls with authentication
async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // If response is 401 Unauthorized, redirect to login
    if (response.status === 401) {
      console.error('Authentication expired or invalid');
      localStorage.removeItem('token');
      window.location.href = '/learnx-frontend/login.html';
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error occurred' };
      }
      throw new Error(errorData.message || 'API request failed');
    }
    
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : {};
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const AuthAPI = {
  // Register a new user
  async register(userData) {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return response.json();
  },
  
  // Login user
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const result = await response.json();
    
    // Store token in local storage
    localStorage.setItem('token', result.token);
    
    // Fetch full user profile data to ensure we have the profile picture
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${result.token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Process profile image paths if necessary
        if (userData.user && userData.user.profilePhoto) {
          if (!userData.user.profilePhoto.startsWith('data:') && !userData.user.profilePhoto.startsWith('http')) {
            // Convert relative server paths to absolute URLs
            const serverUrl = 'http://localhost:5000';
            userData.user.profilePhoto = userData.user.profilePhoto.startsWith('/') ? 
              `${serverUrl}${userData.user.profilePhoto}` : 
              `${serverUrl}/uploads/${userData.user.profilePhoto}`;
          }
        }
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData.user));
        console.log('Stored user data after login:', userData.user);
      }
    } catch (err) {
      console.error('Error fetching user details after login:', err);
      // Continue anyway since we have the token
    }
    
    return result;
  },
  
  // Logout user
  async logout() {
    await fetchWithAuth('/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
  },
  
  // Get current user
  async getCurrentUser() {
    return fetchWithAuth('/auth/me');
  },
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    return fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }
};

// Users API
const UsersAPI = {
  // Get user profile
  async getUserProfile(userId = null) {
    const endpoint = userId ? `/users/profile/${userId}` : '/users/profile';
    return fetchWithAuth(endpoint);
  },
  
  // Update user profile
  async updateUserProfile(userData) {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });
    
    const token = getToken();
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Profile update failed');
    }
    
    return response.json();
  },
  
  // Get teachers
  async getTeachers(skill = null) {
    const params = skill ? `?skill=${encodeURIComponent(skill)}` : '';
    return fetchWithAuth(`/users/teachers${params}`);
  }
};

// Sessions API
const SessionsAPI = {
  // Create a session
  async createSession(sessionData) {
    return fetchWithAuth('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  },
  
  // Get all sessions with filters
  async getSessions(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    return fetchWithAuth(`/sessions?${params.toString()}`);
  },
  
  // Get session by ID
  async getSessionById(id) {
    return fetchWithAuth(`/sessions/${id}`);
  },
  
  // Update session
  async updateSession(id, sessionData) {
    return fetchWithAuth(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  },
  
  // Delete session
  async deleteSession(id) {
    return fetchWithAuth(`/sessions/${id}`, { method: 'DELETE' });
  },
  
  // Get teacher's sessions
  async getTeacherSessions(teacherId = null) {
    const endpoint = teacherId ? 
      `/sessions/teacher/${teacherId}` : 
      '/sessions/teacher';
    
    return fetchWithAuth(endpoint);
  }
};

// Bookings API
const BookingsAPI = {
  // Create a booking
  async createBooking(sessionId, notes = '') {
    return fetchWithAuth('/bookings', {
      method: 'POST',
      body: JSON.stringify({ sessionId, notes })
    });
  },
  
  // Get user's bookings
  async getUserBookings() {
    return fetchWithAuth('/bookings/user');
  },
  
  // Get bookings for teacher's sessions
  async getTeacherBookings() {
    return fetchWithAuth('/bookings/teacher');
  },
  
  // Get booking by ID
  async getBookingById(id) {
    return fetchWithAuth(`/bookings/${id}`);
  },
  
  // Update booking status
  async updateBookingStatus(id, status) {
    return fetchWithAuth(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },
  
  // Update payment status
  async updatePaymentStatus(id, paymentStatus, paymentId = null) {
    return fetchWithAuth(`/bookings/${id}/payment`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus, paymentId })
    });
  }
};

// Chat API
const ChatAPI = {
  // Get chat history with a user
  async getChatHistory(recipientId) {
    return fetchWithAuth(`/chat/history/${recipientId}`);
  },
  
  // Send a message
  async sendMessage(receiverId, content) {
    return fetchWithAuth('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content })
    });
  },
  
  // Get user's chat contacts
  async getChatContacts() {
    return fetchWithAuth('/chat/contacts');
  }
};

// Reviews API
const ReviewsAPI = {
  // Create a review
  async createReview(bookingId, rating, comment = '') {
    return fetchWithAuth('/reviews', {
      method: 'POST',
      body: JSON.stringify({ bookingId, rating, comment })
    });
  },
  
  // Get reviews for a session
  async getSessionReviews(sessionId) {
    return fetchWithAuth(`/reviews/session/${sessionId}`);
  },
  
  // Get reviews for a teacher
  async getTeacherReviews(teacherId) {
    return fetchWithAuth(`/reviews/teacher/${teacherId}`);
  },
  
  // Update a review
  async updateReview(id, rating, comment) {
    return fetchWithAuth(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment })
    });
  },
  
  // Delete a review
  async deleteReview(id) {
    return fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
  }
};

// Socket.IO chat integration
function initializeChat(token) {
  if (!window.io) {
    console.error('Socket.IO not loaded');
    return null;
  }
  
  const socket = io('http://localhost:5000', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Connected to chat server');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message);
  });

  return {
    socket,
    
    // Send a message
    sendMessage(receiverId, content) {
      socket.emit('privateMessage', { receiverId, content });
    },

    // Mark message as read
    markAsRead(messageId) {
      socket.emit('markAsRead', { messageId });
    },

    // Show typing indicator
    showTyping(receiverId) {
      socket.emit('typing', { receiverId });
    },

    // Stop typing indicator
    stopTyping(receiverId) {
      socket.emit('stopTyping', { receiverId });
    },
    
    // Register message listener
    onMessage(callback) {
      socket.on('privateMessage', callback);
    },
    
    // Register status change listener
    onUserStatus(callback) {
      socket.on('userStatus', callback);
    },
    
    // Register read receipt listener
    onMessageRead(callback) {
      socket.on('messageRead', callback);
    },
    
    // Register typing indicator listener
    onTyping(callback) {
      socket.on('typing', callback);
    },
    
    // Register stop typing listener
    onStopTyping(callback) {
      socket.on('stopTyping', callback);
    }
  };
}

// Export all API modules
window.LearnXAPI = {
  Auth: AuthAPI,
  Users: UsersAPI,
  Sessions: SessionsAPI,
  Bookings: BookingsAPI,
  Chat: ChatAPI,
  Reviews: ReviewsAPI,
  initializeChat
}; 