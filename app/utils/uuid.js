// generate a random uuid
function generateUUID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${timestamp}${random}`;
}

module.exports = generateUUID;
