export const setWindowBound = (windowOptions, store) => {
    const windowBounds = store.get('windowBounds');
    if (windowBounds.x !== undefined && windowBounds.y !== undefined) {
        windowOptions.x = windowBounds.x;
        windowOptions.y = windowBounds.y;
    }
    if (windowBounds.width !== undefined && windowBounds.height !== undefined) {
        windowOptions.width = windowBounds.width;
        windowOptions.height = windowBounds.height;
    }
}

export const saveWindowBound = (window, store) => {

}