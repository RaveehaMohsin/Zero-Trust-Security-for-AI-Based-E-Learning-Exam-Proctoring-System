const pool = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { encrypt, generateSecureHash } = require("../utils/crypto");
const logger = require('../utils/logger');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.startExam = async (req, res) => {
try {
  const { examId } = req.params;
  const studentId = req.user.id;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const deviceFingerprint = `${userAgent}::${ipAddress}`.replace(/::1$/, '::127.0.0.1');

  // 1. First check exam availability
  const [exam] = await pool.query(
    `SELECT * FROM exams WHERE id = ? AND start_time <= NOW() AND end_time >= NOW()`,
    [examId]
  );

  if (exam.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Exam is not currently available"
    });
  }
  // 2. Check for ANY active exam attempt (regardless of device)
  const [activeAttempt] = await pool.query(
    `SELECT id FROM exam_attempts 
     WHERE exam_id = ? AND student_id = ? AND end_time IS NULL`,
    [examId, studentId]
  );

  if (activeAttempt.length > 0) {
    // Check if this is same device trying to reload
    const currentDeviceHash = generateSecureHash(deviceFingerprint);
    
    if (activeAttempt[0].device_hash === currentDeviceHash) {
      // Same device - allow reload but return existing attempt
      const [existingQuestions] = await pool.query(
        `SELECT questions FROM exam_attempts WHERE id = ?`,
        [activeAttempt[0].id]
      );
      
      return res.status(200).json({
        success: true,
        exam: exam[0],
        questions: {
          encryptedData: existingQuestions[0].questions
        },
        existingAttempt: true
      });
    } else {
      // Different device/browser - block access
      return res.status(403).json({
        success: false,
        message: "Exam already in progress on another device/browser",
        blockMultipleDevices: true
      });
    }
  }

  // 3. Check device access status
  const [existingAccess] = await pool.query(
    `SELECT status FROM exam_access_log 
     WHERE exam_id = ? AND student_id = ? AND device_hash = ?`,
    [examId, studentId, generateSecureHash(deviceFingerprint)]
  );

  // 4. If no record exists or was rejected, require verification
  if (!existingAccess.length || existingAccess[0].status === 'rejected') {
    await pool.query(
      `INSERT INTO exam_access_log 
       (exam_id, student_id, device_hash, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending'`,
      [examId, studentId, generateSecureHash(deviceFingerprint), ipAddress, userAgent]
    );
    
    return res.status(403).json({
      success: false,
      message: "Device verification required",
      requiresSecurityQuestion: true
    });
  }

  // 5. Verify access is approved for current device
  if (existingAccess[0].status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: "Device not approved for exam access"
    });
  }


    // Generate and encrypt questions
    const questions = await generateExamQuestions(exam[0]);
    const encryptedQuestions = encrypt(JSON.stringify(questions));


    // Record exam attempt
    await pool.query(
      `INSERT INTO exam_attempts 
       (exam_id, student_id, start_time, questions , encryptedQuestions)
       VALUES (?, ?, NOW(), ?, ?)`,
      [examId, studentId, JSON.stringify(questions) , encryptedQuestions.encryptedData, 
      //  generateSecureHash(deviceFingerprint)
      ]
    );

    res.status(200).json({
      success: true,
      exam: exam[0],
      questions: encryptedQuestions
    });

  } catch (error) {
    logger.error(`Exam start failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to start exam"
    });
  }
};


async function generateExamQuestions(exam) {
  try {
    const prompt = `Generate 10 multiple choice questions about ${exam.title} for a university exam. 
    The exam description is: ${exam.description}. 
    Each question should have 4 options and indicate the correct answer. 
    Return in JSON format with fields: question, options (array), correctAnswer (index).`;

    // Use the correct model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) throw new Error("No questions generated");

    let questions;
    try {
      questions = JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Could not parse questions");
      }
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    questions.forEach((q, i) => {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswer !== "number"
      ) {
        throw new Error(`Invalid question format at index ${i}`);
      }
    });

    return questions;
  } catch (error) {
    console.error("Question generation failed:", {
      error: error.message,
      stack: error.stack,
      examDetails: {
        title: exam.title,
        description: exam.description,
      },
      timestamp: new Date().toISOString(),
    });
    return getFallbackQuestions(exam);
  }
}

function getFallbackQuestions(exam) {
  return [
    {
      question: `What is the primary focus of ${exam.title}?`,
      options: [
        "Fundamental concepts of the subject",
        "Advanced theoretical frameworks",
        "Practical applications",
        "Historical development",
      ],
      correctAnswer: 0,
    },
    {
      question: `Which of these is most relevant to ${exam.title}?`,
      options: [
        "Basic principles covered in the course",
        "Unrelated topic A",
        "Unrelated topic B",
        "Unrelated topic C",
      ],
      correctAnswer: 0,
    },
  ];
}

exports.submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id;

    // Validate input
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid answers format",
      });
    }

    // Verify exam attempt exists and is ongoing
    const [attempt] = await pool.query(
      `SELECT * FROM exam_attempts 
         WHERE exam_id = ? AND student_id = ? AND end_time IS NULL`,
      [examId, studentId]
    );

    if (attempt.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active exam attempt found",
      });
    }

    // Get exam details
    const [exam] = await pool.query(`SELECT * FROM exams WHERE id = ?`, [
      examId,
    ]);

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Get the original questions
    const [attemptWithQuestions] = await pool.query(
      `SELECT questions FROM exam_attempts WHERE id = ?`,
      [attempt[0].id]
    );

    if (!attemptWithQuestions[0]?.questions) {
      return res.status(400).json({
        success: false,
        message: "Exam questions not found",
      });
    }

    const examQuestions = JSON.parse(attemptWithQuestions[0].questions);

    // Calculate score - FIXED VERSION
    let score = 0;
    examQuestions.forEach((question, index) => {
      // Check both the index-based key and the "temp-X" format
      const answerKey1 = index.toString();
      const answerKey2 = `temp-${index}`;

      // Try to get the answer using either format
      const userAnswer =
        answers[answerKey1] !== undefined
          ? answers[answerKey1]
          : answers[answerKey2] !== undefined
          ? answers[answerKey2]
          : undefined;

      if (
        userAnswer !== undefined &&
        Number(userAnswer) === Number(question.correctAnswer)
      ) {
        score++;
      }
    });

    // Record submission
    await pool.query(
      `UPDATE exam_attempts 
         SET end_time = NOW(), submitted_answers = ?
         WHERE id = ?`,
      [JSON.stringify(answers), attempt[0].id]
    );

    // Record result
    await pool.query(
      `INSERT INTO exam_results 
         (exam_id, student_id, score, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
      [examId, studentId, score]
    );

    res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      score,
      maxScore: examQuestions.length,
    });
  } catch (error) {
    console.error("Exam submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit exam",
    });
  }
};




