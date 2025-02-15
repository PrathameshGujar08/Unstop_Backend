const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  // Allow specific methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // Allow specific headers
  next();
});

app.use(cors());
app.use(bodyParser.json());

let rooms = [];

// Create rooms (97 rooms, 10 floors, Floor 10 has 7 rooms)
const initializeRooms = () => {
  rooms = [];
  for (let floor = 1; floor <= 10; floor++) {
    let maxRooms = floor === 10 ? 7 : 10;
    for (let i = 1; i <= maxRooms; i++) {
      rooms.push({ roomNumber: floor * 100 + i, floor, isBooked: false });
    }
  }
};

// Initialize rooms array
initializeRooms();

app.get('/', (req, res) => {
  res.send('Hotel Booking API');
})

// Get all rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// Book rooms
app.post('/api/book', (req, res) => {
  const { numRooms } = req.body;
  let availableRooms = rooms.filter(room => !room.isBooked);

  if (availableRooms.length < numRooms) {
    return res.status(400).json({ message: 'Not enough rooms available' });
  }

  let bestSelection = null;
  let minTravelTime = Infinity;

  // Create Object with floors as keys and rooms as values
  const floors = {};
  availableRooms.forEach(room => {
    if (!floors[room.floor]) floors[room.floor] = [];
    floors[room.floor].push(room);
  });

  // Algorithm for optimal Selection of Rooms
  for (let floor in floors) {
    if (floors[floor].length >= numRooms) { // Prioritize single-floor selections
      let sortedRooms = floors[floor].sort((a, b) => a.roomNumber - b.roomNumber);
      for (let i = 0; i <= sortedRooms.length - numRooms; i++) {
        let selectedRooms = sortedRooms.slice(i, i + numRooms);
        let travelTime = selectedRooms[numRooms - 1].roomNumber - selectedRooms[0].roomNumber;
        if (travelTime < minTravelTime) {
          minTravelTime = travelTime;
          bestSelection = selectedRooms;
        }
      }
    }
  }

  // If no single-floor selection is found, minimize vertical & horizontal travel
  if (!bestSelection) {
    let sortedAvailableRooms = availableRooms.sort((a, b) => a.roomNumber - b.roomNumber);
    bestSelection = sortedAvailableRooms.slice(0, numRooms);
  }

  bestSelection.forEach(room => (room.isBooked = true));
  res.json({ message: 'Rooms booked', rooms: bestSelection });
});



// Reset all bookings
app.post('/api/reset', (req, res) => {
  rooms.forEach(room => (room.isBooked = false));
  res.json({ message: 'All bookings reset' });
});

// Randomly book rooms
app.post('/api/randomize', (req, res) => {
  rooms.forEach(room => (room.isBooked = Math.random() < 0.4)); // 40% chance of booking each room
  res.json({ message: 'Random occupancy generated' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
