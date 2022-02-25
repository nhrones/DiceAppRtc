
const DNA = {
    channelID: 0,   // channel-ID number - high-byte of id
    memberID: 0,    // member-ID  number - low-byte  of id
    id: 0 ,         // Uint32
    status: 0 ,     // high-word of context
    state: 0,       // low-word  of context
    context: 0,     // Uint32
}

const toBinary = (id:number, context: number) => {
    return Uint16Array.from([id >> 0, context >> 0])
}


DNA.channelID = 2
console.log(toBinary(DNA.id, DNA.context))