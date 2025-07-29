import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

export const installExtensions = () => {
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((ext) => console.log(`Added Extension:  ${ext.name}`))
        .catch((err) => console.log('An error occurred: ', err));
}