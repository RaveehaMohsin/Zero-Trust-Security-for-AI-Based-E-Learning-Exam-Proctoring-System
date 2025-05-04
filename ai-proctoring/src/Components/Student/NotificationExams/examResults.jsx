import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './examresult.css';

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
        
        // Fetch exam details and results
        const [examRes, resultRes] = await Promise.all([
          axios.get(`${API_URL}/exams/${examId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${API_URL}/exams/${examId}/results`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        ]);

        setExamDetails(examRes.data.exam);
        setResultDetails(resultRes.data.result);
        setQuestions(resultRes.data.questions || []);
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
    navigate('/exams');
  };

  if (loading) {
    return (
      <div className="results-loading">
        <div className="spinner"></div>
        <p>Loading exam results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <p>{error}</p>
        <button onClick={handleBackToExams} className="back-button">
          Back to Exams
        </button>
      </div>
    );
  }

  if (!examDetails || !resultDetails) {
    return (
      <div className="results-error">
        <p>No exam results found</p>
        <button onClick={handleBackToExams} className="back-button">
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="exam-results-container">
      <div className="results-header">
        <h1>Exam Results</h1>
        <button onClick={handleBackToExams} className="back-button">
          Back to Exams
        </button>
      </div>

      <div className="exam-summary">
        <h2>{examDetails.title}</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Course</h3>
            <p>{examDetails.course_title}</p>
          </div>
          <div className="summary-card">
            <h3>Date Taken</h3>
            <p>{new Date(examDetails.start_time).toLocaleDateString()}</p>
          </div>
          <div className="summary-card">
            <h3>Score</h3>
            <p className={`score ${calculatePercentage(resultDetails.score, questions.length) >= 70 ? 'pass' : 'fail'}`}>
              {resultDetails.score} / {questions.length}
            </p>
          </div>
          <div className="summary-card">
            <h3>Percentage</h3>
            <p className={`percentage ${calculatePercentage(resultDetails.score, questions.length) >= 70 ? 'pass' : 'fail'}`}>
              {calculatePercentage(resultDetails.score, questions.length)}%
            </p>
          </div>
        </div>
      </div>

      <div className="results-actions">
        <button 
          onClick={() => setShowAnswers(!showAnswers)}
          className="toggle-answers-btn"
        >
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
      </div>

      {showAnswers && questions.length > 0 && (
        <div className="questions-review">
          <h3>Question Review</h3>
          {questions.map((question, index) => {
            const userAnswer = resultDetails.submitted_answers?.[question.id];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <motion.div 
                key={question.id || index}
                className={`question-card ${isCorrect ? 'correct' : 'incorrect'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span className={`question-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="question-text">{question.question}</p>
                
                <div className="options-container">
                  {question.options.map((option, optIndex) => {
                    let optionClass = '';
                    if (optIndex === question.correctAnswer) {
                      optionClass = 'correct-answer';
                    } else if (optIndex === userAnswer) {
                      optionClass = 'user-answer';
                    }
                    
                    return (
                      <div 
                        key={optIndex}
                        className={`option ${optionClass}`}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="option-text">{option}</span>
                        {optIndex === question.correctAnswer && (
                          <span className="correct-indicator">✓ Correct Answer</span>
                        )}
                        {optIndex === userAnswer && !isCorrect && (
                          <span className="incorrect-indicator">✗ Your Answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="results-footer">
        <p>Exam completed on: {new Date(resultDetails.created_at).toLocaleString()}</p>
        <p>Invigilator: {examDetails.invigilator_name}</p>
      </div>
    </div>
  );
};

export default ExamResults;