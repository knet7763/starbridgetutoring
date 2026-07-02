import http from 'http';
import { AccessToken } from 'livekit-server-sdk';

const apiKey = 'APIPTFN2CDdqmNM';
const apiSecret = 'gKmh3BYWmr3YabzsGmj4KeGu3Pm3Q2qymc7wP904mcV';

const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/create-token') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { resourceId, participantName, participantId, roomName } = JSON.parse(body);
                if (!participantName || !participantId || !roomName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing required parameters' }));
                    return;
                }

                const at = new AccessToken(apiKey, apiSecret, {
                    identity: participantId,
                    name: participantName
                });

                at.addGrant({
                    room: roomName,
                    roomJoin: true,
                    canPublish: true,
                    canSubscribe: true
                });

                const token = at.toJwt();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ token, roomName }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(5174, () => {
    console.log('Local LiveKit token server running on port 5174');
});
