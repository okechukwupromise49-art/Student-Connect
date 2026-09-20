import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import socket from "./socket";

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  // =========================================================
  // STATE
  // =========================================================

  const [incomingCall, setIncomingCall] = useState(null);

  // idle
  // calling
  // incoming
  // connecting
  // connected
  const [callStatus, setCallStatus] = useState("idle");

  const [isMuted, setIsMuted] = useState(false);

  // =========================================================
  // REFS
  // =========================================================

  const peerConnectionRef = useRef(null);

  const localStreamRef = useRef(null);

  const remoteAudioRef = useRef(null);

  // ICE candidates can arrive before remoteDescription exists.
  const pendingCandidatesRef = useRef([]);

  // The person we are currently calling / connected to.
  const remoteUserIdRef = useRef(null);

  // Prevent cleanup from causing unwanted state races.
  const cleaningUpRef = useRef(false);

  // =========================================================
  // ADD PENDING ICE CANDIDATES
  // =========================================================

  const flushPendingCandidates = useCallback(async () => {
    const peer = peerConnectionRef.current;

    if (!peer) return;

    if (!peer.remoteDescription) {
      return;
    }

    const candidates = pendingCandidatesRef.current;

    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("✅ Pending ICE candidate added");
      } catch (error) {
        console.error(
          "❌ Error adding pending ICE candidate:",
          error
        );
      }
    }
  }, []);

  // =========================================================
  // CLEANUP
  // =========================================================

  const cleanupCall = useCallback(() => {
    console.log("🧹 Cleaning up call");

    cleaningUpRef.current = true;

    // Close WebRTC connection
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;

        peerConnectionRef.current.close();
      } catch (error) {
        console.error(
          "Peer cleanup error:",
          error
        );
      }

      peerConnectionRef.current = null;
    }

    // Stop microphone
    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
    }

    // Remove remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    // Reset ICE
    pendingCandidatesRef.current = [];

    // Reset remote user
    remoteUserIdRef.current = null;

    // Reset mute
    setIsMuted(false);

    // Reset incoming call
    setIncomingCall(null);

    // Reset status
    setCallStatus("idle");

    // Allow future calls
    setTimeout(() => {
      cleaningUpRef.current = false;
    }, 0);
  }, []);

  // =========================================================
  // GET MICROPHONE
  // =========================================================

  const getMicrophone = useCallback(async () => {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        "Microphone is not supported by this browser."
      );
    }

    console.log("🎙️ Requesting microphone...");

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

    console.log("✅ Microphone permission granted");

    localStreamRef.current = stream;

    // Make sure microphone starts unmuted.
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });

    setIsMuted(false);

    return stream;
  }, []);

  // =========================================================
  // CREATE PEER CONNECTION
  // =========================================================

  const createPeerConnection = useCallback(
    (targetUserId) => {
      console.log(
        "🔗 Creating peer connection:",
        targetUserId
      );

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

      remoteUserIdRef.current =
        targetUserId?.toString();

      // -----------------------------------------------------
      // ICE CANDIDATES
      // -----------------------------------------------------

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        console.log("🧊 Sending ICE candidate");

        socket.emit("ice-candidate", {
          receiverId: targetUserId,
          candidate: event.candidate,
        });
      };

      // -----------------------------------------------------
      // REMOTE AUDIO
      // -----------------------------------------------------

      peer.ontrack = async (event) => {
        console.log("🔊 Remote audio track received");

        const stream =
          event.streams?.[0];

        if (!stream) {
          console.warn(
            "⚠️ Remote track received without stream"
          );
          return;
        }

        if (!remoteAudioRef.current) {
          console.warn(
            "⚠️ Remote audio element is not ready"
          );
          return;
        }

        remoteAudioRef.current.srcObject =
          stream;

        remoteAudioRef.current.muted = false;

        remoteAudioRef.current.volume = 1;

        try {
          await remoteAudioRef.current.play();

          console.log(
            "🔊 Remote audio playback started"
          );
        } catch (error) {
          console.error(
            "❌ Remote audio playback failed:",
            error
          );
        }
      };

      // -----------------------------------------------------
      // CONNECTION STATE
      // -----------------------------------------------------

      peer.onconnectionstatechange = () => {
        const state =
          peer.connectionState;

        console.log(
          "🌐 WebRTC connection state:",
          state
        );

        if (state === "connected") {
          console.log(
            "✅ WebRTC call connected"
          );

          setCallStatus("connected");
        }

        if (state === "failed") {
          console.error(
            "❌ WebRTC connection failed"
          );

          cleanupCall();
        }

        if (state === "closed") {
          console.log(
            "☎️ WebRTC connection closed"
          );

          cleanupCall();
        }
      };

      // -----------------------------------------------------
      // ICE CONNECTION STATE
      // -----------------------------------------------------

      peer.oniceconnectionstatechange = () => {
        console.log(
          "🧊 ICE connection state:",
          peer.iceConnectionState
        );

        if (
          peer.iceConnectionState ===
          "failed"
        ) {
          console.error(
            "❌ ICE connection failed"
          );

          cleanupCall();
        }
      };

      peerConnectionRef.current =
        peer;

      return peer;
    },
    [cleanupCall]
  );

  // =========================================================
  // START OUTGOING CALL
  // =========================================================

  const startCall = useCallback(
    async (receiverId) => {
      try {
        if (!receiverId) {
          console.error(
            "❌ No receiver ID supplied"
          );
          return;
        }

        if (
          callStatus !== "idle" ||
          incomingCall
        ) {
          console.log(
            "⚠️ Another call is already active"
          );
          return;
        }

        if (!socket.connected) {
          console.error(
            "❌ Socket is not connected"
          );
          return;
        }

        cleaningUpRef.current = false;

        pendingCandidatesRef.current = [];

        remoteUserIdRef.current =
          receiverId.toString();

        setCallStatus("calling");

        console.log(
          "📞 Starting call:",
          receiverId
        );

        // Get microphone
        const stream =
          await getMicrophone();

        // Create peer
        const peer =
          createPeerConnection(
            receiverId
          );

        // Add microphone tracks
        stream
          .getTracks()
          .forEach((track) => {
            peer.addTrack(
              track,
              stream
            );
          });

        console.log(
          "🎙️ Microphone tracks added"
        );

        // Create offer
        const offer =
          await peer.createOffer();

        await peer.setLocalDescription(
          offer
        );

        console.log(
          "📤 Sending call offer"
        );

        socket.emit("call-user", {
          receiverId,
          offer,
        });
      } catch (error) {
        console.error(
          "❌ Start call error:",
          error
        );

        cleanupCall();
      }
    },
    [
      callStatus,
      incomingCall,
      getMicrophone,
      createPeerConnection,
      cleanupCall,
    ]
  );

  // =========================================================
  // INCOMING CALL
  // =========================================================

  useEffect(() => {
    const handleIncomingCall = ({
      callerId,
      callerName,
      callerImage,
      offer,
    }) => {
      console.log(
        "📲 Incoming call from:",
        callerId
      );

      // Don't accept another call while busy.
      if (callStatus !== "idle") {
        console.log(
          "⚠️ Already in another call"
        );

        socket.emit("reject-call", {
          callerId,
        });

        return;
      }

      if (!offer) {
        console.error(
          "❌ Incoming call has no offer"
        );
        return;
      }

      remoteUserIdRef.current =
        callerId?.toString();

      pendingCandidatesRef.current = [];

      setIncomingCall({
        callerId,
        callerName:
          callerName || "Student",
        callerImage:
          callerImage || null,
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
  }, [callStatus]);

  // =========================================================
  // ANSWER CALL
  // =========================================================

  const answerCall = useCallback(
    async () => {
      try {
        if (!incomingCall) {
          return;
        }

        const {
          callerId,
          offer,
        } = incomingCall;

        if (!callerId || !offer) {
          console.error(
            "❌ Invalid incoming call data"
          );

          cleanupCall();
          return;
        }

        console.log(
          "✅ Answering call from:",
          callerId
        );

        setCallStatus("connecting");

        cleaningUpRef.current = false;

        remoteUserIdRef.current =
          callerId.toString();

        pendingCandidatesRef.current = [];

        // Get microphone
        const stream =
          await getMicrophone();

        // Create peer
        const peer =
          createPeerConnection(
            callerId
          );

        // Add microphone
        stream
          .getTracks()
          .forEach((track) => {
            peer.addTrack(
              track,
              stream
            );
          });

        console.log(
          "🎙️ Answer microphone added"
        );

        // IMPORTANT:
        // Set remote offer before adding
        // queued ICE candidates.
        await peer.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        console.log(
          "📥 Remote offer applied"
        );

        // Add any ICE candidates that
        // arrived before the offer.
        await flushPendingCandidates();

        // Create answer
        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "📤 Sending call answer"
        );

        socket.emit("answer-call", {
          callerId,
          answer,
        });

        setIncomingCall(null);
      } catch (error) {
        console.error(
          "❌ Answer call error:",
          error
        );

        socket.emit(
          "reject-call",
          {
            callerId:
              incomingCall?.callerId,
          }
        );

        cleanupCall();
      }
    },
    [
      incomingCall,
      getMicrophone,
      createPeerConnection,
      flushPendingCandidates,
      cleanupCall,
    ]
  );

  // =========================================================
  // CALL ANSWERED
  // =========================================================

  useEffect(() => {
    const handleCallAnswered = async ({
      answer,
    }) => {
      try {
        console.log(
          "📥 Call answer received"
        );

        const peer =
          peerConnectionRef.current;

        if (!peer) {
          console.error(
            "❌ No peer connection for answer"
          );
          return;
        }

        if (!answer) {
          console.error(
            "❌ Empty call answer"
          );
          return;
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );

        console.log(
          "✅ Remote answer applied"
        );

        // ICE candidates may have arrived
        // before the answer.
        await flushPendingCandidates();

        // Don't immediately call this
        // "connected".
        //
        // onconnectionstatechange will
        // change it to connected when
        // WebRTC really connects.
        setCallStatus("connecting");
      } catch (error) {
        console.error(
          "❌ Error applying call answer:",
          error
        );

        cleanupCall();
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
  }, [
    flushPendingCandidates,
    cleanupCall,
  ]);

  // =========================================================
  // ICE CANDIDATE RECEIVER
  // =========================================================

  useEffect(() => {
    const handleIceCandidate = async ({
      candidate,
    }) => {
      try {
        if (!candidate) {
          return;
        }

        const peer =
          peerConnectionRef.current;

        if (!peer) {
          console.log(
            "⏳ No peer yet. Queueing ICE candidate."
          );

          pendingCandidatesRef.current.push(
            candidate
          );

          return;
        }

        // IMPORTANT:
        // addIceCandidate can fail if
        // remoteDescription hasn't been
        // applied yet.
        if (!peer.remoteDescription) {
          console.log(
            "⏳ Remote description not ready. Queueing ICE."
          );

          pendingCandidatesRef.current.push(
            candidate
          );

          return;
        }

        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log(
          "🧊 ICE candidate added"
        );
      } catch (error) {
        console.error(
          "❌ ICE candidate error:",
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

  // =========================================================
  // DECLINE CALL
  // =========================================================

  const rejectCall = useCallback(() => {
    if (!incomingCall) {
      return;
    }

    const callerId =
      incomingCall.callerId;

    console.log(
      "❌ Declining call from:",
      callerId
    );

    socket.emit("reject-call", {
      callerId,
    });

    cleanupCall();
  }, [
    incomingCall,
    cleanupCall,
  ]);

  // =========================================================
  // CALL REJECTED
  // =========================================================

  useEffect(() => {
    const handleCallRejected = () => {
      console.log(
        "❌ Outgoing call was declined"
      );

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
  }, [cleanupCall]);

  // =========================================================
  // MUTE / UNMUTE
  // =========================================================

  const toggleMute = useCallback(() => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      console.warn(
        "⚠️ No microphone stream available"
      );
      return;
    }

    const audioTracks =
      stream.getAudioTracks();

    if (!audioTracks.length) {
      console.warn(
        "⚠️ No microphone track available"
      );
      return;
    }

    const nextMuted = !isMuted;

    audioTracks.forEach(
      (track) => {
        track.enabled = !nextMuted;
      }
    );

    setIsMuted(nextMuted);

    console.log(
      nextMuted
        ? "🔇 Microphone muted"
        : "🎙️ Microphone unmuted"
    );
  }, [isMuted]);

  // =========================================================
  // END CALL
  // =========================================================

  const endCall = useCallback(
    (receiverId) => {
      const targetId =
        receiverId ||
        remoteUserIdRef.current;

      console.log(
        "☎️ Ending call:",
        targetId
      );

      if (targetId) {
        socket.emit("end-call", {
          receiverId: targetId,
        });
      }

      cleanupCall();
    },
    [cleanupCall]
  );

  // =========================================================
  // REMOTE USER ENDS CALL
  // =========================================================

  useEffect(() => {
    const handleCallEnded = () => {
      console.log(
        "☎️ Remote user ended the call"
      );

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
  }, [cleanupCall]);

  // =========================================================
  // CLEANUP WHEN COMPONENT UNMOUNTS
  // =========================================================

  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        callStatus,
        isMuted,

        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        cleanupCall,

        remoteAudioRef,
      }}
    >
      {children}

      {/* =====================================================
          GLOBAL REMOTE AUDIO
      ===================================================== */}

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls={false}
        muted={false}
        style={{
          display: "none",
        }}
      />

      {/* =====================================================
          INCOMING CALL
      ===================================================== */}

      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-7 text-center shadow-2xl">

            {incomingCall.callerImage ? (
              <img
                src={
                  incomingCall.callerImage
                }
                alt={
                  incomingCall.callerName ||
                  "Student"
                }
                className="mx-auto h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-4xl">
                📞
              </div>
            )}

            <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
              Incoming Call
            </h2>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {incomingCall.callerName ||
                "Student"}{" "}
              is calling...
            </p>

            <div className="mt-7 flex gap-4">

              {/* DECLINE */}

              <button
                type="button"
                onClick={rejectCall}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
              >
                Decline
              </button>

              {/* ANSWER */}

              <button
                type="button"
                onClick={answerCall}
                className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
              >
                Answer
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          OUTGOING / CONNECTED CALL
      ===================================================== */}

      {(callStatus === "calling" ||
        callStatus === "connecting" ||
        callStatus === "connected") && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-7 text-center shadow-2xl">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-4xl">
              📞
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
              Voice Call
            </h2>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {callStatus === "calling" &&
                "Calling..."}

              {callStatus ===
                "connecting" &&
                "Connecting..."}

              {callStatus ===
                "connected" &&
                "Connected"}
            </p>

            {/* CONTROLS */}

            <div className="mt-8 flex justify-center gap-4">

              {/* MUTE */}

              {callStatus ===
                "connected" && (
                <button
                  type="button"
                  onClick={
                    toggleMute
                  }
                  className={`h-14 w-14 rounded-full flex items-center justify-center transition ${
                    isMuted
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  title={
                    isMuted
                      ? "Unmute microphone"
                      : "Mute microphone"
                  }
                >
                  {isMuted ? (
                    <span className="text-xl">
                      🔇
                    </span>
                  ) : (
                    <span className="text-xl">
                      🎙️
                    </span>
                  )}
                </button>
              )}

              {/* END */}

              <button
                type="button"
                onClick={() =>
                  endCall()
                }
                className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center transition hover:bg-red-600"
                title="End call"
              >
                ☎️
              </button>

            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

// =========================================================
// HOOK
// =========================================================

export const useCall = () => {
  const context =
    useContext(CallContext);

  if (!context) {
    throw new Error(
      "useCall must be used inside CallProvider"
    );
  }

  return context;
};