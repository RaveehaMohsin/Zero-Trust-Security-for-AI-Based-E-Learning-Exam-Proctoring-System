from fastapi import FastAPI
import uvicorn
import pygetwindow as gw
import win32gui

app = FastAPI()

def get_all_window_titles():
    return [w.title for w in gw.getWindowsWithTitle("") if w.title]

def get_all_chrome_titles():
    titles = []
    def enum_handler(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            class_name = win32gui.GetClassName(hwnd)
            if "Chrome" in class_name and title:
                titles.append(title)
    win32gui.EnumWindows(enum_handler, None)
    return titles

@app.get("/check_chrome")
def check_face():
    chrome_titles = get_all_chrome_titles()
    allowed = "http://127.0.0.1:8000/check_face"
    for title in chrome_titles:
        if allowed not in title:
            return {"status": "Cheating through web pages!"}
    return {"status": "No cheating detected via Chrome tabs."}

@app.get("/check_tabs")
def check_tabs():
    window_titles = get_all_window_titles()
    allowed_keywords = ["Visual Studio Code", "check_face"]
    for title in window_titles:
        if not any(allowed in title for allowed in allowed_keywords):
            return {"status": "Cheating through tabs"}
    return {"status": "No cheating detected in window titles."}

if __name__ == "__main__":
    uvicorn.run("yourfilename:app", host="127.0.0.1", port=8000, reload=True)
