// Webhooks (incoming HTTP notifications) support for Fluidsync service

const http = require('http');

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

const httpServer = http.createServer((req, res) => {

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');  
    res.end('WHOK');

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
});

//-----------------------------

const PERIOD = 15 * 60 * 1000;

const pingTarget = 'fluidbridge.herokuapp.com';
const pingOptions = { hostname: pingTarget };

setInterval(() => {
    const pingRequest = http.request(pingOptions);    
    pingRequest.end();
}, PERIOD);

//-----------------------------

httpServer.listen(process.env.PORT, () => {
    console.log('Webhooks connector running...');  
});
