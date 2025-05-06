import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './alert.css';


const InvigilatorAlert = () => {
  const [examData, setExamData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [movementData, setMovementData] = useState({
    eye_movements: 0,
    face_movements: 0
  });
  const wsRef = useRef(null);

  
  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem("token");


    // Create axios instance
    const api = axios.create({
        baseURL: API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
  // Fetch active exam and student data
  useEffect(() => {
    const fetchActiveExam = async () => {
      try {
        const response = await api.get('/examgeneration/alertinvigilator');
        const { exam, student } = response.data;
        setExamData(exam);
        setStudentData(student);
      } catch (error) {
        console.error("Failed to fetch exam data:", error);
      }
    };

    fetchActiveExam();
  }, []);

  // WebSocket connection for real-time alerts
  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/alerts');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Update movement counts
      setMovementData({
        eye_movements: data.eye_movements || 0,
        face_movements: data.face_movements || 0
      });

      // Generate alert message
      const alertMessage = generateAlertMessage(data);
      if (alertMessage) {
        setAlerts(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          message: alertMessage,
          ...data
        }, ...prev].slice(0, 20)); // Keep last 20 alerts
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const generateAlertMessage = (data) => {
    if (data.eye_movements > 10) {
      return "Excessive eye movements detected!";
    }
    if (data.face_movements > 5) {
      return "Excessive face movements detected!";
    }
    return null; // No alert for normal activity
  };

  return (
    <div className="alert-container">
      <h2>Live Proctoring Dashboard</h2>
      
      {examData && (
        <div className="exam-info">
          <h3>Exam: {examData.title}</h3>
          <p>Course: {examData.course}</p>
        </div>
      )}

      {studentData && (
        <div className="student-info">
          <h3>Student: {studentData.name}</h3>
          <div className="movement-data">
            <p>Eye Movements: {movementData.eye_movements}</p>
            <p>Face Movements: {movementData.face_movements}</p>
          </div>
        </div>
      )}

      <div className="alerts-section">
        <h3>Recent Alerts</h3>
        {alerts.length > 0 ? (
          <ul>
            {alerts.map((alert, index) => (
              <li key={index} className={alert.message.includes('Excessive') ? 'alert' : ''}>
                [{alert.timestamp}] {alert.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>No alerts detected</p>
        )}
      </div>
    </div>
  );
};

export default InvigilatorAlert;