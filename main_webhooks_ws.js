// Webhooks (incoming HTTP notifications) support for Fluidsync service

const http = require('http');
const admin = require('firebase-admin');
const FluidSyncClient = require('fluidsync_ws_client');

function onOpen(fluidsync)
{
    fluidsyncSocketId = fluidsync.id;
    //console.log('connected to FluidSync');
}

function onClose(fluidsync, code, reason)
{
    fluidsyncSocketId = undefined;
    //console.log('disconnected from FluidSync');            
}

function onError(fluidsync)
{
    //console.log('error ['  + fluidsync.id + ']');
}

function onMessage(fluidsync, message)
{
    //console.log('message on ['  + fluidsync.id + ']');
    //console.log(message);     
}

/*
function onPong(fluidsync)
{
    console.log('pong on ['  + fluidsync.id + ']');                
}
*/

    // FluidSync host
    // to do use config or commandline arg... but, honestly, if where are other FluidSync providers?
const fluidsync = new FluidSyncClient({
    serverUrl: 'wss://fluidsync2.herokuapp.com',
    onOpen: onOpen,
    onClose: onClose,
    onError: onError,
    onMessage: onMessage/*,
    onPong: onPong*/
});
            
var fluidsyncSocketId;

//-----------------------------

const answerWH = 'WHOK';
const answerFCM = 'FCMOK';
const answerGen = 'OK';

//-----------------------------

const httpServer = http.createServer((req, res) => {

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');      

    if(method === 'GET')    
    {
        pushToFluidSync(req);
        
        res.end(answerWH);
    }
    else if(method === 'POST')
    {
        let body = '';

        req.setEncoding('utf8');

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {

            //console.log(body);

            pushToFCM(body);

            res.end(answerFCM);
        });
    }  
    else
    {
        res.end(answerGen);
    }  
});

//-----------------------------

function pushToFluidSync(req)
{
    let incomingUrl = req.url;

    //console.log(incomingUrl);

    if(fluidsyncSocketId && (incomingUrl !== '/'))
    {
        // extract path (substring between '/' and '?')
        // it is channel to publish into

        let indexOfQuestion = incomingUrl.indexOf('?');

        if(indexOfQuestion > 0)
        {
            let channel = incomingUrl.substring(1, indexOfQuestion);

            if(channel.length > 0)
            {       
                fluidsync.publish({
                    channel: channel, 
                    from: 'webhook', 
                    payload: {method: req.method, url: incomingUrl, headers: req.headers}
                });            
            }
        }
    }
}

//-----------------------------

function pushToFCM(body)
{
    try
    {
        const data = JSON.parse(body);

        if(data)
        {
            let token = data.token;

            if((typeof token === 'string') && (token.length > 0))
            {
                admin.messaging().sendToDevice(token, {data: data.payload})
                .then(response => {
                    //console.log(response);
                })
                .catch(err => {
                    //console.log(err);
                });
            }                    
        }
    }
    catch(e)
    {}
}

//-----------------------------

const PERIOD = 15 * 60 * 1000;

const pingTarget = 'fluidbridge.herokuapp.com';
const pingOptions = { hostname: pingTarget };

setInterval(() => {
    const pingRequest = http.request(pingOptions);    
    pingRequest.end();
}, PERIOD);

//-----------------------------

const serviceAccount = 
{
    "type": "service_account",
    "project_id": "fluidsync-8f7e4",
    "private_key_id": "0a4396c204bf1f42c8329363ad9486b2916a161f",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDADGqSJtfMTYjC\nQQ8qYupDk5oT1zV2cN+47QbaqlGpTU8p6DJcBBuDb0IYc+BHEusF0ONfUtbGbYTh\nEPh0CFerosu579Say2EM0bmjTaIOM66RmxIB2RFVbIQCOX8aKFgDx+Xx2KJKzN8m\nqrm96YwIiOM2CYGmsQmOaOpOSCiU4coURTP+t6jJSsCZrpYcDw9CTPR2XMpMtS9N\nE764l6MmYyg0NfHpu4Cal7I/uMgUY+1wSYBGw62HjLotIWBkvL2gwrjLI3mkWAcW\nXU2Ke/duPOVyVv88py947XYKAMfQx7VUBRVQ83CPg/psiz4TN2X9tZrCwQXfqOL0\nQr2US+wjAgMBAAECggEAGs6g4Z3CaaY4/MSQFV6RTLWBwFs9/zZqRCnx1vwHQhak\ngjkDLoz0OjiBhWBHYiRl4f3yfw/VIwWOkswHokq30iF7Ro0PpDvXZC6yNvVTNaBJ\nMdHvhYqDPOVU1+qmr0QKZRy2IDgZD0/hpkgWfUfoYBibfqN9EYOMzfAfJKY14/IS\nfWi+fuk3gKa414SNGYohVR8yv1tNU2A4nEh88VS89r8zNgXP5dsAdwrve9EZ3lKi\nqqo+/8C2bj41149AG2Uf0mE/SUdLdMbOa3V+p+x+tGpLo+Q9MS/NQAqwGnTcJYl5\nsDoQBhIMIhNQt1L0xDbO1zi1+oOBj9DBTTCS7r3jwQKBgQDrB4C1+D8J17k1HTP/\n9jD7v5uWp3mOacgdwv4+lUEFh8wN2ZMSqVGQ1tlnxohOC0MV5r+KLyeIb9AdVv2F\n00ZV1/okebLa31wH62rn3W/SzQFGFdcISKxpNAtfeXXxVs//SqNQFu4xiNEL5qXY\nBGYPnMxNqnGKFaceUKcr9r5RKwKBgQDRLydV2XsEFRotns32WvJ69hXHEcTEmTpq\n2d1GGo9qXeLUW/Npuh7DC2ZZggQaO9JYrRv+GIN1KCxvc9Qp+C+u4NHveeOPGKZj\nLRN4qmJ8I5yO9RLLtJhs8px1kS/fQJxHuyUX8cNdlN/aMEX/b1HBcgzdEVQuy58C\nJmjbn/4k6QKBgQCkvkOYSgRV7+KgunGir30yWeLDvWzVSIy/X9k7IP/M0p1T7/jJ\nkencrt0BgwY0Pmytw2rrf5YkasvkZP+ceLXKonNycePOy9YErx3mnS8vAggsik6K\nPfasX5DBQbBMlN+DQVwsXYZlLlPqFaiWPK8VroD+x8SCWB8mfr5PcMuCtQKBgQCn\n9IBUwcWvxXG7Z2Jfhy5h4+wgZffjElSBLmQnwXOdJ7zUXO/X2ASS/jgzbdz1Y0rE\nwFlVb0E9dAAZjJqxCADhHMnyyZ8YaeZOgwa7P7LLkZxGfCeXP22TLEjLbMNPMYVJ\nYs2pqAgAv2PswA2zxiGSfIwvg5Zf7EXDaCuRC6j24QKBgQCuRXgm1a+pTDbXM+gO\nxsuROqroBqEyBN6nm6E8fEJ2y71I6NQHqaFRT/9hPeg6L4ju7JkhcsSM9OA64hJi\nvtUJMgI5st6FaY1NHwoT2scUZ/gbE2/qarj4u20s2M48RnQcCEVlWK75hRgal6ju\nfkUPk/+5v3shh16x4nl8GBMfXQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-4c48v@fluidsync-8f7e4.iam.gserviceaccount.com",
    "client_id": "117348076685795189014",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4c48v%40fluidsync-8f7e4.iam.gserviceaccount.com"      
};

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

//-----------------------------

httpServer.listen(process.env.PORT, () => {
    console.log('Webhooks connector running...');  
});
