import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamInterface.css";

const API_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const startExam = async () => {
      try {
        const response = await api.get(`/examgeneration/start/${examId}`);
        console.log("API Response:", response.data.questions); // Debug log
        const questionsWithIds = response.data.questions.map((q, index) => ({
            ...q,
            id: q.id || `temp-${index}` // Use existing ID or create a temporary one
          }));


        setExam(response.data.exam);
        setQuestions(questionsWithIds);

        // Initialize answers as an empty object
        setAnswers({});

        // Calculate time left
        const endTime = new Date(response.data.exam.end_time);
        const now = new Date();
        setTimeLeft(Math.max(0, Math.floor((endTime - now) / (1000 * 60))));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to start exam");
      }
    };

    startExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/examgeneration/submit/${examId}`, { answers });
      navigate("/student", { state: { autoSubmitted: true } });
    } catch (err) {
      setError("Failed to auto-submit exam");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit your exam?"
    );
    if (!confirmSubmit) return;

    setIsSubmitting(true);
    try {
      await api.post(`/examgeneration/submit/${examId}`, { answers });
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit exam");
      setIsSubmitting(false);
    }
  };

  if (!exam) {
    return (
      <div className="exam-loading">
        {error ? (
          <p className="error-message">{error}</p>
        ) : (
          <p>Loading exam...</p>
        )}
      </div>
    );
  }

  return (
    <div className="exam-container">
      <header className="exam-header">
        <h1>{exam.title}</h1>
        <div className="exam-meta">
          <span className="time-remaining">
            Time Remaining: {Math.floor(timeLeft / 60)}h {timeLeft % 60}m
          </span>
          <span className="course-name">{exam.course_title}</span>
        </div>
      </header>

      <div className="exam-content">
        <div className="exam-description">
          <p>{exam.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="exam-questions">
          {questions.map((question, qIndex) => (
            <div key={question.id || qIndex} className="question-card">
              <div className="question-header">
                <span className="question-number">Question {qIndex + 1}</span>
                <span className="question-status">
                  {answers[question.id] !== undefined
                    ? "Answered"
                    : "Unanswered"}
                </span>
              </div>
              <p className="question-text">{question.question}</p>

              <div className="options-container">
                {question.options.map((option, oIndex) => (
                  <div
                    key={oIndex}
                    className={`option ${
                      answers[question.id] === oIndex ? "selected" : ""
                    }`}
                    onClick={() => handleAnswerSelect(question.id, oIndex)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + oIndex)}.
                    </span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {error && <p className="error-message">{error}</p>}

          <div className="exam-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamInterface;
