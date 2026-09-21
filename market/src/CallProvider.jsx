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

  // Stores information about an incoming call.
  const [incomingCall, setIncomingCall] = useState(null);

  /*
    Call status:

    idle       -> No call
    calling    -> We are calling someone
    incoming   -> Someone is calling us
    connecting  -> WebRTC is negotiating connection
    connected   -> WebRTC connection is established
  */
  const [callStatus, setCallStatus] = useState("idle");

  // Microphone mute state.
  const [isMuted, setIsMuted] = useState(false);

  // =========================================================
  // REFS
  // =========================================================

  // Current WebRTC peer connection.
  const peerConnectionRef = useRef(null);

  // Local microphone stream.
  const localStreamRef = useRef(null);

  // Global audio element used for remote audio.
  const remoteAudioRef = useRef(null);

  /*
    ICE candidates can arrive before the WebRTC
    remote description has been applied.

    Therefore, we temporarily store them here.
  */
  const pendingCandidatesRef = useRef([]);

  // ID of the person we are talking to.
  const remoteUserIdRef = useRef(null);

  // Prevent cleanup/state races.
  const cleaningUpRef = useRef(false);

  // =========================================================
  // FLUSH QUEUED ICE CANDIDATES
  // =========================================================

  const flushPendingCandidates = useCallback(async () => {
    const peer = peerConnectionRef.current;

    if (!peer) {
      console.log(
        "⚠️ Cannot flush ICE candidates: no peer"
      );
      return;
    }

    /*
      We cannot add ICE candidates until the
      remote description exists.
    */
    if (!peer.remoteDescription) {
      console.log(
        "⏳ Cannot flush ICE: remote description not ready"
      );
      return;
    }

    const candidates =
      pendingCandidatesRef.current;

    /*
      Clear the queue only AFTER copying it.
      This prevents candidates from being lost.
    */
    pendingCandidatesRef.current = [];

    console.log(
      `🧊 Flushing ${candidates.length} queued ICE candidate(s)`
    );

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log(
          "✅ Pending ICE candidate added"
        );
      } catch (error) {
        console.error(
          "❌ Error adding pending ICE candidate:",
          error
        );
      }
    }
  }, []);

  // =========================================================
  // CLEANUP CALL
  // =========================================================

  const cleanupCall = useCallback(() => {
    console.log("🧹 Cleaning up call");

    cleaningUpRef.current = true;

    // -------------------------------------------------------
    // Close WebRTC peer connection
    // -------------------------------------------------------

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.onicecandidate =
          null;

        peerConnectionRef.current.ontrack =
          null;

        peerConnectionRef.current.onconnectionstatechange =
          null;

        peerConnectionRef.current.oniceconnectionstatechange =
          null;

        peerConnectionRef.current.close();
      } catch (error) {
        console.error(
          "❌ Peer cleanup error:",
          error
        );
      }

      peerConnectionRef.current = null;
    }

    // -------------------------------------------------------
    // Stop microphone
    // -------------------------------------------------------

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
    }

    // -------------------------------------------------------
    // Remove remote audio
    // -------------------------------------------------------

    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
      } catch (error) {
        console.error(
          "Audio cleanup error:",
          error
        );
      }

      remoteAudioRef.current.srcObject = null;
    }

    // -------------------------------------------------------
    // Clear ICE candidates
    // -------------------------------------------------------

    pendingCandidatesRef.current = [];

    // -------------------------------------------------------
    // Clear remote user
    // -------------------------------------------------------

    remoteUserIdRef.current = null;

    // -------------------------------------------------------
    // Reset microphone state
    // -------------------------------------------------------

    setIsMuted(false);

    // -------------------------------------------------------
    // Reset incoming call
    // -------------------------------------------------------

    setIncomingCall(null);

    // -------------------------------------------------------
    // Reset call status
    // -------------------------------------------------------

    setCallStatus("idle");

    /*
      Allow another call after the current cleanup
      has finished.
    */
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

    console.log(
      "🎙️ Requesting microphone..."
    );

    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

    console.log(
      "✅ Microphone permission granted"
    );

    localStreamRef.current = stream;

    // Make sure microphone starts enabled.
    stream.getAudioTracks().forEach(
      (track) => {
        track.enabled = true;
      }
    );

    setIsMuted(false);

    return stream;
  }, []);

  // =========================================================
  // CREATE WEBRTC PEER CONNECTION
  // =========================================================

  const createPeerConnection = useCallback(
    (targetUserId) => {
      console.log(
        "🔗 Creating peer connection:",
        targetUserId
      );

      /*
        STUN servers help both browsers discover
        their public network addresses.
      */
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

      // =====================================================
      // SEND ICE CANDIDATES
      // =====================================================

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          console.log(
            "🧊 ICE gathering completed"
          );
          return;
        }

        console.log(
          "🧊 Sending ICE candidate"
        );

        socket.emit("ice-candidate", {
          receiverId: targetUserId,
          candidate: event.candidate,
        });
      };

      // =====================================================
      // RECEIVE REMOTE AUDIO
      // =====================================================

      peer.ontrack = async (event) => {
        console.log(
          "🔊 Remote audio track received"
        );

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

        remoteAudioRef.current.muted =
          false;

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

      // =====================================================
      // WEBRTC CONNECTION STATE
      // =====================================================

      peer.onconnectionstatechange = () => {
        const state =
          peer.connectionState;

        console.log(
          "🌐 WebRTC connection state:",
          state
        );

        // WebRTC is currently connecting.
        if (state === "connecting") {
          console.log(
            "🔄 WebRTC is connecting..."
          );

          setCallStatus("connecting");
        }

        // The actual call is connected.
        if (state === "connected") {
          console.log(
            "✅ WEBRTC CALL CONNECTED!"
          );

          setCallStatus("connected");
        }

        // Temporary network problem.
        if (state === "disconnected") {
          console.warn(
            "⚠️ WebRTC connection disconnected"
          );
        }

        // WebRTC could not establish connection.
        if (state === "failed") {
          console.error(
            "❌ WebRTC connection failed"
          );

          cleanupCall();
        }

        // Connection was closed.
        if (state === "closed") {
          console.log(
            "☎️ WebRTC connection closed"
          );
        }
      };

      // =====================================================
      // ICE CONNECTION STATE
      // =====================================================

      peer.oniceconnectionstatechange =
        () => {
          const state =
            peer.iceConnectionState;

          console.log(
            "🧊 ICE connection state:",
            state
          );

          if (state === "checking") {
            console.log(
              "🔎 ICE is checking connection..."
            );
          }

          if (state === "connected") {
            console.log(
              "✅ ICE connection established"
            );
          }

          if (state === "completed") {
            console.log(
              "✅ ICE connection completed"
            );
          }

          if (state === "disconnected") {
            console.warn(
              "⚠️ ICE connection disconnected"
            );
          }

          if (state === "failed") {
            console.error(
              "❌ ICE connection failed"
            );

            cleanupCall();
          }
        };

      // Save peer globally.
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

        // Don't start another call.
        if (
          callStatus !== "idle" ||
          incomingCall
        ) {
          console.log(
            "⚠️ Another call is already active"
          );
          return;
        }

        // Socket must be connected.
        if (!socket.connected) {
          console.error(
            "❌ Socket is not connected"
          );
          return;
        }

        cleaningUpRef.current = false;

        // New call starts with an empty ICE queue.
        pendingCandidatesRef.current = [];

        remoteUserIdRef.current =
          receiverId.toString();

        setCallStatus("calling");

        console.log(
          "📞 Starting call:",
          receiverId
        );

        // ---------------------------------------------------
        // Get microphone
        // ---------------------------------------------------

        const stream =
          await getMicrophone();

        // ---------------------------------------------------
        // Create peer
        // ---------------------------------------------------

        const peer =
          createPeerConnection(
            receiverId
          );

        // ---------------------------------------------------
        // Add microphone tracks
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // Create offer
        // ---------------------------------------------------

        const offer =
          await peer.createOffer();

        await peer.setLocalDescription(
          offer
        );

        console.log(
          "📤 Sending call offer"
        );

        // ---------------------------------------------------
        // Send offer through Socket.IO
        // ---------------------------------------------------

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
  // HANDLE INCOMING CALL
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

      // Make sure the offer exists.
      if (!offer) {
        console.error(
          "❌ Incoming call has no offer"
        );
        return;
      }

      remoteUserIdRef.current =
        callerId?.toString();

      /*
        IMPORTANT:

        We only clear the queue when a completely
        new incoming call begins.

        Once ICE candidates start arriving,
        answerCall() must NOT clear this queue.
      */
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
  // ANSWER INCOMING CALL
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

        /*
          VERY IMPORTANT:

          DO NOT DO THIS HERE:

          pendingCandidatesRef.current = [];

          ICE candidates may already have arrived
          while the incoming call notification was
          waiting for the user to press Answer.

          We need to keep them.
        */

        // ---------------------------------------------------
        // Get microphone
        // ---------------------------------------------------

        const stream =
          await getMicrophone();

        // ---------------------------------------------------
        // Create peer
        // ---------------------------------------------------

        const peer =
          createPeerConnection(
            callerId
          );

        // ---------------------------------------------------
        // Add microphone
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // Apply caller's offer
        // ---------------------------------------------------

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        console.log(
          "📥 Remote offer applied"
        );

        // ---------------------------------------------------
        // Add ICE candidates that arrived earlier
        // ---------------------------------------------------

        await flushPendingCandidates();

        console.log(
          "🧊 Pending ICE candidates processed"
        );

        // ---------------------------------------------------
        // Create answer
        // ---------------------------------------------------

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "📤 Sending call answer"
        );

        // ---------------------------------------------------
        // Send answer back to caller
        // ---------------------------------------------------

        socket.emit("answer-call", {
          callerId,
          answer,
        });

        // Remove incoming-call popup.
        setIncomingCall(null);

        /*
          DO NOT set connected here.

          The connection becomes "connected"
          only when WebRTC confirms it through
          peer.onconnectionstatechange.
        */

        setCallStatus("connecting");
      } catch (error) {
        console.error(
          "❌ Answer call error:",
          error
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
  // RECEIVE CALL ANSWER
  // =========================================================

  useEffect(() => {
    const handleCallAnswered =
      async ({ answer }) => {
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

          // Apply remote answer.
          await peer.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

          console.log(
            "✅ Remote answer applied"
          );

          // Add any ICE candidates
          // that arrived before the answer.
          await flushPendingCandidates();

          console.log(
            "🧊 Pending ICE candidates processed"
          );

          /*
            Do NOT mark connected here.

            WebRTC itself will tell us when the
            connection is actually established.
          */
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
  // RECEIVE ICE CANDIDATES
  // =========================================================

  useEffect(() => {
    const handleIceCandidate =
      async ({ candidate }) => {
        try {
          if (!candidate) {
            return;
          }

          const peer =
            peerConnectionRef.current;

          /*
            ICE arrived before peer creation.

            Store it for later.
          */
          if (!peer) {
            console.log(
              "⏳ No peer yet. Queueing ICE candidate."
            );

            pendingCandidatesRef.current.push(
              candidate
            );

            return;
          }

          /*
            Peer exists but remote offer/answer
            hasn't been applied yet.

            Store the candidate.
          */
          if (!peer.remoteDescription) {
            console.log(
              "⏳ Remote description not ready. Queueing ICE."
            );

            pendingCandidatesRef.current.push(
              candidate
            );

            return;
          }

          // Remote description exists,
          // so we can add ICE immediately.
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
  // REJECT / DECLINE CALL
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
  // CALL WAS REJECTED
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
  // MUTE / UNMUTE MICROPHONE
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
  // REMOTE USER ENDED CALL
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
  // CLEANUP WHEN PROVIDER UNMOUNTS
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
        // State
        incomingCall,
        callStatus,
        isMuted,

        // Actions
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        cleanupCall,

        // Audio
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
          INCOMING CALL POPUP
      ===================================================== */}

      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-7 text-center shadow-2xl">
            {/* Caller image */}
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

            {/* Title */}
            <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
              Incoming Call
            </h2>

            {/* Caller name */}
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {incomingCall.callerName ||
                "Student"}{" "}
              is calling...
            </p>

            {/* Buttons */}
            <div className="mt-7 flex gap-4">
              {/* Decline */}
              <button
                type="button"
                onClick={rejectCall}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
              >
                Decline
              </button>

              {/* Answer */}
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
          OUTGOING / CONNECTED CALL UI
      ===================================================== */}

      {(callStatus === "calling" ||
        callStatus === "connecting" ||
        callStatus === "connected") && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-900 p-7 text-center shadow-2xl">
            {/* Call icon */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-4xl">
              📞
            </div>

            {/* Title */}
            <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
              Voice Call
            </h2>

            {/* Status */}
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {callStatus === "calling" &&
                "Calling..."}

              {callStatus === "connecting" &&
                "Connecting..."}

              {callStatus === "connected" &&
                "Connected"}
            </p>

            {/* Call controls */}
            <div className="mt-8 flex justify-center gap-4">
              {/* Mute button */}
              {callStatus ===
                "connected" && (
                <button
                  type="button"
                  onClick={toggleMute}
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

              {/* End call */}
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
// USE CALL HOOK
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