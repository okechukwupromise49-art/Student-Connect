import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import socket from "./socket";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ==========================================
  // CREATE PEER CONNECTION
  // ==========================================

  const createPeerConnection = (targetUserId) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    // Send ICE candidates to the other user
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          receiverId: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    // Receive remote audio
    peer.ontrack = (event) => {
      const stream = event.streams?.[0];

      if (stream && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;

        remoteAudioRef.current
          .play()
          .catch((error) => {
            console.log("Remote audio play blocked:", error);
          });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(
        "WebRTC connection:",
        peer.connectionState
      );

      if (peer.connectionState === "connected") {
        setCallStatus("connected");
      }

      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        cleanupCall();
      }
    };

    peerConnectionRef.current = peer;

    return peer;
  };

  // ==========================================
  // GET MICROPHONE
  // ==========================================

  const getMicrophone = async () => {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

    localStreamRef.current = stream;

    return stream;
  };

  // ==========================================
  // START CALL
  // ==========================================

  const startCall = async (receiverId) => {
    try {
      setCallStatus("calling");

      const stream = await getMicrophone();

      const peer =
        createPeerConnection(receiverId);

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      socket.emit("call-user", {
        receiverId,
        offer,
      });
    } catch (error) {
      console.error("Start call error:", error);

      setCallStatus("idle");

      cleanupCall();
    }
  };

  // ==========================================
  // INCOMING CALL
  // ==========================================

  useEffect(() => {
    const handleIncomingCall = ({
      callerId,
      offer,
    }) => {
      console.log("Incoming call from:", callerId);

      setIncomingCall({
        callerId,
        offer,
      });

      setCallStatus("incoming");
    };

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    return () => {
      socket.off(
        "incoming-call",
        handleIncomingCall
      );
    };
  }, []);

  // ==========================================
  // ANSWER CALL
  // ==========================================

  const answerCall = async () => {
    try {
      if (!incomingCall) return;

      const {
        callerId,
        offer,
      } = incomingCall;

      setCallStatus("connecting");

      const stream = await getMicrophone();

      const peer =
        createPeerConnection(callerId);

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer =
        await peer.createAnswer();

      await peer.setLocalDescription(answer);

      socket.emit("answer-call", {
        callerId,
        answer,
      });

      setIncomingCall(null);
    } catch (error) {
      console.error(
        "Answer call error:",
        error
      );

      cleanupCall();
    }
  };

  // ==========================================
  // CALL ANSWERED
  // ==========================================

  useEffect(() => {
    const handleCallAnswered = async ({
      answer,
    }) => {
      try {
        const peer =
          peerConnectionRef.current;

        if (!peer) return;

        await peer.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        setCallStatus("connected");
      } catch (error) {
        console.error(
          "Call answer error:",
          error
        );
      }
    };

    socket.on(
      "call-answered",
      handleCallAnswered
    );

    return () => {
      socket.off(
        "call-answered",
        handleCallAnswered
      );
    };
  }, []);

  // ==========================================
  // REJECT CALL
  // ==========================================

  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit("reject-call", {
      callerId: incomingCall.callerId,
    });

    setIncomingCall(null);
    setCallStatus("idle");
  };

  // ==========================================
  // CALL REJECTED
  // ==========================================

  useEffect(() => {
    const handleCallRejected = () => {
      console.log("Call rejected");

      cleanupCall();
    };

    socket.on(
      "call-rejected",
      handleCallRejected
    );

    return () => {
      socket.off(
        "call-rejected",
        handleCallRejected
      );
    };
  }, []);

  // ==========================================
  // ICE CANDIDATE
  // ==========================================

  useEffect(() => {
    const handleIceCandidate = async ({
      candidate,
    }) => {
      try {
        const peer =
          peerConnectionRef.current;

        if (!peer || !candidate) return;

        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "ICE candidate error:",
          error
        );
      }
    };

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    return () => {
      socket.off(
        "ice-candidate",
        handleIceCandidate
      );
    };
  }, []);

  // ==========================================
  // END CALL
  // ==========================================

  const endCall = (receiverId) => {
    if (receiverId) {
      socket.emit("end-call", {
        receiverId,
      });
    }

    cleanupCall();
  };

  // ==========================================
  // CALL ENDED
  // ==========================================

  useEffect(() => {
    const handleCallEnded = () => {
      cleanupCall();
    };

    socket.on(
      "call-ended",
      handleCallEnded
    );

    return () => {
      socket.off(
        "call-ended",
        handleCallEnded
      );
    };
  }, []);

  // ==========================================
  // CLEANUP
  // ==========================================

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIncomingCall(null);
    setCallStatus("idle");
  };

 return (
  <CallContext.Provider
    value={{
      incomingCall,
      callStatus,
      startCall,
      answerCall,
      rejectCall,
      endCall,
      cleanupCall,
      remoteAudioRef,
    }}
  >
    {children}

    {/* Global remote audio */}
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
    />

    {/* GLOBAL INCOMING CALL UI */}
    {incomingCall && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">

          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900">
            📞
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Incoming Call
          </h2>

          {incomingCall.callerImage ? (
          <img
            src={incomingCall.callerImage}
            alt={incomingCall.callerName}
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">
            📞
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Incoming Call
        </h2>

        <p className="mt-2 font-medium text-gray-700 dark:text-gray-300">
          {incomingCall.callerName} is calling...
        </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={rejectCall}
              className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Decline
            </button>

            <button
              onClick={answerCall}
              className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
            >
              Answer
            </button>
          </div>
        </div>
      </div>
    )}
  </CallContext.Provider>
);
};

// ==========================================
// HOOK
// ==========================================

export const useCall = () => {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error(
      "useCall must be used inside CallProvider"
    );
  }

  return context;
};