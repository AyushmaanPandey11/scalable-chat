import { WebSocket, WebSocketServer } from "ws";
import { JOIN_ROOM, MessageBody, userEventType } from "./types";
import { WsManager } from "./WsManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`new user connected: `, userSocket);

  userSocket.on("message", (message: string) => {
    const parsedMessage: MessageBody = JSON.parse(message);
    console.log(parsedMessage);
    const eventType: userEventType = parsedMessage.type;
    switch (eventType) {
      case JOIN_ROOM:
        WsManager.getInstance().joinRoom(parsedMessage, userSocket);
    }
  });
});
