import dlib
import cv2
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import threading
import concurrent.futures

# Initialize the FastAPI app
app = FastAPI()

# Initialize the dlib face detector
detector = dlib.get_frontal_face_detector()

# Define movement thresholds for left-right and up-down directions
movement_threshold_horizontal = 30  # Horizontal movement threshold (left/right)
movement_threshold_vertical = 50    # Vertical movement threshold (up/down)

# Variables for tracking face movement and direction
previous_position = None
movement_count = 0
face_direction = None
cap = cv2.VideoCapture(0)

# Function to check face movements
def face_detection():
    global movement_count, previous_position, face_direction
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Convert the frame to grayscale (dlib requires grayscale images)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces in the grayscale image
        faces = detector(gray)

        # Update the face count
        face_count = len(faces)

        # If more than 2 faces are detected, end the program and return "cheating 2 people"
        if face_count > 2:
            return "cheating 2 people"

        # If 2 or fewer faces are detected, proceed with movement detection
        if face_count > 0:
            # Track the first face detected
            face = faces[0]
            x, y, w, h = (face.left(), face.top(), face.width(), face.height())

            # Track the center of the face (use the center of the bounding box)
            face_center = (x + w // 2, y + h // 2)

            # If previous position exists, calculate the movement direction
            if previous_position:
                dx = face_center[0] - previous_position[0]
                dy = face_center[1] - previous_position[1]

                # Only register movement if it exceeds the respective movement thresholds
                if abs(dx) > movement_threshold_horizontal or abs(dy) > movement_threshold_vertical:
                    if abs(dx) > abs(dy):  # Horizontal movement (left or right)
                        if dx > 0:
                            face_direction = "Moving Right"
                        else:
                            face_direction = "Moving Left"
                    else:  # Vertical movement (up or down)
                        if dy > 0:
                            face_direction = "Moving Down"
                        else:
                            face_direction = "Moving Up"

                    # Print the direction if movement is detected
                    if face_direction:
                        print(face_direction)

                    # Count the number of direction movements
                    movement_count += 1
                    print(f"warning {movement_count}  face direction {face_direction}")
                    if movement_count > 5:
                        return "cheating"

            # Update previous position to the current face center
            previous_position = face_center

    return "Cheating - No faces detected"

# Create a FastAPI endpoint to trigger face detection
@app.get("/check_face")
def check_face():
    # Use a ThreadPoolExecutor to handle the face detection in a separate thread
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(face_detection)
        result = future.result()  # Get the result from the thread

    # Return the result as a JSON response
    return JSONResponse(content={"message": result})

# To run the app using uvicorn
# uvicorn app_name:app --reload
