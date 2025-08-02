import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { WebSocket } from "ws";

interface UserSubscription {
  [key: string]: {
    ws: WebSocket;
    rooms: string[];
  };
}

export class WsManager {
  // data members
  private static instance: WsManager;
  private subscriptions: UserSubscription;
  private publishClient: RedisClientType;
  private subscribeClient: RedisClientType;

  constructor() {
    this.publishClient = createClient();
    this.publishClient.connect();
    this.subscribeClient = createClient();
    this.subscribeClient.connect();
    this.subscriptions = {};
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WsManager();
    }
    return this.instance;
  }
}
