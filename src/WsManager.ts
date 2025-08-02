import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { WebSocket } from "ws";
import { joinRoomType, MessageBody } from "./types";

interface UserSubscription {
  [key: string]: {
    ws: WebSocket;
    name: string;
    rooms: string[];
  };
}

interface ReverSubType {
  [key: string]: string[];
}

export class WsManager {
  // data members
  private static instance: WsManager;
  private subscriptions: UserSubscription;
  private reverseSubscriptions: ReverSubType;
  private publishClient: RedisClientType;
  private subscribeClient: RedisClientType;

  constructor() {
    this.publishClient = createClient();
    this.publishClient.connect();
    this.subscribeClient = createClient();
    this.subscribeClient.connect();
    this.subscriptions = {};
    this.reverseSubscriptions = {};
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WsManager();
    }
    return this.instance;
  }

  public joinRoom(message: MessageBody, userWs: WebSocket) {
    const userId = this.getRandomId();
    const roomId = message.payload.roomId;
    this.subscriptions[userId] = {
      ws: userWs,
      rooms: (this.subscriptions[userId].rooms || []).concat(
        message.payload.roomId
      ),
      name: message.payload.name,
    };
    this.reverseSubscriptions[roomId].push(userId);

    if (this.isNewRoom(roomId)) {
      this.publishClient.subscribe(roomId, (message) => {
        const parsedMessage: MessageBody = JSON.parse(message);
        this.reverseSubscriptions[parsedMessage.payload.roomId].forEach(
          (user) => {
            const { ws, name } = this.subscriptions[user];
            ws.send(`${name} has joined the room`);
          }
        );
      });
    }
  }

  isNewRoom(roomId: string) {
    return this.reverseSubscriptions[roomId].length === 1;
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
