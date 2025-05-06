# import win32gui
# def get_chrome_window_titles():
#     titles = []

#     def enum_handler(hwnd, _):
#         if win32gui.IsWindowVisible(hwnd):
#             title = win32gui.GetWindowText(hwnd)
#             class_name = win32gui.GetClassName(hwnd)
#             if 'Chrome' in class_name and title:
#                 titles.append(title)

#     win32gui.EnumWindows(enum_handler, None)
#     return titles

# # Print all open Chrome tab titles
# titles = get_chrome_window_titles()
# for i, title in enumerate(titles, 1):
#     print(f"{i}. {title}")

import pygetwindow as gw

def get_browser_tab_titles():
    titles = []
    # Get all Chrome windows
    for window in gw.getWindowsWithTitle(''):
        if 'chrome' in window.title.lower() or 'edge' in window.title.lower():
            if window.title:  # Ignore empty titles
                titles.append(window.title)
    return titles

titles = get_browser_tab_titles()
for i, title in enumerate(titles, 1):
    print(f"{i}. {title}")