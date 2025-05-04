import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './Notifications.css';
import ExamInterface from './ExamInterface';
import { useNavigate } from 'react-router-dom';

const Notificationexams = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [completedExams, setCompletedExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const navigate = useNavigate();

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${API_URL}/courses/exams`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = response.data;
        setUpcomingExams(data.upcomingExams || []);
        console.log(data)
        
        const completedWithResults = data.completedExams;
        
        setCompletedExams(completedWithResults || []);
        setLoading(false);
      } catch (err) {
        if (err.response) {
          setError(err.response.data.message || "Failed to fetch exams");
        } else if (err.request) {
          setError("No response from server. Please check your connection.");
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleStartExam = (exam) => {
    navigate(`/exams/start/${exam.id}`);
  };

  const handleViewResults = (examId) => {
    navigate(`/exams/results/${examId}`);
  };

  const ExamCountdown = ({ examDate, onStart }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(examDate));

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(examDate));
      }, 1000);
      return () => clearInterval(timer);
    }, [examDate]);

    function calculateTimeLeft(date) {
      const difference = new Date(date) - new Date();
      if (difference <= 0) return {};

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    const hasEnded = Object.keys(timeLeft).length === 0;

    return (
      <div className="countdown">
        {hasEnded ? (
          <button className="start-exam-btn" onClick={onStart}>
            Start Exam
          </button>
        ) : (
          <div className="countdown-timer">
            <span>{timeLeft.days}d </span>
            <span>{timeLeft.hours}h </span>
            <span>{timeLeft.minutes}m </span>
            <span>{timeLeft.seconds}s</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Loading exams...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  if (examStarted && currentExam) {
    return <ExamInterface exam={currentExam} />;
  }

  return (
    <div className="notification-container">
      <h2>Upcoming Exams</h2>
      {upcomingExams.length === 0 ? (
        <p className="no-exams">No upcoming exams scheduled</p>
      ) : (
        <div className="exams-grid">
          {upcomingExams.map((exam) => (
            <motion.div
              key={exam.id}
              className="exam-card"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>{exam.course_title}</h3>
              <p className="exam-title">{exam.exam_title}</p>
              <div className="exam-details">
                <p><strong>Invigilator:</strong> {exam.invigilator_name}</p>
                <p><strong>Date:</strong> {new Date(exam.exam_date).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {exam.duration} minutes</p>
                <p><strong>Instructions:</strong> {exam.exam_description}</p>
              </div>
              <ExamCountdown
                examDate={exam.exam_date}
                onStart={() => handleStartExam(exam)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <h2>Completed Exams</h2>
      {completedExams.length === 0 ? (
        <p className="no-exams">No completed exams yet</p>
      ) : (
        <div className="exams-grid">
          {completedExams.map((exam) => (
            <motion.div
              key={exam.id}
              className="exam-card completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>{exam.course_title}</h3>
              <p className="exam-title">{exam.exam_title}</p>
              <div className="exam-details">
                <p><strong>Date:</strong> {new Date(exam.exam_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> Completed</p>
                {exam.result && (
                  <>
                    <p><strong>Score:</strong> {exam.result.score}</p>
                    <p><strong>Submitted At:</strong> {new Date(exam.result.created_at).toLocaleString()}</p>
                  </>
                )}
                <p><strong>Invigilator:</strong> {exam.invigilator_name}</p>
              </div>
              <button 
                className="view-results-btn"
                onClick={() => handleViewResults(exam.id)}
              >
                View Detailed Results
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notificationexams;