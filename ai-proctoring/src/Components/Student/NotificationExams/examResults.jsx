import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./examresult.css";

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examDetails, setExamDetails] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        const token = localStorage.getItem("token");

        const [examRes, resultRes] = await Promise.all([
          axios.get(`${API_URL}/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/exams/${examId}/results`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setExamDetails(examRes.data.exam);
        setResultDetails(resultRes.data.result);

        // Replace the question processing code with this:
        const processedQuestions = resultRes.data.questions.map((q, index) => {
          // Use selectedAnswer if available, otherwise fall back to submitted_answers
          const userAnswer =
            q.selectedAnswer !== undefined
              ? q.selectedAnswer
              : resultRes.data.result.submitted_answers?.[`temp-${index}`];

          return {
            ...q,
            userAnswer: userAnswer,
            isCorrect: userAnswer === q.correctAnswer,
          };
        });

        setQuestions(processedQuestions);
        console.log(processedQuestions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching exam results:", err);
        setError(err.response?.data?.message || "Failed to load exam results");
        setLoading(false);
      }
    };

    fetchExamResults();
  }, [examId]);

  const calculatePercentage = (score, total) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const handleBackToExams = () => {
    navigate("/student");
  };

  if (loading) {
    return (
      <div className="exam-results-loading">
        <div className="exam-results-spinner"></div>
        <p>Loading exam results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-results-error">
        <p>{error}</p>
        <button
          onClick={handleBackToExams}
          className="exam-results-back-button"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  if (!examDetails || !resultDetails) {
    return (
      <div className="exam-results-error">
        <p>No exam results found</p>
        <button
          onClick={handleBackToExams}
          className="exam-results-back-button"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="exam-results-page-container">
      <div className="exam-results-header">
        <h1>Exam Results</h1>
        <button
          onClick={handleBackToExams}
          className="exam-results-back-button"
        >
          Back to Exams
        </button>
      </div>

      <div className="exam-results-summary">
        <h2>{examDetails.title}</h2>
        <div className="exam-results-summary-grid">
          <div className="exam-results-summary-card">
            <h3>Course</h3>
            <p>{examDetails.course_title}</p>
          </div>
          <div className="exam-results-summary-card">
            <h3>Date Taken</h3>
            <p>{new Date(examDetails.start_time).toLocaleDateString()}</p>
          </div>
          <div className="exam-results-summary-card">
            <h3>Score</h3>
            <p
              className={`exam-results-score ${
                calculatePercentage(resultDetails.score, questions.length) >= 70
                  ? "exam-results-pass"
                  : "exam-results-fail"
              }`}
            >
              {resultDetails.score} / {questions.length}
            </p>
          </div>
          <div className="exam-results-summary-card">
            <h3>Percentage</h3>
            <p
              className={`exam-results-percentage ${
                calculatePercentage(resultDetails.score, questions.length) >= 70
                  ? "exam-results-pass"
                  : "exam-results-fail"
              }`}
            >
              {calculatePercentage(resultDetails.score, questions.length)}%
            </p>
          </div>
        </div>
      </div>

      <div className="exam-results-actions">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="exam-results-toggle-answers-btn"
        >
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </button>
      </div>

      {showAnswers && questions.length > 0 && (
        <div className="exam-results-questions-review">
          <h3>Question Review</h3>
          {questions.map((question, index) => (
            <motion.div
              key={index}
              className={`exam-results-question-card ${
                question.isCorrect ? "correct" : "incorrect"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="exam-results-question-header">
                <span className="exam-results-question-number">
                  Question {index + 1}
                </span>
                <span
                  className={`exam-results-question-status ${
                    question.isCorrect ? "correct" : "incorrect"
                  }`}
                >
                  {question.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="exam-results-question-text">{question.question}</p>

              <div className="exam-results-options-container">
                {question.options.map((option, optIndex) => {
                  const isCorrectAnswer = optIndex === question.correctAnswer;
                  const isUserAnswer = optIndex === question.userAnswer;

                  return (
                    <div
                      key={optIndex}
                      className={`exam-results-option ${
                        isCorrectAnswer
                          ? "exam-results-correct-answer"
                          : isUserAnswer
                          ? "exam-results-user-answer"
                          : ""
                      }`}
                    >
                      <span className="exam-results-option-letter">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className="exam-results-option-text">{option}</span>
                      {isCorrectAnswer && (
                        <span className="exam-results-correct-indicator">
                          ✓ Correct Answer
                        </span>
                      )}
                      {isUserAnswer && !question.isCorrect && (
                        <span className="exam-results-incorrect-indicator">
                          ✗ Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="exam-results-footer">
        <p>
          Exam completed on:{" "}
          {new Date(resultDetails.created_at).toLocaleString()}
        </p>
        <p>Invigilator: {examDetails.invigilator_name}</p>
      </div>
    </div>
  );
};

export default ExamResults;
