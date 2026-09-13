import { io } from "socket.io-client";
import API_URL from "./Api";

const socket = io(API_URL, {
  withCredentials: true,
  autoConnect: false,
});

export default socket;