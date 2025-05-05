import win32gui
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

# Print all open Chrome tab titles
titles = get_chrome_window_titles()
for i, title in enumerate(titles, 1):
    print(f"{i}. {title}")
