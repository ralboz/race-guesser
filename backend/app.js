require('dotenv').config();
const express = require('express');
const cors = require('cors');
const publicRoutes = require('./routes/public');
const protectedRoutes = require('./routes/protected');

// Create Express app
const app = express();

// Set port
const PORT = process.env.PORT || 3001;

// Enable CORS - configure this for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON request body
app.use(express.json());

// Routes
app.use('/public', publicRoutes);
app.use('/protected', protectedRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle auth errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token or missing authentication' });
  }

  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// const express = require('express');
// const app = express();
// const { auth } = require('express-oauth2-jwt-bearer');
//
// const port = process.env.PORT || 3001;
//
// const jwtCheck = auth({
//   audience: 'f1-backend-api',
//   issuerBaseURL: 'https://f1-predictor.eu.auth0.com/',
//   tokenSigningAlg: 'RS256'
// });
//
// // enforce on all endpoints
// app.use(jwtCheck);
//
// app.get('/authorized', function (req, res) {
//   // Access the user's unique identifier
//   const userId = req.auth.payload.sub;
//   console.log("User ID:", userId);
//
//   res.send('Secured Resource');
// });
//
// app.listen(port);
//
// console.log('Running on port ', port);