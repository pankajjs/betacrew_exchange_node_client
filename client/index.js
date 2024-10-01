const net = require("net");
const fs = require("fs");

const PORT = 3000;
const FILE_NAME = "orders.json";
const HOSTNAME = "localhost";
const CALL_TYPE = {
    "StreamAllPackets": 1,
    "ResendPacket": 2,
}
const PAYLOAD_SIZE = 2;
const ENCODING = {
    "ASCII":"ascii"
}
const INFO_LOG = {
    CONNECTION_MESSAGE: "Initiated connection to server at port",
    RECEIVED_MISSING_PACKET: "Received missing packet with sequence",
    CLOSE_CONNECTION: "Closed connection",
    FINISHED_WRITING_DATA: "Finished writing data",
}
const ERROR_LOG = {
    FAILED_CREATE_JSON_FILE: "Failed to create json file. Try again",
}

const orders = []
let isClosedConnection = false;
let missingOrdersSequence = [];

const createBinaryPayload = (size, callType, resendSeq = null) => {
    let payload;
    let offset = 0;
    try{
        payload = Buffer.alloc(size);
    }catch(err){
        console.error(`Error: ${err.message}`);
        return;
    }

    payload.writeUint8(callType, offset);
    if (callType === CALL_TYPE.ResendPacket && resendSeq != null){
        payload.writeUInt8(resendSeq, offset + 1);
    }

    return payload;
}

const getMissingOrdersSequence = (orders) => {
    const missingOrdersSequence = [];
    const sequences = orders.map(o=>o.packetSequence);
    const lowSequence = Math.min(...sequences);
    const highSequence = Math.max(...sequences);

    for(let sequence = lowSequence; sequence <= highSequence; sequence++){
        if(sequences.includes(sequence)) continue;
        missingOrdersSequence.push(sequence);
    }

    return missingOrdersSequence;
}

function getAllOrders(callType, resendSequence = null){
    const client = net.createConnection({
        port: PORT,
        hostname: HOSTNAME,
    }, () => {
        console.info(`${INFO_LOG.CONNECTION_MESSAGE}: ${PORT}`);
        const payload = createBinaryPayload(PAYLOAD_SIZE, callType, resendSequence)
        if (!payload) {
            isClosedConnection = true;
            client.end();
            return;
        }
        client.write(payload);
    })

    client.on("data", (data)=>{
        let offset = 0;
        while(offset < data.length) {
            const symbol = data.toString(ENCODING.ASCII, offset, offset + 4);
            offset += 4;
            const buySellIndicator = data.toString(ENCODING.ASCII, offset, offset + 1);
            offset += 1;
            const quantity = data.readInt32BE(offset);
            offset += 4;
            const price = data.readInt32BE(offset);
            offset += 4;
            const packetSequence = data.readInt32BE(offset);
            offset += 4 ;
            // console.log({
            //     symbol, buySellIndicator, quantity, price, packetSequence
            // });
            orders.push({
                symbol, buySellIndicator, quantity, price, packetSequence
            })
        }

        if (callType === CALL_TYPE.ResendPacket) {
            console.info(`${INFO_LOG.RECEIVED_MISSING_PACKET}: ${resendSequence}`);
            client.end();
        }
    })

    client.on("end", () => {
        if (isClosedConnection){
            console.info(`${INFO_LOG.CLOSE_CONNECTION}`);
            return;
        }

        console.info(`${INFO_LOG.FINISHED_WRITING_DATA}`)
        if(callType === CALL_TYPE.StreamAllPackets){
            missingOrdersSequence = getMissingOrdersSequence(orders);

            if (missingOrdersSequence.length > 0){
                getAllOrders(CALL_TYPE.ResendPacket, missingOrdersSequence.shift());
            }
        }else if (callType == CALL_TYPE.ResendPacket && missingOrdersSequence.length > 0){
            getAllOrders(CALL_TYPE.ResendPacket, missingOrdersSequence.shift());    
        }

        if(missingOrdersSequence.length === 0){
            fs.writeFile(FILE_NAME, JSON.stringify(orders, null, 2), (err)=>{
                if(err){
                    console.error(`${ERROR_LOG.FAILED_CREATE_JSON_FILE}`);
                }
            })
        }

        console.info(`${INFO_LOG.CLOSE_CONNECTION}`);
    })

    client.on("error", (err) => {
        console.error(`Error: ${err.message}`)
    })
}

getAllOrders(CALL_TYPE.StreamAllPackets);