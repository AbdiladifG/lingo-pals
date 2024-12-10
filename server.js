const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require("./config/database");
const mainRoutes = require("./routes/main");
const postRoutes = require("./routes/posts");
const roomRoutes = require("./routes/room");
const PORT = process.env.PORT || 3000

// Create HTTP server
const http = require("http");
const server = http.createServer(app);

// Initialize Socket.io
const io = require("socket.io")(server);

//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();

//Using EJS for views
app.set("view engine", "ejs");

//Static Folder
app.use(express.static("public"));

//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Create session middleware
const sessionMiddleware = session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
});

// Use session middleware with Express
app.use(sessionMiddleware);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, etc...
app.use(flash());

//Connect to database for the card decks collections
mongoose.connect(process.env.DB_STRING);
const db = mongoose.connection;

// Middleware to make db accessible to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/post", postRoutes);
app.use("/room", roomRoutes);

// Wrap session middleware for Socket.io
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

// Use session middleware with Socket.io
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

// Socket.io connection handling
io.on("connection", (socket) => {
  // Verify authentication
  if (!socket.request.user) {
    socket.disconnect();
    return;
  }

  console.log(`User connected: ${socket.request.user.userName}`);

  socket.on("join-room", async (roomName) => {
    socket.join(roomName);

    // Get current number of clients in this room
    const clients = io.sockets.adapter.rooms.get(roomName);
    const numClients = clients ? clients.size : 0;

    // Send initial participant count to all clients in room
    io.to(roomName).emit("participant-count", numClients);

    // Notify room of new participant
    io.to(roomName).emit("participant-joined", {
      userId: socket.request.user._id,
      userName: socket.request.user.userName,
      participantCount: numClients,
    });
  });

  socket.on("message", (data) => {
    // Broadcast message to room
    io.to(data.room).emit("message", {
      text: data.text,
      sender: socket.request.user.userName,
      timestamp: new Date(),
      isSelf: false,
    });
  });

  socket.on("leave-room", (roomName) => {
    socket.leave(roomName);

    // Get updated participant count
    const clients = io.sockets.adapter.rooms.get(roomName);
    const numClients = clients ? clients.size : 0;

    // Notify room that participant left with updated count
    io.to(roomName).emit("participant-left", {
      userId: socket.request.user._id,
      userName: socket.request.user.userName,
      participantCount: numClients,
    });

    // Send updated participant count
    io.to(roomName).emit("participant-count", numClients);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.request.user.userName}`);

    // Get all rooms this socket was in
    const rooms = [...socket.rooms];
    rooms.forEach((room) => {
      // Get updated count for each room
      const clients = io.sockets.adapter.rooms.get(room);
      const numClients = clients ? clients.size - 1 : 0; // Subtract 1 because user is leaving

      // Notify room of participant leaving
      io.to(room).emit("participant-left", {
        userId: socket.request.user._id,
        userName: socket.request.user.userName,
        participantCount: numClients,
      });

      // Send updated participant count
      io.to(room).emit("participant-count", numClients);
    });
  });
});

// Server Running
server.listen(PORT, () => {
  console.log("Server is running, you better catch it!");
});

// Export io instance for use in other files if needed
module.exports = { app, io, server };
