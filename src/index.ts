import { WebSocket, WebSocketServer } from "ws";
import {
  JOIN_ROOM,
  LEAVE_ROOM,
  MessageBody,
  SEND_MESSAGE,
  userEventType,
} from "./types";
import { WsManager } from "./WsManager";

const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (userSocket: WebSocket) => {
  console.log(`new user connected: `, userSocket);

  userSocket.on("message", (message: string) => {
    const parsedMessage: MessageBody = JSON.parse(message);
    console.log(parsedMessage);
    const eventType: userEventType = parsedMessage.type;
    switch (eventType) {
      case JOIN_ROOM:
        WsManager.getInstance().joinRoom(message, userSocket);
        break;
      case LEAVE_ROOM:
        WsManager.getInstance().leaveRoom(message);
        break;
      case SEND_MESSAGE:
        WsManager.getInstance().shareMessage(message);
        break;
    }
  });

  userSocket.on("close", () => {
    const userId = Object.keys(WsManager.getInstance()["subscriptions"]).find(
      (id) => WsManager.getInstance()["subscriptions"][id].ws === userSocket
    );
    if (userId) {
      const name = WsManager.getInstance()["subscriptions"][userId].name;
      const rooms =
        WsManager.getInstance()["subscriptions"][userId]?.rooms || [];
      rooms.forEach((roomId) => {
        WsManager.getInstance()["reverseSubscriptions"][roomId] =
          WsManager.getInstance()["reverseSubscriptions"][roomId]?.filter(
            (user) => user !== userId
          ) || [];
        if (WsManager.getInstance()["isRoomEmpty"](roomId)) {
          WsManager.getInstance()["subscribeClient"].unsubscribe(roomId);
          delete WsManager.getInstance()["reverseSubscriptions"][roomId];
        }
      });
      delete WsManager.getInstance()["subscriptions"][userId];
      rooms.forEach((room) => {
        WsManager.getInstance()["publishClient"].publish(
          room,
          JSON.stringify({
            type: SEND_MESSAGE,
            payload: {
              message: `${name} has left the room`,
              roomId: room,
              name: name,
            },
          })
        );
      });
    }
    console.log(
      `user disconnected, cleaned up subscriptions for userId: ${userId}`
    );
  });
});
