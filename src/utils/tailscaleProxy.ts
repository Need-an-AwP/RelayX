export default async function sendViaTailscale(targetHost: string, message: any, timeout = 5000): Promise<Response> {
    if (!targetHost) {
        throw new Error('targetHost is required');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        return fetch(`http://127.0.0.1:8849/?target=${targetHost}:8848/RTC`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message),
            signal: controller.signal
        })
            .then(res => {
                clearTimeout(timeoutId);
                if (res.ok) {
                    return res;
                }
                throw res;
            })
            .catch(err => {
                clearTimeout(timeoutId);
                throw err;
            })
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}