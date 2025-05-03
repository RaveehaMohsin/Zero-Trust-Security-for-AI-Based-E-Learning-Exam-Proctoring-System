import dlib
import cv2

# Initialize the dlib face detector
detector = dlib.get_frontal_face_detector()

# Use the webcam (or a video file)
cap = cv2.VideoCapture(0)

# Variables for tracking face movement and direction
previous_position = None
movement_count = 0
face_direction = None

# Define movement thresholds for left-right and up-down directions
movement_threshold_horizontal = 30  # Horizontal movement threshold (left/right)
movement_threshold_vertical = 50    # Vertical movement threshold (up/down)

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

    # If more than 2 faces are detected, end the program and print "cheating 2 people"
    if face_count > 2:
        print("cheating 2 people")
        break

    # If 2 or fewer faces are detected, proceed with movement detection
    if face_count > 0:
        # Draw rectangles around the faces and analyze face movements for the first face
        face = faces[0]  # Track the first face detected
        x, y, w, h = (face.left(), face.top(), face.width(), face.height())
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

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
                    print(f"warning {movement_count}")
                    print("cheating")
                    cap.release()  # Stop video capture
                    cv2.destroyAllWindows()  # Close all OpenCV windows
                    break  # Exit the loop and end the program

        # Update previous position to the current face center
        previous_position = face_center

    # Display the frame with detected faces
    cv2.imshow("Face Detection", frame)

    # Exit the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam and close all OpenCV windows
cap.release()
cv2.destroyAllWindows()
