// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/authRoutes');
// const coursesRoutes = require('./routes/coursesCRUDRoutes');
// const profileRoutes = require('./routes/profileRoutes');
// const examRoutes = require('./routes/examRoutes');
// const registerCourseRoute = require('./routes/courseRegisterRoute&ExamNotifications')
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');

// dotenv.config();
// const app = express();


// // Add security middleware
// app.use(helmet());
// app.use(express.json({ limit: '10kb' })); // Prevent large payloads

// // Rate limiting for exam endpoints
// const examLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later'
// });


// app.use(cors({
//   exposedHeaders: ['User-Agent'] // Add this to your CORS config
// }));
// app.use(express.json());

// app.use('/uploads', express.static('uploads'));

// app.use('/api/auth', authRoutes);
// app.use('/api/courses' , coursesRoutes);
// app.use('/api/profiles', profileRoutes);
// app.use('/api/exams', examRoutes);
// app.use('/api/courses', registerCourseRoute);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const coursesRoutes = require('./routes/coursesCRUDRoutes');
const profileRoutes = require('./routes/profileRoutes');
const examRoutes = require('./routes/examRoutes');
const registerCourseRoute = require('./routes/courseRegisterRoute');
const examgeneration = require('./routes/examinterfaceRoutes')
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});

const examLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many exam requests from this IP'
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['User-Agent'],
  optionsSuccessStatus: 200
}));

app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Apply rate limiters
app.use(generalLimiter);
app.use('/api/exams', examLimiter, examRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/courses', registerCourseRoute);
app.use('/api/examgeneration' , examgeneration);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});