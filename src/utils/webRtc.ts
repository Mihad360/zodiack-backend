/* eslint-disable no-undef */
// src/utils/webrtcUtils.ts

import { Socket } from "socket.io";

export class WebRTCUtils {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  // Handle incoming offer (just relay to the other client)
  public handleOffer(offer: RTCSessionDescriptionInit) {
    // Forward the offer to the other peer
    this.socket.emit("offer", offer);
  }

  // Handle incoming answer (just relay to the other client)
  public handleAnswer(answer: RTCSessionDescriptionInit) {
    // Forward the answer to the other peer
    this.socket.emit("answer", answer);
  }

  // Handle incoming ICE candidate (just relay to the other client)
  public handleIceCandidate(candidate: RTCIceCandidateInit) {
    // Forward the ICE candidate to the other peer
    this.socket.emit("ice-candidate", candidate);
  }
}
