export const SEND_MESSAGE = "SEND_MESSAGE";
export const JOIN_ROOM = "JOIN_ROOM";
export const LEAVE_ROOM = "LEAVE_ROOM";
export type MessageBody =
  | {
      type: typeof SEND_MESSAGE;
      payload: {
        message: string;
        roomId: string;
        userId: string;
      };
    }
  | {
      type: typeof JOIN_ROOM;
      payload: {
        roomId: string;
        userId: string;
      };
    }
  | {
      type: typeof LEAVE_ROOM;
      payload: {
        roomId: string;
        userId: string;
      };
    };
