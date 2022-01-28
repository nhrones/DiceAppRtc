## now ...
App-Start -> request WebSocket-connection from signalling-server  ------------> +
                                                                                |
                          <----- client-socket.send(WS.topic.SetID, id) <------ +

app.ts -> WS.when(WS.topic.SetID, id)
        prompt name -> set thisPlayer.name + thisPlayer.id
        WS.register(data.id, name) -> signalling-server -> addsPlayer(id,name)  +
                                                                                | 
                                 BroadcastAll("UpdatePlayers", players[] <----- +       
players.ts -> WS.when(WS.topic.UpdatePlayers,(players[] ... ) 
        // updates localPlayers[]

## Change to ... 
1. move the servers -> player.addPlay() to clients players.ts
2. Only 'focused-player' manages new players, and broadcasts players[] to all
3. Server will BroadcastAll the id of a closed connection
4. If focused-player has closed, player with lowestIndex to take the focus
5. The focused player removes exiting-player, and broadcasts players[] to all

## Server.players.addPlayer() 
```js
addPlayer(id: string, playerName: string) {
        this.players.set(id,
            {
                id: id,
                idx: this.players.size,
                playerName: playerName,
                color: playerColors[this.players.size]
            },
        )
        broadcastAll( "UpdatePlayers", Array.from(this.players.values()))
        return playerName
    }
```