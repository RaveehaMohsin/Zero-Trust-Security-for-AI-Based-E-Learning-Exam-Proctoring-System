const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const coursesRoutes = require('./routes/coursesCRUDRoutes');
const profileRoutes = require('./routes/profileRoutes');
const examRoutes = require('./routes/examRoutes')

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/courses' , coursesRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/exams', examRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});