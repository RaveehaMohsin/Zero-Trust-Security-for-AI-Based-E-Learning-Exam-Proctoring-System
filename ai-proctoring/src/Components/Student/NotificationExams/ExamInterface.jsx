import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { decrypt } from "../../../utils/crypto";
import Swal from "sweetalert2";
import "./ExamInterface.css";

const API_URL = "http://localhost:5000/api";
const PROCTORING_URL = "http://localhost:8000/";

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSecurityModal, setShowSecurityModal] = useState(true);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [proctoringAlerts, setProctoringAlerts] = useState([]);
  const [proctoringTab, setProctoringTab] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false); // Add this line
  const wsRef = useRef(null);

  // Get device fingerprint
  const getDeviceFingerprint = () => {
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${userAgent}|${screenResolution}|${timezone}`;
  };

  // Create axios instance
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Device-Fingerprint": getDeviceFingerprint(),
    },
  });

  // Initialize WebSocket connection for alerts
  const initAlertWebSocket = () => {

    const ws = new WebSocket(    
      `ws://localhost:8000/ws/alerts/${examId}`
    );
    wsRef.current = ws;
    ws.onopen = () => {
      console.log("WebSocket connection established"); // Debug log
    };

    ws.onmessage = (event) => {
       console.log("WebSocket message received:", event.data); // Debug log
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);  // Debug log
      if (data.type === "alert") {
        setProctoringAlerts((prev) => [...prev, data.message]);

        if (
          data.message.includes("Excessive") ||
          data.message.includes("Multiple faces")
        ) {
          Swal.fire({
            title: "Exam Terminated",
            text: "Your exam has been terminated due to proctoring violations.",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => {
            handleSubmit(new Event("auto-submit"));
          });
        } else {
          Swal.fire({
            title: "Proctoring Alert",
            text: data.message,
            icon: "warning",
            confirmButtonText: "OK",
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Alert connection closed");
    };
  };

  // Open proctoring in new tab
  const openProctoringTab = () => {
    const tab = window.open(`${PROCTORING_URL}?examId=${examId}`, "_blank");
    if (tab) {
      setProctoringTab(tab);

      // Check if the tab is closed periodically
      const checkTab = setInterval(() => {
        if (tab.closed) {
          clearInterval(checkTab);
          Swal.fire({
            title: "Proctoring Disconnected",
            text: "The proctoring tab was closed. Your exam may be invalidated.",
            icon: "warning",
          });
        }
      }, 1000);
    } else {
      Swal.fire({
        title: "Popup Blocked",
        text: "Please allow popups for this site to enable proctoring.",
        icon: "error",
      });
    }
  };


  // Decrypt questions
  const decryptQuestions = (encryptedData) => {
    try {
      if (!encryptedData?.iv || !encryptedData?.encryptedData) {
        throw new Error("Invalid encrypted data format");
      }
      const decrypted = decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      setError("Failed to load exam questions. Please try again.");
      return [];
    }
  };

  // Start exam after verification
  const startExam = async () => {
    try {
      const response = await api.get(`/examgeneration/start/${examId}`);
      const decryptedQuestions = decryptQuestions(response.data.questions);

      setExam(response.data.exam);
      setQuestions(
        decryptedQuestions.map((q, index) => ({
          ...q,
          id: q.id || `temp-${index}`,
        }))
      );

      const endTime = new Date(response.data.exam.end_time);
      setTimeLeft(
        Math.max(0, Math.floor((endTime - new Date()) / (1000 * 60)))
      );

      // Start proctoring after questions are loaded
      openProctoringTab();
      initAlertWebSocket();
    } catch (err) {
      console.error("Exam start failed:", err);
      setError(err.response?.data?.message || "Failed to start exam");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle security answer
  const handleSecurityAnswer = async () => {
    try {
      const response = await api.post("/auth/verify-security", {
        securityAnswer,
      });

      if (response.data.success) {
        await Swal.fire("Success", "Device verified successfully!", "success");
        setShowSecurityModal(false);
        setSecurityAnswer("");
        await new Promise(resolve => setTimeout(resolve, 5500));
        await startExam();
      } else {
        throw new Error(response.data.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      Swal.fire("Error", err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Handle exam submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const confirmSubmit = await Swal.fire({
      title: "Submit Exam?",
      text: "Are you sure you want to submit your exam?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    });

    if (!confirmSubmit.isConfirmed) return;

    setIsSubmitting(true);
    try {
      await api.post(`/examgeneration/submit/${examId}`, { answers });
      if (proctoringTab) proctoringTab.close();
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit exam");
      setIsSubmitting(false);
    }
  };



  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (proctoringTab && !proctoringTab.closed) {
        proctoringTab.close();
      }
    };
  }, []);

  // Security modal
  if (showSecurityModal) {
    return (
      <div className="security-modal-overlay-verify">
        <div className="security-modal-container-verify">
          <div className="security-modal-header-verify">
            <h3 className="security-modal-title-verify">
              Device Verification Required
            </h3>
          </div>
          <div className="security-modal-body-verify">
            <p className="security-modal-text-verify">
              For your security, please verify your identity
            </p>
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
          <span className="exam-interface-course-name">
            {exam.course_title}
          </span>
        </div>
      </header>

      <div className="exam-interface-content">
        <div className="exam-interface-description">
          <p>{exam.description}</p>
        </div>

        {proctoringAlerts.length > 0 && (
          <div className="proctoring-alerts">
            <h4>Proctoring Alerts:</h4>
            <ul>
              {proctoringAlerts.map((alert, index) => (
                <li
                  key={index}
                  className={alert.includes("down") ? "down-alert" : "alert"}
                >
                  {alert}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={handleSubmit} className="exam-questions">
          {questions.map((question, qIndex) => (
            <div
              key={question.id || qIndex}
              className="exam-interface-question-card"
            >
              <div className="exam-interface-question-header">
                <span className="exam-interface-question-number">
                  Question {qIndex + 1}
                </span>
                <span className="exam-interface-question-status">
                  {answers[question.id] !== undefined
                    ? "Answered"
                    : "Unanswered"}
                </span>
              </div>
              <p className="exam-interface-question-text">
                {question.question}
              </p>

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
