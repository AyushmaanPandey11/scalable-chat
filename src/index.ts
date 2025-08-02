import { WebSocket, WebSocketServer } from "ws";
import { MessageBody } from "./types";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`new user connected: `, userSocket);

  userSocket.on("message", (message: string) => {
    const parsedMessage: MessageBody = JSON.parse(message);
    console.log(parsedMessage);
    if( parsedMessage. )
  });
});
