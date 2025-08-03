import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { WebSocket } from "ws";
import {
  joinRoomType,
  leaveRoomType,
  SEND_MESSAGE,
  sendMessageType,
} from "./types";

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
    this.publishClient.on("error", (err) =>
      console.error("Publish client error:", err)
    );
    this.subscribeClient.on("error", (err) =>
      console.error("Subscribe client error:", err)
    );
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WsManager();
    }
    return this.instance;
  }

  public joinRoom(message: string, userWs: WebSocket) {
    const parsedMessage: joinRoomType = JSON.parse(message);
    const userId = this.getRandomId();
    const roomId = parsedMessage.payload.roomId;
    this.subscriptions[userId] = {
      ws: userWs,
      rooms: (this.subscriptions[userId]?.rooms || []).concat(
        parsedMessage.payload.roomId
      ),
      name: parsedMessage.payload.name,
    };
    if (this.reverseSubscriptions[roomId]) {
      this.reverseSubscriptions[roomId].push(userId);
    } else {
      this.reverseSubscriptions[roomId] = [userId];
    }
    if (this.isNewRoom(roomId)) {
      this.subscribeClient.subscribe(roomId, (message) => {
        const parsedMessage: sendMessageType = JSON.parse(message);
        this.reverseSubscriptions[parsedMessage.payload.roomId].forEach(
          (user) => {
            if (
              this.subscriptions[user] &&
              this.subscriptions[user].name !== parsedMessage.payload.name
            ) {
              const { ws } = this.subscriptions[user];
              ws.send(
                JSON.stringify({
                  message: parsedMessage.payload.message,
                  sender: parsedMessage.payload.name,
                })
              );
            }
          }
        );
      });
    }
    userWs.send(
      JSON.stringify({ name: parsedMessage.payload.name, userId: userId })
    );
    this.publishClient.publish(
      roomId,
      JSON.stringify({
        type: SEND_MESSAGE,
        payload: {
          message: `${parsedMessage.payload.name} has joined the room`,
          roomId: roomId,
          name: parsedMessage.payload.name,
        },
      })
    );
  }

  public leaveRoom(message: string) {
    const parsedMessage: leaveRoomType = JSON.parse(message);
    const { userId, name, roomId } = parsedMessage.payload;

    if (this.subscriptions[userId]) {
      this.subscriptions[userId].rooms = this.subscriptions[
        userId
      ].rooms.filter((room) => room !== roomId);

      this.reverseSubscriptions[roomId] =
        this.reverseSubscriptions[roomId]?.filter((user) => user !== userId) ||
        [];

      if (this.isRoomEmpty(roomId)) {
        this.subscribeClient.unsubscribe(roomId);
        delete this.reverseSubscriptions[roomId];
      }

      if (this.subscriptions[userId].rooms.length === 0) {
        delete this.subscriptions[userId];
      }
    }
    this.publishClient.publish(
      roomId,
      JSON.stringify({
        type: SEND_MESSAGE,
        payload: {
          message: `${name} has left the room`,
          roomId: roomId,
          name: name,
        },
      })
    );
  }

  public shareMessage(messageBody: string) {
    const parsedMessage: sendMessageType = JSON.parse(messageBody);
    const { roomId, message, name } = parsedMessage.payload;

    this.publishClient.publish(
      roomId,
      JSON.stringify({
        type: SEND_MESSAGE,
        payload: {
          message: message,
          roomId: roomId,
          name: name,
        },
      })
    );
  }

  private isNewRoom(roomId: string) {
    return (
      !this.reverseSubscriptions[roomId] ||
      this.reverseSubscriptions[roomId].length === 1
    );
  }

  private isRoomEmpty(roomId: string) {
    return (
      !this.reverseSubscriptions[roomId] ||
      this.reverseSubscriptions[roomId].length === 0
    );
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
