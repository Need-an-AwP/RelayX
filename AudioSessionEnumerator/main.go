package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"syscall"
	"unsafe"

	"github.com/go-ole/go-ole"
	"github.com/moutend/go-wca/pkg/wca"
	"golang.org/x/sys/windows"
)

// --- Structs for final JSON output ---
type WindowAudioState struct {
	WindowTitle string `json:"windowTitle"`
	ProcessName string `json:"processName"`
	PID         uint32 `json:"pid"`
	IsAudible   bool   `json:"isAudible"`
}

// --- DLL Loading ---
var (
	psapi                       = syscall.NewLazyDLL("psapi.dll")
	procGetProcessImageFileName = psapi.NewProc("GetProcessImageFileNameW")

	user32                       = syscall.NewLazyDLL("user32.dll")
	procEnumWindows              = user32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	procIsWindowVisible          = user32.NewProc("IsWindowVisible")
	procGetWindowTextLength      = user32.NewProc("GetWindowTextLengthW")
	procGetWindowText            = user32.NewProc("GetWindowTextW")
)

// --- Main application logic ---

func main() {
	// 1. Get all PIDs that are currently playing audio.
	audiblePids, err := getAudiblePids()
	if err != nil {
		log.Fatalf("Could not get audible pids: %v", err)
	}

	// 2. Get the process tree for all running processes (child -> parent mapping).
	processTree, err := getProcessTree()
	if err != nil {
		log.Fatalf("Could not get process tree: %v", err)
	}

	// 3. Enumerate all windows and check them against the audible PIDs and process tree.
	results, err := findAudibleWindows(audiblePids, processTree)
	if err != nil {
		log.Fatalf("Could not find audible windows: %v", err)
	}

	// 4. Marshal and print the result.
	jsonData, err := json.Marshal(results)
	if err != nil {
		log.Fatalf("Failed to marshal data to JSON: %v", err)
	}
	fmt.Println(string(jsonData))
}

// --- Core Feature Functions ---

// getAudiblePids enumerates all audio sessions and returns a set of PIDs for audible, non-system processes.
func getAudiblePids() (map[uint32]struct{}, error) {
	err := ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED)
	if err != nil {
		return nil, fmt.Errorf("CoInitializeEx failed: %v", err)
	}
	defer ole.CoUninitialize()

	audiblePids := make(map[uint32]struct{})

	var enumerator *wca.IMMDeviceEnumerator
	err = wca.CoCreateInstance(wca.CLSID_MMDeviceEnumerator, 0, wca.CLSCTX_ALL, wca.IID_IMMDeviceEnumerator, &enumerator)
	if err != nil {
		return nil, err
	}
	defer enumerator.Release()

	var devices *wca.IMMDeviceCollection
	err = enumerator.EnumAudioEndpoints(wca.ERender, wca.DEVICE_STATE_ACTIVE, &devices)
	if err != nil {
		return nil, err
	}
	defer devices.Release()

	var deviceCount uint32
	err = devices.GetCount(&deviceCount)
	if err != nil {
		return nil, err
	}

	for i := uint32(0); i < deviceCount; i++ {
		var device *wca.IMMDevice
		if devices.Item(i, &device) != nil {
			continue
		}
		defer device.Release()

		var sessionManager2 *wca.IAudioSessionManager2
		if device.Activate(wca.IID_IAudioSessionManager2, wca.CLSCTX_ALL, nil, &sessionManager2) != nil {
			continue
		}
		defer sessionManager2.Release()

		var sessionEnumerator *wca.IAudioSessionEnumerator
		if sessionManager2.GetSessionEnumerator(&sessionEnumerator) != nil {
			continue
		}
		defer sessionEnumerator.Release()

		var sessionCount int
		if sessionEnumerator.GetCount(&sessionCount) != nil {
			continue
		}

		for j := 0; j < sessionCount; j++ {
			var sessionControl *wca.IAudioSessionControl
			if sessionEnumerator.GetSession(j, &sessionControl) != nil {
				continue
			}
			defer sessionControl.Release()

			iunknown, err := sessionControl.QueryInterface(wca.IID_IAudioSessionControl2)
			if err != nil {
				continue
			}
			sessionControl2 := (*wca.IAudioSessionControl2)(unsafe.Pointer(iunknown))
			defer sessionControl2.Release()

			if err := sessionControl2.IsSystemSoundsSession(); err == nil {
				continue
			}

			var pid uint32
			if sessionControl2.GetProcessId(&pid) == nil && pid != 0 {
				audiblePids[pid] = struct{}{}
			}
		}
	}
	return audiblePids, nil
}

// getProcessTree creates a map of all running processes, mapping each child PID to its parent PID.
func getProcessTree() (map[uint32]uint32, error) {
	snapshot, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil, err
	}
	defer windows.CloseHandle(snapshot)

	var procEntry windows.ProcessEntry32
	procEntry.Size = uint32(unsafe.Sizeof(procEntry))

	processTree := make(map[uint32]uint32)
	if err := windows.Process32First(snapshot, &procEntry); err != nil {
		return nil, err
	}

	for {
		processTree[procEntry.ProcessID] = procEntry.ParentProcessID
		if err := windows.Process32Next(snapshot, &procEntry); err != nil {
			break
		}
	}
	return processTree, nil
}

// Data structure to pass to the EnumWindows callback
type enumWindowsCallbackData struct {
	audiblePids     map[uint32]struct{}
	processTree     map[uint32]uint32
	processFamilies map[uint32]map[uint32]struct{} // Cache for process families
	results         *[]WindowAudioState
}

// getProcessFamily recursively finds all children of a given root PID.
func getProcessFamily(rootPid uint32, processTree map[uint32]uint32) map[uint32]struct{} {
	family := make(map[uint32]struct{})
	family[rootPid] = struct{}{}

	// Create a parent-to-children map for easier traversal.
	childrenMap := make(map[uint32][]uint32)
	for pid, parentPid := range processTree {
		childrenMap[parentPid] = append(childrenMap[parentPid], pid)
	}

	var findChildren func(pid uint32)
	findChildren = func(p uint32) {
		if children, ok := childrenMap[p]; ok {
			for _, childPid := range children {
				family[childPid] = struct{}{}
				findChildren(childPid)
			}
		}
	}

	findChildren(rootPid)
	return family
}

// findAudibleWindows enumerates windows and ties them to audio sessions.
func findAudibleWindows(audiblePids map[uint32]struct{}, processTree map[uint32]uint32) ([]WindowAudioState, error) {
	data := &enumWindowsCallbackData{
		audiblePids:     audiblePids,
		processTree:     processTree,
		processFamilies: make(map[uint32]map[uint32]struct{}),
		results:         &[]WindowAudioState{},
	}
	cb := syscall.NewCallback(enumWindowsProc)
	procEnumWindows.Call(cb, uintptr(unsafe.Pointer(data)))
	return *data.results, nil
}

// enumWindowsProc is the callback function for window enumeration.
func enumWindowsProc(hwnd syscall.Handle, lParam uintptr) uintptr {
	data := (*enumWindowsCallbackData)(unsafe.Pointer(lParam))

	isVisible, _, _ := procIsWindowVisible.Call(uintptr(hwnd))
	textLen, _, _ := procGetWindowTextLength.Call(uintptr(hwnd))
	if isVisible == 0 || textLen == 0 {
		return 1 // Continue enumeration
	}

	var windowPid uint32
	procGetWindowThreadProcessId.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&windowPid)))
	if windowPid == 0 {
		return 1 // Continue
	}

	// Find the root of the process tree for this window's PID.
	rootPid := windowPid
	for {
		parent, ok := data.processTree[rootPid]
		if !ok || parent == 0 {
			break
		}
		rootPid = parent
	}

	// Get the entire process family for this root, caching the result.
	family, exists := data.processFamilies[rootPid]
	if !exists {
		family = getProcessFamily(rootPid, data.processTree)
		data.processFamilies[rootPid] = family
	}

	// Check if any process in the family is audible.
	isAudible := false
	for pidInFamily := range family {
		if _, found := data.audiblePids[pidInFamily]; found {
			isAudible = true
			break
		}
	}

	// Get window title
	buffer := make([]uint16, textLen+1)
	procGetWindowText.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&buffer[0])), uintptr(textLen+1))
	windowTitle := windows.UTF16ToString(buffer)

	// Get process name
	processName, _ := getProcessNameByPid(windowPid)

	result := WindowAudioState{
		WindowTitle: windowTitle,
		ProcessName: processName,
		PID:         windowPid,
		IsAudible:   isAudible,
	}
	*data.results = append(*data.results, result)

	return 1 // Continue enumeration
}

// --- Low-level Helper Functions ---

func getProcessNameByPid(pid uint32) (string, error) {
	if pid == 0 {
		return "", fmt.Errorf("PID is zero")
	}
	handle, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if err != nil {
		return "", err
	}
	defer windows.CloseHandle(handle)

	var exePath [windows.MAX_PATH]uint16
	n, err := getProcessImageFileName(handle, &exePath[0], windows.MAX_PATH)
	if err != nil {
		return "", err
	}
	fullPath := windows.UTF16ToString(exePath[:n])
	if lastSlash := strings.LastIndex(fullPath, "\\"); lastSlash >= 0 {
		return fullPath[lastSlash+1:], nil
	}
	return fullPath, nil
}

func getProcessImageFileName(handle windows.Handle, path *uint16, size uint32) (uint32, error) {
	ret, _, err := procGetProcessImageFileName.Call(uintptr(handle), uintptr(unsafe.Pointer(path)), uintptr(size))
	if ret == 0 {
		return 0, err
	}
	return uint32(ret), nil
}
