

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { decrypt } from "../../../utils/crypto";
import Swal from "sweetalert2";
import "./ExamInterface.css";

const API_URL = "http://localhost:5000/api";

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState("");

  // Get device fingerprint
  const getDeviceFingerprint = () => {
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${userAgent}|${screenResolution}|${timezone}`;
  };

  // Create axios instance with interceptors
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Device-Fingerprint": getDeviceFingerprint()
    }
  });

  // Add response interceptor to handle 403 errors
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 403 && 
          error.response?.data?.requiresSecurityQuestion) {
        setShowSecurityModal(true);
      }
      return Promise.reject(error);
    }
  );

  const decryptQuestions = (encryptedData) => {
    try {
      console.log("Encrypted data received:", encryptedData);
      
      // Ensure encryptedData has the expected structure
      if (!encryptedData?.iv || !encryptedData?.encryptedData) {
        throw new Error("Invalid encrypted data format");
      }
      
      const decrypted = decrypt(encryptedData);
      console.log("Decrypted content:", decrypted);
      
      const parsed = JSON.parse(decrypted);
      console.log("Parsed questions:", parsed);
      
      return parsed;
    } catch (error) {
      console.error("Decryption failed:", error);
      setError("Failed to load exam questions. Please try again.");
      return [];
    }
  };

  const startExam = async () => {
    try {
      const response = await api.get(`/examgeneration/start/${examId}`);
      
      const decryptedQuestions = decryptQuestions(response.data.questions);
      console.log(decryptQuestions)
      const questionsWithIds = decryptedQuestions.map((q, index) => ({
        ...q,
        id: q.id || `temp-${index}`
      }));

      setExam(response.data.exam);
      setQuestions(questionsWithIds);
      
      const endTime = new Date(response.data.exam.end_time);
      const now = new Date();
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / (1000 * 60))));
    } catch (err) {
      if (err.response?.status !== 403) { // Don't show error for 403 (handled by interceptor)
        setError(err.response?.data?.message || "Failed to start exam");
      }
    }
  };

  const handleSecurityAnswer = async () => {
    try {
      const response = await api.post("/auth/verify-security", {
        securityAnswer
      });

      if (response.data.success) {
        await Swal.fire("Success", "Device verified successfully!", "success");
        setShowSecurityModal(false);
        setSecurityAnswer("");
      } else {
        throw new Error(response.data.message || "Verification failed");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  useEffect(() => {
    startExam();
  }, [examId]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
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

  if (showSecurityModal) {
    return (
      <div className="security-modal-overlay-verify">
        <div className="security-modal-container-verify">
          <div className="security-modal-header-verify">
            <h3 className="security-modal-title-verify">Device Verification Required</h3>
          </div>
          <div className="security-modal-body-verify">
            <p className="security-modal-text-verify">For your security, please verify your identity</p>
            <div className="security-question-container-verify">
              <p className="security-question-verify">What is your password?</p>
            </div>
            <input
              type="password"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Enter your password"
              className="security-input-field-verify"
            />
          </div>
          <div className="security-modal-footer-verify">
            <button 
              onClick={handleSecurityAnswer}
              className="security-verify-button-verify"
              disabled={!securityAnswer.trim()}
            >
              <span className="button-text-verify">Verify Device</span>
              <span className="button-icon-verify">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="exam-interface-loading">
        {error ? (
          <p className="exam-interface-error-message">{error}</p>
        ) : (
          <p>Loading exam...</p>
        )}
      </div>
    );
  }

  return (
    <div className="exam-interface-container">
      <header className="exam-interface-header">
        <h1>{exam.title}</h1>
        <div className="exam-interface-meta">
          <span className="exam-interface-time-remaining">
            Time Remaining: {Math.floor(timeLeft / 60)}h {timeLeft % 60}m
          </span>
          <span className="exam-interface-course-name">{exam.course_title}</span>
        </div>
      </header>

      <div className="exam-interface-content">
        <div className="exam-interface-description">
          <p>{exam.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="exam-questions">
          {questions.map((question, qIndex) => (
            <div key={question.id || qIndex} className="exam-interface-question-card">
              <div className="exam-interface-question-header">
                <span className="exam-interface-question-number">Question {qIndex + 1}</span>
                <span className="exam-interface-question-status">
                  {answers[question.id] !== undefined
                    ? "Answered"
                    : "Unanswered"}
                </span>
              </div>
              <p className="exam-interface-question-text">{question.question}</p>

              <div className="exam-interface-options-container">
                {question.options.map((option, oIndex) => (
                  <div
                    key={oIndex}
                    className={`exam-interface-option ${
                      answers[question.id] === oIndex ? "selected" : ""
                    }`}
                    onClick={() => handleAnswerSelect(question.id, oIndex)}
                  >
                    <span className="exam-interface-option-letter">
                      {String.fromCharCode(65 + oIndex)}.
                    </span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {error && <p className="exam-interface-error-message">{error}</p>}

          <div className="exam-interface-actions">
            <button
              type="submit"
              className="exam-interface-submit-btn"
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