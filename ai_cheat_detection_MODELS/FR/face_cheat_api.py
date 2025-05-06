from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import dlib
import cv2
import math
import numpy as np
import asyncio
import json
import time
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware  # Add this import at the top

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize dlib's face detector and facial landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Thresholds
MOVEMENT_THRESHOLD = 30
EYE_MOVEMENT_LIMIT = 150
FACE_MOVEMENT_LIMIT = 20
EYE_MOVEMENT_COOLDOWN = 1.0  # seconds between counting eye movements

# For gaze detection
left_eye_points = [36, 37, 38, 39, 40, 41]
right_eye_points = [42, 43, 44, 45, 46, 47]

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

manager = ConnectionManager()

def eye_contour_to_points(eye_landmarks):
    return np.array([(pt[0], pt[1]) for pt in eye_landmarks], dtype=np.int32)

def detect_gaze(eye_landmarks, frame, gray):
    eye_region = np.array(eye_landmarks, np.int32)
    height, width = frame.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    cv2.polylines(mask, [eye_region], True, 255, 2)
    cv2.fillPoly(mask, [eye_region], 255)
    eye = cv2.bitwise_and(gray, gray, mask=mask)

    min_x = np.min(eye_region[:, 0])
    max_x = np.max(eye_region[:, 0])
    min_y = np.min(eye_region[:, 1])
    max_y = np.max(eye_region[:, 1])
    gray_eye = eye[min_y:max_y, min_x:max_x]

    _, threshold = cv2.threshold(gray_eye, 70, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(threshold, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=lambda x: cv2.contourArea(x), reverse=True)

    for cnt in contours:
        (x, y, w, h) = cv2.boundingRect(cnt)
        M = cv2.moments(cnt)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"]) + min_x
            cy = int(M["m01"] / M["m00"]) + min_y
            cv2.circle(frame, (cx, cy), 2, (0, 0, 255), -1)

            left_corner = eye_landmarks[0][0]
            right_corner = eye_landmarks[3][0]
            top_corner = min(eye_landmarks, key=lambda point: point[1])[1]
            bottom_corner = max(eye_landmarks, key=lambda point: point[1])[1]

            horizontal_ratio = (cx - left_corner) / (right_corner - left_corner) if (right_corner - left_corner) != 0 else 0.5
            vertical_ratio = (cy - top_corner) / (bottom_corner - top_corner) if (bottom_corner - top_corner) != 0 else 0.5

            # More sensitive downward detection
            gaze_horizontal = "Left" if horizontal_ratio > 0.7 else "Right" if horizontal_ratio < 0.3 else "Center"
            gaze_vertical = "Down" if vertical_ratio > 0.6 else "Up" if vertical_ratio < 0.4 else "Center"

            # Prioritize downward gaze detection
            if gaze_vertical == "Down":
                return "Down"
            elif gaze_vertical != "Center":
                return gaze_vertical
            else:
                return gaze_horizontal

    return "Unknown"

async def process_video_stream(websocket: WebSocket, client_id: str):
    cap = cv2.VideoCapture(0)
    
    # Tracking variables
    previous_position = None
    movement_count = 0
    face_direction = None
    EYE_MOVEMENT_COUNT = 0
    LAST_EYE_MOVEMENT_TIME = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = detector(gray)
            face_count = len(faces)

            # Detect multiple people
            if face_count >= 2:
                alert_msg = {
                    "type": "alert",
                    "message": "Multiple faces detected!",
                    "eye_movements": EYE_MOVEMENT_COUNT,
                    "face_movements": movement_count
                }
                await manager.send_message(json.dumps(alert_msg), client_id)
                break

            if face_count > 0:
                face = faces[0]
                x, y, w, h = face.left(), face.top(), face.width(), face.height()
                face_center = (x + w // 2, y + h // 2)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                # Facial landmarks
                landmarks = predictor(gray, face)
                landmarks = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(68)]
                left_eye = [landmarks[i] for i in left_eye_points]
                right_eye = [landmarks[i] for i in right_eye_points]

                # Detect gaze direction
                left_gaze = detect_gaze(left_eye, frame, gray)
                right_gaze = detect_gaze(right_eye, frame, gray)

                current_time = time.time()
                if left_gaze != "Unknown" and right_gaze != "Unknown":
                    if current_time - LAST_EYE_MOVEMENT_TIME > EYE_MOVEMENT_COOLDOWN:
                        # Count downward gaze immediately and more severely
                        if left_gaze == "Down" or right_gaze == "Down":
                            EYE_MOVEMENT_COUNT += 1
                            LAST_EYE_MOVEMENT_TIME = current_time
                        # Other movement detection
                        elif (left_gaze == right_gaze) and (left_gaze != "Center"):
                            EYE_MOVEMENT_COUNT += 1
                            LAST_EYE_MOVEMENT_TIME = current_time
                        elif (left_gaze == "Left" and right_gaze == "Right") or \
                             (left_gaze == "Right" and right_gaze == "Left"):
                            EYE_MOVEMENT_COUNT += 1
                            LAST_EYE_MOVEMENT_TIME = current_time

                        if EYE_MOVEMENT_COUNT > EYE_MOVEMENT_LIMIT:
                            alert_msg = {
                                "type": "alert",
                                "message": "Excessive eye movement detected",
                                "eye_movements": EYE_MOVEMENT_COUNT,
                                "face_movements": movement_count
                            }
                            await manager.send_message(json.dumps(alert_msg), client_id)
                            break

                # Face movement detection remains the same
                if previous_position:
                    dx = face_center[0] - previous_position[0]
                    dy = face_center[1] - previous_position[1]
                    distance = math.hypot(dx, dy)

                    if distance > MOVEMENT_THRESHOLD:
                        movement_count += 1
                        if movement_count > FACE_MOVEMENT_LIMIT:
                            alert_msg = {
                                "type": "alert",
                                "message": "Excessive face movement detected",
                                "eye_movements": EYE_MOVEMENT_COUNT,
                                "face_movements": movement_count
                            }
                            await manager.send_message(json.dumps(alert_msg), client_id)
                            break

                previous_position = face_center

                # Draw eye contours
                cv2.polylines(frame, [eye_contour_to_points(left_eye)], True, (0, 255, 0), 1)
                cv2.polylines(frame, [eye_contour_to_points(right_eye)], True, (0, 255, 0), 1)

            # Send frame and metrics
            _, buffer = cv2.imencode('.jpg', frame)
            frame_data = buffer.tobytes()

            metrics = {
                "type": "metrics",
                "eye_movements": EYE_MOVEMENT_COUNT,
                "face_movements": movement_count,
                "frame": frame_data.hex()
            }
            await manager.send_message(json.dumps(metrics), client_id)

            await asyncio.sleep(0.1)

    except Exception as e:
        print(f"Error processing video: {e}")
    finally:
        cap.release()
        manager.disconnect(client_id)

@app.websocket("/ws/alerts/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        await process_video_stream(websocket, client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# # WebSocket endpoint with origin verification
# @app.websocket("/ws/alerts/{client_id}")
# async def websocket_endpoint(websocket: WebSocket, client_id: str):
#     # Verify origin - this is important for security
#     origin = websocket.headers.get("origin")
#     allowed_origins = ["http://localhost:5173", "http://127.0.0.1:3000"]
    
#     if origin not in allowed_origins:
#         await websocket.close(code=1008)  # Policy violation
#         return
    
#     await websocket.accept()
#     try:
#         while True:
#             # Keep connection alive
#             await asyncio.sleep(1)
#             await websocket.send_json({"type": "ping", "message": "keepalive"})
#     except WebSocketDisconnect:
#         print(f"Client {client_id} disconnected")
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#         await websocket.close(code=1011)  # Internal error

@app.get("/")
async def get():
    return HTMLResponse("""
    <html>
        <head>
            <title>Exam Proctoring System</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                #metrics { background: #f0f0f0; padding: 10px; margin-top: 10px; border-radius: 5px; }
                .alert { color: red; font-weight: bold; }
                .down-alert { color: darkred; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Exam Proctoring System</h1>
            <img id="video" width="640" height="480"/>
            <div id="metrics">
                <p>Eye Movements: <span id="eye-count">0</span></p>
                <p>Face Movements: <span id="face-count">0</span></p>
                <div id="alerts"></div>
            </div>
            <script>
                const ws = new WebSocket(`ws://${window.location.host}/ws/test_client`);
                const video = document.getElementById('video');
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    if (data.type === 'metrics') {
                        const byteArray = new Uint8Array(data.frame.match(/../g).map(h=>parseInt(h,16)));
                        const blob = new Blob([byteArray], {type: 'image/jpeg'});
                        const url = URL.createObjectURL(blob);
                        video.src = url;
                        
                        document.getElementById('eye-count').textContent = data.eye_movements;
                        document.getElementById('face-count').textContent = data.face_movements;
                    } else if (data.type === 'alert') {
                        const alertsDiv = document.getElementById('alerts');
                        const alertClass = data.message.includes('down') ? 'down-alert' : 'alert';
                        alertsDiv.innerHTML += `<p class="${alertClass}">ALERT: ${data.message}</p>`;
                    }
                };
            </script>
        </body>
    </html>
    """)



# uvicorn face_cheat_api:app --reload