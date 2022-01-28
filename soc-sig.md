	Socket                                          Signalling
```
subscriptions = new Map<string, callbackFunc[]>()	subscriptions = new Map<string, callbackFunc[]>()

initialize()						                initialize(soc:Websocket)
	socket = new WebSocket(serverURL)			        socket = soc
	addEventListener('error'			                addEventListener('open' main.start()
	addEventListener('message' msg)			            addEventListener('message' msg)
	    if (topic in GameTopic) {				                if (topic in SignalTopic) {
            dispatch(topic, data)			                    dispatch(topic, data)
        }						                            }
                                                        socket.onclose = (ev: CloseEvent) => {}
                                                        socket.onerror = (e) => {}
}                                                   }

registerPlayer = (id: string, name: string)         postMessage = (message: SignallingMessage)

dispatch = (topic, data: string | object)           dispatch = (topic, data: string | object)
    callback(data)                                      callback(data)

when = (topic: string, listener: callbackFunc)      when = (topic: string, listener: callbackFunc)
    callbacks.push(listener)                            callbacks.push(listener)
    
const Topic =                                       const SignalTopic =



```