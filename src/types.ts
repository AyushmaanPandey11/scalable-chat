export const SEND_MESSAGE = "SEND_MESSAGE";
export const JOIN_ROOM = "JOIN_ROOM";
export const LEAVE_ROOM = "LEAVE_ROOM";
export type userEventType =
  | typeof SEND_MESSAGE
  | typeof JOIN_ROOM
  | typeof LEAVE_ROOM;
export type sendMessageType = {
  type: typeof SEND_MESSAGE;
  payload: {
    message: string;
    roomId: string;
    name: string;
  };
};

export type joinRoomType = {
  type: typeof JOIN_ROOM;
  payload: {
    roomId: string;
    name: string;
  };
};

export type leaveRoomType = {
  type: typeof LEAVE_ROOM;
  payload: {
    roomId: string;
    name: string;
    userId: string;
  };
};
export type MessageBody = sendMessageType | joinRoomType | leaveRoomType;
