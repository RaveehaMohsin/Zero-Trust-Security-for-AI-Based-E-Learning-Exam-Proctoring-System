from fastapi import FastAPI
from fastapi.responses import JSONResponse
import pygetwindow as gw
import win32gui
from typing import List, Dict

app = FastAPI()

def get_window_titles() -> List[str]:
    """Get all open windows' titles using pygetwindow"""
    window_titles = []
    for window in gw.getWindowsWithTitle(""):
        window_titles.append(window.title)
    return window_titles

def get_chrome_window_titles() -> List[str]:
    """Get Chrome window titles using win32gui for more accurate detection"""
    titles = []

    def enum_handler(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            class_name = win32gui.GetClassName(hwnd)
            if 'Chrome' in class_name and title:
                titles.append(title)

    win32gui.EnumWindows(enum_handler, None)
    return titles

@app.get("/all-windows", response_model=List[str])
async def get_all_windows():
    """Get titles of all open windows"""
    try:
        return get_window_titles()
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error retrieving window titles: {str(e)}"}
        )

@app.get("/chrome-tabs", response_model=List[str])
async def get_chrome_tabs():
    """Get titles of all Chrome tabs/windows"""
    try:
        return get_chrome_window_titles()
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error retrieving Chrome tabs: {str(e)}"}
        )

@app.get("/chrome-tabs/enumerated")
async def get_chrome_tabs_enumerated():
    """Get Chrome tabs with numbering"""
    try:
        titles = get_chrome_window_titles()
        return {i+1: title for i, title in enumerate(titles)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error retrieving Chrome tabs: {str(e)}"}
        )

@app.get("/all-info")
async def get_all_info():
    """Get all available window information in one endpoint"""
    try:
        return {
            "all_windows": get_window_titles(),
            "chrome_tabs": get_chrome_window_titles(),
            "chrome_tabs_enumerated": {i+1: title for i, title in enumerate(get_chrome_window_titles())}
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Error retrieving window information: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)