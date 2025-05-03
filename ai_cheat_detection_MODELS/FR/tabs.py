import psutil
import pygetwindow as gw
import win32gui


def get_window_titles():
    # Get all open windows' titles
    window_titles = []
    for window in gw.getWindowsWithTitle(""):
        window_titles.append(window.title)
    
    return window_titles



def get_chrome_window_titles():
    titles = []

    def enum_handler(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            class_name = win32gui.GetClassName(hwnd)
            if 'Chrome' in class_name and title:
                titles.append(title)

    win32gui.EnumWindows(enum_handler, None)
    return titles

# Get window titles (This will include Chrome tabs if they are open)
window_titles = get_window_titles()
print("\nOpen Window Titles:")
for title in window_titles:
    print(title)



# Print all open Chrome tab titles
titles = get_chrome_window_titles()
for i, title in enumerate(titles, 1):
    print(f"{i}. {title}")
