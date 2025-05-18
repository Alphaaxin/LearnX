# LearnX Backend

Backend API for the LearnX platform, a peer-driven skill-exchange platform with barter or paid sessions between learners and teachers.

## Technologies

- Node.js
- Express
- PostgreSQL
- Sequelize ORM
- Socket.IO for real-time chat
- JWT for authentication

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `env.example`
4. Create a PostgreSQL database and update the `.env` file with your database credentials
5. Run the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Users

- `GET /api/users/profile/:id?` - Get user profile (own or other user)
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/teachers` - Get teachers (optionally filtered by skill)

### Sessions

- `POST /api/sessions` - Create a new session (teacher only)
- `GET /api/sessions` - Get all sessions with filters
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session (teacher only)
- `DELETE /api/sessions/:id` - Delete session (teacher only)
- `GET /api/sessions/teacher/:teacherId?` - Get teacher's sessions

### Bookings

- `POST /api/bookings` - Create a new booking (learner only)
- `GET /api/bookings/user` - Get user's bookings
- `GET /api/bookings/teacher` - Get bookings for teacher's sessions
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/bookings/:id/payment` - Update payment status

### Chat

- `GET /api/chat/history/:recipientId` - Get chat history between two users
- `POST /api/chat/send` - Send a message
- `GET /api/chat/contacts` - Get user's chat contacts

### Reviews

- `POST /api/reviews` - Create a new review (learner only)
- `GET /api/reviews/session/:sessionId` - Get reviews for a session
- `GET /api/reviews/teacher/:teacherId` - Get reviews for a teacher
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review

## Real-time Features

The application uses Socket.IO for real-time chat functionality. Clients can connect to the WebSocket server to receive and send messages in real-time.

## Database Schema

The application uses the following models:

- User - User accounts with roles (learner, teacher, both)
- Session - Skill sessions created by teachers
- Booking - Session bookings made by learners
- Message - Chat messages between users
- Review - Session reviews by learners

## License

MIT 