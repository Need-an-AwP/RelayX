export const installExtensions = async () => {
    try {
        // 使用动态导入，只在开发环境下导入 electron-devtools-installer
        const { installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
        
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((ext) => console.log(`Added Extension:  ${ext.name}`))
            .catch((err) => console.log('An error occurred: ', err));
    } catch (error) {
        console.log('Failed to import electron-devtools-installer:', error.message);
    }
}