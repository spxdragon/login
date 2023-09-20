javascript
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/chatroom', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a message schema
const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

// Create a message model
const Message = mongoose.model('Message', messageSchema);

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Load previous messages from the database
  Message.find().sort({ timestamp: 1 }).exec((err, messages) => {
    if (err) {
      console.error('Error loading messages:', err);
    } else {
      socket.emit('load messages', messages);
    }
  });

  // Handle new messages
  socket.on('new message', (data) => {
    // Save the message in the database
    const message = new Message(data);
    message.save((err) => {
      if (err) {
        console.error('Error saving message:', err);
      } else {
        // Broadcast the new message to all connected sockets
        io.emit('new message', data);
      }
    });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
