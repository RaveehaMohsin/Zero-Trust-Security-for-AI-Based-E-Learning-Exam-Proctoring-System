const pool = require("../config/db");
const { decrypt } = require("../utils/crypto");


exports.registerCourse = async (req, res) => {
    try {
      const { encryptedData, iv } = req.body;
  
      if (!encryptedData || !iv) {
        return res.status(400).json({
          success: false,
          message: "Encrypted data and IV are required"
        });
      }
  
      const decryptedCourseId = decrypt({ encryptedData, iv });
      const course_id = parseInt(decryptedCourseId, 10);
  
      if (isNaN(course_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID"
        });
      }
  
      const student_id = req.user.id;
  
      // Check if course exists and is active
      const [course] = await pool.query(
        'SELECT * FROM courses WHERE id = ? AND status = "active"',
        [course_id]
      );
  
      if (course.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Course not available for registration",
        });
      }
  
      // Check if student is already registered
      const [existing] = await pool.query(
        "SELECT * FROM course_registrations WHERE course_id = ? AND student_id = ?",
        [course_id, student_id]
      );
  
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You are already registered for this course",
        });
      }
  
      // Check if course has available seats
      if (course[0].current_students >= course[0].max_students) {
        return res.status(400).json({
          success: false,
          message: "Course has reached maximum capacity",
        });
      }
  
      // Register student
      await pool.query(
        "INSERT INTO course_registrations (course_id, student_id) VALUES (?, ?)",
        [course_id, student_id]
      );
  
      // Update course student count
      await pool.query(
        "UPDATE courses SET current_students = current_students + 1 WHERE id = ?",
        [course_id]
      );
  
      res.status(201).json({
        success: true,
        message: "Course registration successful",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to register for course",
      });
    }
  };
exports.getRegisteredCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.* FROM courses c
       JOIN course_registrations cr ON c.id = cr.course_id
       WHERE cr.student_id = ? AND c.status = 'active'`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error fetching registered courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registered courses",
    });
  }
};

exports.getAvailableCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.* FROM courses c
       WHERE c.status = 'active' 
       AND c.current_students < c.max_students
       AND c.id NOT IN (
         SELECT course_id FROM course_registrations 
         WHERE student_id = ?
       )`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error fetching available courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available courses",
    });
  }
};


// exports.getUpcomingExams = async (req, res) => {
//     try {
//       const [upcomingExams] = await pool.query(
//         `SELECT e.id, e.title as exam_title, e.description as exam_description,
//          e.start_time as exam_date, e.end_time,
//          c.id as course_id, c.code as course_code, c.title as course_title,
//          u.name as invigilator_name,
//          TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
//          FROM exams e
//          JOIN courses c ON e.course_id = c.id
//          JOIN users u ON e.invigilator_id = u.id
//          JOIN course_registrations cr ON c.id = cr.course_id
//          WHERE cr.student_id = ? AND cr.status = 'active'
//          AND e.end_time > NOW()
//          ORDER BY e.start_time ASC`,
//         [req.user.id]
//       );
  
//       // Modified query to only get completed exams that have results
//       const [completedExamsWithResults] = await pool.query(
//         `SELECT e.id, e.title as exam_title, e.description as exam_description,
//          e.start_time as exam_date, e.end_time,
//          c.id as course_id, c.code as course_code, c.title as course_title,
//          u.name as invigilator_name,
//          er.score, er.created_at,
//          TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
//          FROM exams e
//          JOIN courses c ON e.course_id = c.id
//          JOIN users u ON e.invigilator_id = u.id
//          JOIN course_registrations cr ON c.id = cr.course_id
//          JOIN exam_results er ON e.id = er.exam_id AND er.student_id = cr.student_id
//          WHERE cr.student_id = ? AND cr.status = 'active'
//          AND e.end_time <= NOW()
//          ORDER BY e.end_time DESC`,
//         [req.user.id]
//       );
  
//       res.status(200).json({
//         success: true,
//         upcomingExams: upcomingExams.map(exam => ({
//           ...exam,
//           duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
//         })),
//         completedExams: completedExamsWithResults.map(exam => ({
//           ...exam,
//           result: {
//             score: exam.score,
//             created_at: exam.created_at
//           },
//           duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
//         }))
//       });
//     } catch (error) {
//       console.error('Error fetching exams:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to fetch exams'
//       });
//     }
//   };


// exports.getUpcomingExams = async (req, res) => {
//   try {
//       // First get all active course exams that haven't ended yet
//       const [upcomingExams] = await pool.query(
//           `SELECT e.id, e.title as exam_title, e.description as exam_description,
//            e.start_time as exam_date, e.end_time,
//            c.id as course_id, c.code as course_code, c.title as course_title,
//            u.name as invigilator_name,
//            TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
//            FROM exams e
//            JOIN courses c ON e.course_id = c.id
//            JOIN users u ON e.invigilator_id = u.id
//            JOIN course_registrations cr ON c.id = cr.course_id
//            WHERE cr.student_id = ? AND cr.status = 'active'
//            AND e.end_time > NOW()
//            ORDER BY e.start_time ASC`,
//           [req.user.id]
//       );

//       // Get exams that have ended but don't have both attempts and results
//       const [endedButNotCompleted] = await pool.query(
//           `SELECT e.id
//            FROM exams e
//            JOIN course_registrations cr ON e.course_id = cr.course_id
//            WHERE cr.student_id = ? AND cr.status = 'active'
//            AND e.end_time <= NOW()
//            AND (NOT EXISTS (
//                SELECT 1 FROM exam_attempts ea 
//                WHERE ea.exam_id = e.id AND ea.student_id = cr.student_id
//            ) OR NOT EXISTS (
//                SELECT 1 FROM exam_results er 
//                WHERE er.exam_id = e.id AND er.student_id = cr.student_id
//            ))`,
//           [req.user.id]
//       );

//       // Combine upcoming exams with those that ended but aren't fully completed
//       const allUpcomingExams = [...upcomingExams, ...endedButNotCompleted];

//       // Modified query to only get completed exams that have both attempts and results
//       const [completedExamsWithResults] = await pool.query(
//           `SELECT e.id, e.title as exam_title, e.description as exam_description,
//            e.start_time as exam_date, e.end_time,
//            c.id as course_id, c.code as course_code, c.title as course_title,
//            u.name as invigilator_name,
//            er.score, er.created_at,
//            TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
//            FROM exams e
//            JOIN courses c ON e.course_id = c.id
//            JOIN users u ON e.invigilator_id = u.id
//            JOIN course_registrations cr ON c.id = cr.course_id
//            JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.student_id = cr.student_id
//            JOIN exam_results er ON e.id = er.exam_id AND er.student_id = cr.student_id
//            WHERE cr.student_id = ? AND cr.status = 'active'
//            ORDER BY e.end_time DESC`,
//           [req.user.id]
//       );

//       res.status(200).json({
//           success: true,
//           upcomingExams: allUpcomingExams.map(exam => ({
//               ...exam,
//               duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
//           })),
//           completedExams: completedExamsWithResults.map(exam => ({
//               ...exam,
//               result: {
//                   score: exam.score,
//                   created_at: exam.created_at
//               },
//               duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
//           }))
//       });
//   } catch (error) {
//       console.error('Error fetching exams:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Failed to fetch exams'
//       });
//   }
// };


exports.getUpcomingExams = async (req, res) => {
  try {
    // First get all active course exams that haven't ended yet OR 
    // have ended but don't have both attempts and results
    const [upcomingExams] = await pool.query(
      `SELECT e.id, e.title as exam_title, e.description as exam_description,
       e.start_time as exam_date, e.end_time,
       c.id as course_id, c.code as course_code, c.title as course_title,
       u.name as invigilator_name,
       TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
       FROM exams e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.invigilator_id = u.id
       JOIN course_registrations cr ON c.id = cr.course_id
       WHERE cr.student_id = ? AND cr.status = 'active'
       AND (
         NOT EXISTS (
           SELECT 1 FROM exam_attempts ea 
           WHERE ea.exam_id = e.id AND ea.student_id = cr.student_id
         ) OR
         NOT EXISTS (
           SELECT 1 FROM exam_results er 
           WHERE er.exam_id = e.id AND er.student_id = cr.student_id
         )
       )
       ORDER BY e.start_time ASC`,
      [req.user.id]
    );

    // Get only truly completed exams (have ended AND have both attempts and results)
    const [completedExamsWithResults] = await pool.query(
      `SELECT e.id, e.title as exam_title, e.description as exam_description,
       e.start_time as exam_date, e.end_time,
       c.id as course_id, c.code as course_code, c.title as course_title,
       u.name as invigilator_name,
       er.score, er.created_at,
       TIMESTAMPDIFF(MINUTE, e.start_time, e.end_time) as duration
       FROM exams e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.invigilator_id = u.id
       JOIN course_registrations cr ON c.id = cr.course_id
       JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.student_id = cr.student_id
       JOIN exam_results er ON e.id = er.exam_id AND er.student_id = cr.student_id
       WHERE cr.student_id = ? AND cr.status = 'active'
       ORDER BY e.end_time DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      upcomingExams: upcomingExams.map(exam => ({
        ...exam,
        duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
      })),
      completedExams: completedExamsWithResults.map(exam => ({
        ...exam,
        result: {
          score: exam.score,
          created_at: exam.created_at
        },
        duration: Math.round((new Date(exam.end_time) - new Date(exam.start_time)) / (1000 * 60))
      }))
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams'
    });
  }
};

     //  AND e.end_time <= NOW()
    //  before order by in complete