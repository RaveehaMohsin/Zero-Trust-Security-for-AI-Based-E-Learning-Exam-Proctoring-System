import dlib
import cv2
import math
import numpy as np

# Initialize dlib's face detector and facial landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Use the webcam
cap = cv2.VideoCapture(0)

# Thresholds
MOVEMENT_THRESHOLD = 25
EYE_MOVEMENT_LIMIT = 100  # Increased from 200 to 300
FACE_MOVEMENT_LIMIT = 20  # Increased from 10 to 20

# Tracking variables
previous_position = None
movement_count = 0
face_direction = None
EYE_MOVEMENT_COUNT = 0

# For gaze detection
left_eye_points = [36, 37, 38, 39, 40, 41]
right_eye_points = [42, 43, 44, 45, 46, 47]

def eye_contour_to_points(eye_landmarks):
    return np.array([(pt[0], pt[1]) for pt in eye_landmarks], dtype=np.int32)


def detect_gaze(eye_landmarks, frame):
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

            # Determine horizontal and vertical gaze direction
            gaze_horizontal = "Left" if horizontal_ratio > 0.6 else "Right" if horizontal_ratio < 0.4 else "Center"
            gaze_vertical = "Down" if vertical_ratio > 0.65 else "Up" if vertical_ratio < 0.35 else "Center"

            if gaze_vertical != "Center":
                return gaze_vertical
            else:
                return gaze_horizontal

    return "Unknown"

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)
    face_count = len(faces)

    # Detect multiple people
    if face_count >= 2:
        cv2.putText(frame, "Alert: Multiple people detected!", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        print("CHEATING - Multiple faces detected!")
        cv2.imshow("Strict Face and Eye Tracking", frame)
        cv2.waitKey(3000)  # Pause to show the alert
        break

    if face_count > 0:
        face = faces[0]
        x, y, w, h = face.left(), face.top(), face.width(), face.height()

        # # Blur the face region
        # face_region = frame[y:y+h, x:x+w]
        # face_region = cv2.GaussianBlur(face_region, (99, 99), 30)
        # frame[y:y+h, x:x+w] = face_region

        face_center = (x + w // 2, y + h // 2)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

        # Facial landmarks
        landmarks = predictor(gray, face)
        landmarks = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(68)]
        left_eye = [landmarks[i] for i in left_eye_points]
        right_eye = [landmarks[i] for i in right_eye_points]

        # Detect gaze direction
        left_gaze = detect_gaze(left_eye, frame)
        right_gaze = detect_gaze(right_eye, frame)

        if left_gaze != "Unknown" and right_gaze != "Unknown":
            if left_gaze == "Center" and right_gaze == "Center" or  left_gaze == "Center" and right_gaze == "Left" or left_gaze == "Right" and right_gaze == "Center":       
              pass  # Normal behavior; do not count
            elif left_gaze != right_gaze:
                EYE_MOVEMENT_COUNT += 1
                print(f"Eye Movement {EYE_MOVEMENT_COUNT}: {left_gaze}/{right_gaze}")
                if EYE_MOVEMENT_COUNT > EYE_MOVEMENT_LIMIT:
                    print("CHEATING - Excessive eye movement detected")
                    break


        # Face movement detection
        if previous_position:
            dx = face_center[0] - previous_position[0]
            dy = face_center[1] - previous_position[1]
            distance = math.hypot(dx, dy)

            if distance > MOVEMENT_THRESHOLD:
                angle = math.degrees(math.atan2(dy, dx))
                if -22.5 <= angle < 22.5:
                    face_direction = "Right"
                elif 22.5 <= angle < 67.5:
                    face_direction = "Up-Right"
                elif 67.5 <= angle < 112.5:
                    face_direction = "Up"
                elif 112.5 <= angle < 157.5:
                    face_direction = "Up-Left"
                elif 157.5 <= angle <= 180 or -180 <= angle < -157.5:
                    face_direction = "Left"
                elif -157.5 <= angle < -112.5:
                    face_direction = "Down-Left"
                elif -112.5 <= angle < -67.5:
                    face_direction = "Down"
                elif -67.5 <= angle < -22.5:
                    face_direction = "Down-Right"

                print(f"Face Movement {movement_count + 1}: {face_direction}")
                movement_count += 1

                if movement_count > FACE_MOVEMENT_LIMIT:
                    print("CHEATING - Excessive face movement detected")
                    break

        previous_position = face_center

        # Draw eye contours
        cv2.polylines(frame, [eye_contour_to_points(left_eye)], True, (0, 255, 0), 1)
        cv2.polylines(frame, [eye_contour_to_points(right_eye)], True, (0, 255, 0), 1)

    # Display counters
    cv2.putText(frame, f"Eye Movements: {EYE_MOVEMENT_COUNT}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(frame, f"Face Movements: {movement_count}", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    # Show the frame
    cv2.imshow("Strict Face and Eye Tracking", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
