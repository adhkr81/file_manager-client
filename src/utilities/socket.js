import io from "socket.io-client"
const socket = io.connect("http://localhost:4000", { transports : ['websocket'] })
export default socket