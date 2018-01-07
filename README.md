# FluidBridge

## Introduction

**FluidBridge** is *webhook* bridge into [**FluidSync**](https://github.com/nowido/FluidsyncHerokuWS). It is Node.js project hosted on Heroku platform.

**FluidBridge** allows to dispatch web requests into **FluidSync** *publish* actions.

Common use case is to fire events in **FluidSync** area from any program having no access to **FluidSync** itself. We keep **FluidBridge** as simple and lightweight as possible, so *webhook listeners* should be present in **FluidSync** area, translating plain urls from web requests into more or less complex objects, and then re-publishing. 

## FluidBridge usage

**FluidBridge** supports `GET` requests with url in a form 
```
https://fluidbridge.herokuapp.com/<channel>?<anything>
```

where `<channel>` is an arbitrary string containing no `‘?’` symbols, and `<anything>` is an arbitrary string. However, ‘arbitrary’ means ‘valid within an url’.

For above request, **FluidBridge** emits **FluidSync** *publish* action:

```
// req is Node.js http.IncomingMessage instance, 
// so we transfer pretty much info about web request
// to <channel> listeners in FluidSync area

fluidsync.publish({
    channel: ‘<channel>’,
    from: ‘webhook’,
    payload: {
        method: req.method, 
        url: ‘/<channel>?<anything>’, 
        headers: req.headers
    }
});
```

At present, **FluidBridge** doesn’t support HTTP methods other than `GET`.

## FluidBridge service is dumb

**FluidBridge** always answers `WHOK`, even if it doesn’t emit *publish* action due to invalid request, or temporary **FluidSync** disconnect. **FluidBridge** supports no validation of request url content, except of non-zero `<channel>` length, and `‘?’` symbol presence. You have to implement your own protocol over this service. 
