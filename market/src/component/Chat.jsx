import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  ArrowLeft,
  Send,
  MoreVertical,
  Copy,
  Edit3,
  Trash2,
  Mic,
  Square,
  X,
  Check,
  Loader2,
  Plus,
  Phone,
  PhoneOff,
  MicOff,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import axios from "axios";
import { toast } from "react-toastify";

import API_URL from "../Api";
import studySpher from "../assets/studySpher.jpeg";
import { PageLoader } from "../component/Loader";
import socket from "../socket";
import Swal from "sweetalert2"

export default function ChatPage() {
  const { userId } = useParams();

  const [searchParams] =
    useSearchParams();

  const orderId =
    searchParams.get("orderId");

  const navigate =
    useNavigate();

  // ======================================================
  // STATES
  // ======================================================

  const [otherUser, setOtherUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [me, setMe] =
    useState(null);

  const [isOnline, setIsOnline] =
    useState(false);

  const [isTyping, setIsTyping] =
    useState(false);

  // Editing
  const [editingMessage, setEditingMessage] =
    useState(null);

  // Menu
  const [openMenu, setOpenMenu] =
    useState(null);

  // Voice message
  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [audioBlob, setAudioBlob] =
    useState(null);

  const [audioUrl, setAudioUrl] =
    useState(null);

  const [isSendingAudio, setIsSendingAudio] =
    useState(false);

  // Files
  const [isSendingFile, setIsSendingFile] =
    useState(false);

  // Calls
  const [callStatus, setCallStatus] =
    useState("idle");

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [isMuted, setIsMuted] =
    useState(false);

  // ======================================================
  // REFS
  // ======================================================

  const bottomRef =
    useRef(null);

  const typingTimeoutRef =
    useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const recordingTimerRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  // WebRTC
  const peerConnectionRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const remoteAudioRef =
    useRef(null);

  // ======================================================
  // FETCH CHAT
  // ======================================================

  const fetchChat = async () => {
    try {
      const [
        chatRes,
        meRes,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/api/chat/${userId}`,
          {
            withCredentials: true,
          }
        ),

        axios.get(
          `${API_URL}/api/register/details`,
          {
            withCredentials: true,
          }
        ),
      ]);

      setOtherUser(
        chatRes.data.user
      );

      setMessages(
        chatRes.data.messages || []
      );

      setMe(
        meRes.data
      );
    } catch (error) {
      console.error(
        "Chat fetch error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to load chat"
      );

      navigate("/messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    fetchChat();
  }, [userId]);

  // ======================================================
  // SCROLL
  // ======================================================

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ======================================================
  // SOCKET
  // ======================================================

  useEffect(() => {
    if (
      !userId ||
      !me?._id
    ) {
      return;
    }

    socket.connect();

    socket.emit(
      "join",
      me._id
    );

    // ====================================================
    // NEW MESSAGE
    // ====================================================

    const handleNewMessage = (
      message
    ) => {
      const senderId =
        message.sender?._id?.toString() ||
        message.sender?.toString();

      const receiverId =
        message.receiver?._id?.toString() ||
        message.receiver?.toString();

      const myId =
        me._id.toString();

      const chatId =
        userId.toString();

      const belongsToChat =
        (
          senderId === myId &&
          receiverId === chatId
        ) ||
        (
          senderId === chatId &&
          receiverId === myId
        );

      if (!belongsToChat) {
        return;
      }

      setMessages((prev) => {
        const exists =
          prev.some(
            (msg) =>
              msg._id ===
              message._id
          );

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          message,
        ];
      });
    };

    // ====================================================
    // MESSAGE UPDATED
    // ====================================================

    const handleMessageUpdated =
      (message) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id ===
            message._id
              ? message
              : msg
          )
        );
      };

    // ====================================================
    // MESSAGE DELETED
    // ====================================================

    const handleMessageDeleted =
      ({
        messageId,
      }) => {
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              msg._id !==
              messageId
          )
        );
      };

    // ====================================================
    // ONLINE
    // ====================================================

    const handleUserOnline =
      (onlineUserId) => {
        if (
          onlineUserId.toString() ===
          userId.toString()
        ) {
          setIsOnline(true);
        }
      };

    // ====================================================
    // OFFLINE
    // ====================================================

    const handleUserOffline =
      (offlineUserId) => {
        if (
          offlineUserId.toString() ===
          userId.toString()
        ) {
          setIsOnline(false);
        }
      };

    // ====================================================
    // TYPING
    // ====================================================

    const handleUserTyping =
      ({
        senderId,
      }) => {
        if (
          senderId.toString() ===
          userId.toString()
        ) {
          setIsTyping(true);
        }
      };

    // ====================================================
    // STOP TYPING
    // ====================================================

    const handleUserStoppedTyping =
      ({
        senderId,
      }) => {
        if (
          senderId.toString() ===
          userId.toString()
        ) {
          setIsTyping(false);
        }
      };

    // ====================================================
    // INCOMING CALL
    // ====================================================

    const handleIncomingCall =
      ({
        callerId,
        offer,
      }) => {
        if (
          callerId.toString() !==
          userId.toString()
        ) {
          return;
        }

        setIncomingCall({
          callerId,
          offer,
        });

        setCallStatus(
          "incoming"
        );
      };

    // ====================================================
    // CALL ANSWERED
    // ====================================================

    const handleCallAnswered =
      async ({
        answer,
      }) => {
        try {
          if (
            !peerConnectionRef.current
          ) {
            return;
          }

          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

          setCallStatus(
            "connected"
          );
        } catch (error) {
          console.error(
            "Answer error:",
            error
          );
        }
      };

    // ====================================================
    // ICE
    // ====================================================

    const handleIceCandidate =
      async ({
        candidate,
      }) => {
        try {
          if (
            !peerConnectionRef.current ||
            !candidate
          ) {
            return;
          }

          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );
        } catch (error) {
          console.error(
            "ICE error:",
            error
          );
        }
      };

    // ====================================================
    // CALL REJECTED
    // ====================================================

    const handleCallRejected =
      () => {
        toast.info(
          "Call declined"
        );

        endCallCleanup();
      };

    // ====================================================
    // CALL ENDED
    // ====================================================

    const handleCallEnded =
      () => {
        toast.info(
          "Call ended"
        );

        endCallCleanup();
      };

    socket.on(
      "newMessage",
      handleNewMessage
    );

    socket.on(
      "messageUpdated",
      handleMessageUpdated
    );

    socket.on(
      "messageDeleted",
      handleMessageDeleted
    );

    socket.on(
      "userOnline",
      handleUserOnline
    );

    socket.on(
      "userOffline",
      handleUserOffline
    );

    socket.on(
      "userTyping",
      handleUserTyping
    );

    socket.on(
      "userStoppedTyping",
      handleUserStoppedTyping
    );

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    socket.on(
      "call-answered",
      handleCallAnswered
    );

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    socket.on(
      "call-rejected",
      handleCallRejected
    );

    socket.on(
      "call-ended",
      handleCallEnded
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );

      socket.off(
        "messageUpdated",
        handleMessageUpdated
      );

      socket.off(
        "messageDeleted",
        handleMessageDeleted
      );

      socket.off(
        "userOnline",
        handleUserOnline
      );

      socket.off(
        "userOffline",
        handleUserOffline
      );

      socket.off(
        "userTyping",
        handleUserTyping
      );

      socket.off(
        "userStoppedTyping",
        handleUserStoppedTyping
      );

      socket.off(
        "incoming-call",
        handleIncomingCall
      );

      socket.off(
        "call-answered",
        handleCallAnswered
      );

      socket.off(
        "ice-candidate",
        handleIceCandidate
      );

      socket.off(
        "call-rejected",
        handleCallRejected
      );

      socket.off(
        "call-ended",
        handleCallEnded
      );

      clearTimeout(
        typingTimeoutRef.current
      );
    };
  }, [
    userId,
    me?._id,
  ]);

  // ======================================================
  // TYPING
  // ======================================================

  const handleTyping = (
    e
  ) => {
    const value =
      e.target.value;

    setText(value);

    if (
      !me?._id ||
      !userId
    ) {
      return;
    }

    socket.emit(
      "typing",
      {
        senderId:
          me._id,

        receiverId:
          userId,
      }
    );

    clearTimeout(
      typingTimeoutRef.current
    );

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          "stopTyping",
          {
            senderId:
              me._id,

            receiverId:
              userId,
          }
        );
      }, 1000);
  };

  // ======================================================
  // SEND TEXT
  // ======================================================

  const handleSend = async (
    e
  ) => {
    e?.preventDefault();

    const value =
      text.trim();

    if (
      !value ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      // EDIT
      if (
        editingMessage
      ) {
        const res =
          await axios.put(
            `${API_URL}/api/chat/message/${editingMessage._id}`,
            {
              text: value,
            },
            {
              withCredentials: true,
            }
          );

        setMessages(
          (prev) =>
            prev.map(
              (msg) =>
                msg._id ===
                editingMessage._id
                  ? {
                      ...msg,
                      ...res.data
                        .data,
                    }
                  : msg
            )
        );

        setEditingMessage(
          null
        );

        setText("");

        return;
      }

      // NORMAL MESSAGE
      const res =
        await axios.post(
          `${API_URL}/api/chat/${userId}`,
          {
            text: value,

            orderId:
              orderId ||
              undefined,
          },
          {
            withCredentials: true,
          }
        );

      setMessages(
        (prev) => [
          ...prev,
          res.data.data,
        ]
      );

      setText("");

      socket.emit(
        "stopTyping",
        {
          senderId:
            me._id,

          receiverId:
            userId,
        }
      );
    } catch (error) {
      console.error(
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Failed to send"
      );
    } finally {
      setSending(false);
    }
  };

  // ======================================================
  // COPY
  // ======================================================

  const handleCopy = async (
    message
  ) => {
    try {
      await navigator.clipboard.writeText(
        message.text || ""
      );

      Swal.fire({
        icon: "success",
        title: "success",
        text:  "Message copied",
        timer: 1200,
      showConfirmButton: false,
      });

      setOpenMenu(null);
    } catch {
      toast.error(
        "Could not copy message"
      );
    }
  };

  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (
    message
  ) => {
    setEditingMessage(
      message
    );

    setText(
      message.text || ""
    );

    setOpenMenu(null);
  };

  const cancelEdit = () => {
    setEditingMessage(
      null
    );

    setText("");
  };

  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete = async (
    messageId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this message?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/chat/message/${messageId}`,
        {
          withCredentials: true,
        }
      );

      setMessages(
        (prev) =>
          prev.filter(
            (msg) =>
              msg._id !==
              messageId
          )
      );

      setOpenMenu(null);

      toast.success(
        "Message deleted"
      );
    } catch (error) {
      toast.error(
        error.response?.data
          ?.message ||
          "Failed to delete message"
      );
    }
  };

  // ======================================================
  // RECORD VOICE MESSAGE
  // ======================================================

  const startRecording =
    async () => {
      try {
        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          toast.error(
            "Voice recording is not supported"
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        const recorder =
          new MediaRecorder(
            stream
          );

        mediaRecorderRef.current =
          recorder;

        audioChunksRef.current =
          [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data.size >
              0
            ) {
              audioChunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop =
          () => {
            const blob =
              new Blob(
                audioChunksRef.current,
                {
                  type:
                    recorder.mimeType ||
                    "audio/webm",
                }
              );

            const url =
              URL.createObjectURL(
                blob
              );

            setAudioBlob(
              blob
            );

            setAudioUrl(
              url
            );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );
          };

        recorder.start();

        setIsRecording(
          true
        );

        setRecordingTime(
          0
        );

        recordingTimerRef.current =
          setInterval(() => {
            setRecordingTime(
              (prev) =>
                prev + 1
            );
          }, 1000);
      } catch (error) {
        console.error(
          error
        );

        toast.error(
          "Microphone permission is required"
        );
      }
    };

  const stopRecording =
    () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !==
          "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      clearInterval(
        recordingTimerRef.current
      );

      setIsRecording(
        false
      );
    };

  const cancelAudio =
    () => {
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);
    };

  // ======================================================
  // SEND VOICE MESSAGE
  // ======================================================

  const sendAudio =
    async () => {
      if (
        !audioBlob ||
        isSendingAudio
      ) {
        return;
      }

      try {
        setIsSendingAudio(
          true
        );

        const formData =
          new FormData();

        formData.append(
          "audio",
          audioBlob,
          `voice-${Date.now()}.webm`
        );

        const res =
          await axios.post(
            `${API_URL}/api/chat/${userId}/voice`,
            formData,
            {
              withCredentials: true,
            }
          );

        setMessages(
          (prev) => [
            ...prev,
            res.data.data,
          ]
        );

        cancelAudio();
      } catch (error) {
        console.error(
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Failed to send voice message"
        );
      } finally {
        setIsSendingAudio(
          false
        );
      }
    };

  // ======================================================
  // FILE SELECT
  // ======================================================

  const handleFileSelect =
    async (
      e
    ) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      // 15MB limit
      if (
        file.size >
        15 * 1024 * 1024
      ) {
        toast.error(
          "File must be smaller than 15MB"
        );

        e.target.value =
          "";

        return;
      }

      try {
        setIsSendingFile(
          true
        );

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const res =
          await axios.post(
            `${API_URL}/api/chat/${userId}/file`,
            formData,
            {
              withCredentials: true,
            }
          );

        setMessages(
          (prev) => [
            ...prev,
            res.data.data,
          ]
        );

        toast.success(
          "File sent"
        );
      } catch (error) {
        console.error(
          "File error:",
          error
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Failed to send file"
        );
      } finally {
        setIsSendingFile(
          false
        );

        e.target.value =
          "";
      }
    };

  // ======================================================
  // WEBRTC
  // ======================================================

  const createPeerConnection =
    () => {
      const peer =
        new RTCPeerConnection({
          iceServers: [
            {
              urls:
                "stun:stun.l.google.com:19302",
            },

            {
              urls:
                "stun:stun1.l.google.com:19302",
            },
          ],
        });

      peer.onicecandidate =
        (event) => {
          if (
            event.candidate
          ) {
            socket.emit(
              "ice-candidate",
              {
                receiverId:
                  userId,

                candidate:
                  event.candidate,
              }
            );
          }
        };

      peer.ontrack =
        (event) => {
          const stream =
            event.streams?.[0];

          if (
            stream &&
            remoteAudioRef.current
          ) {
            remoteAudioRef.current.srcObject =
              stream;

            remoteAudioRef.current
              .play()
              .catch(
                () => {}
              );
          }
        };

      peer.onconnectionstatechange =
        () => {
          const state =
            peer.connectionState;

          if (
            state ===
              "connected"
          ) {
            setCallStatus(
              "connected"
            );
          }

          if (
            state ===
              "failed" ||
            state ===
              "disconnected" ||
            state ===
              "closed"
          ) {
            endCallCleanup();
          }
        };

      peerConnectionRef.current =
        peer;

      return peer;
    };

  // ======================================================
  // START CALL
  // ======================================================

  const startCall =
    async () => {
      try {
        if (
          callStatus !==
          "idle"
        ) {
          return;
        }

        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          toast.error(
            "Voice calling is not supported by this browser"
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        localStreamRef.current =
          stream;

        const peer =
          createPeerConnection();

        stream
          .getTracks()
          .forEach(
            (track) => {
              peer.addTrack(
                track,
                stream
              );
            }
          );

        const offer =
          await peer.createOffer();

        await peer.setLocalDescription(
          offer
        );

        socket.emit(
          "call-user",
          {
            receiverId:
              userId,

            callerId:
              me._id,

            offer,
          }
        );

        setCallStatus(
          "calling"
        );
      } catch (error) {
        console.error(
          "Start call error:",
          error
        );

        endCallCleanup();

        toast.error(
          "Could not start call"
        );
      }
    };

  // ======================================================
  // ACCEPT CALL
  // ======================================================

  const acceptCall =
    async () => {
      try {
        if (
          !incomingCall
        ) {
          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        localStreamRef.current =
          stream;

        const peer =
          createPeerConnection();

        stream
          .getTracks()
          .forEach(
            (track) => {
              peer.addTrack(
                track,
                stream
              );
            }
          );

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            incomingCall.offer
          )
        );

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        socket.emit(
          "answer-call",
          {
            callerId:
              incomingCall.callerId,

            answer,
          }
        );

        setIncomingCall(
          null
        );

        setCallStatus(
          "connected"
        );
      } catch (error) {
        console.error(
          "Accept call error:",
          error
        );

        endCallCleanup();

        toast.error(
          "Could not accept call"
        );
      }
    };

  // ======================================================
  // REJECT CALL
  // ======================================================

  const rejectCall =
    () => {
      if (
        incomingCall
      ) {
        socket.emit(
          "reject-call",
          {
            callerId:
              incomingCall.callerId,
          }
        );
      }

      setIncomingCall(
        null
      );

      setCallStatus(
        "idle"
      );
    };

  // ======================================================
  // MUTE
  // ======================================================

  const toggleMute =
    () => {
      const stream =
        localStreamRef.current;

      if (!stream) {
        return;
      }

      stream
        .getAudioTracks()
        .forEach(
          (track) => {
            track.enabled =
              !track.enabled;
          }
        );

      setIsMuted(
        (prev) => !prev
      );
    };

  // ======================================================
  // END CALL
  // ======================================================

  const endCall =
    () => {
      socket.emit(
        "end-call",
        {
          receiverId:
            userId,
        }
      );

      endCallCleanup();
    };

  // ======================================================
  // CLEANUP CALL
  // ======================================================

  const endCallCleanup =
    () => {
      if (
        peerConnectionRef.current
      ) {
        peerConnectionRef.current.close();

        peerConnectionRef.current =
          null;
      }

      if (
        localStreamRef.current
      ) {
        localStreamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        localStreamRef.current =
          null;
      }

      if (
        remoteAudioRef.current
      ) {
        remoteAudioRef.current.srcObject =
          null;
      }

      setIncomingCall(
        null
      );

      setCallStatus(
        "idle"
      );

      setIsMuted(
        false
      );
    };

  // ======================================================
  // FORMAT TIME
  // ======================================================

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // RECORDING TIME
  // ======================================================

  const formatRecordingTime =
    (
      seconds
    ) => {
      const mins =
        Math.floor(
          seconds / 60
        );

      const secs =
        seconds % 60;

      return `${mins
        .toString()
        .padStart(
          2,
          "0"
        )}:${secs
        .toString()
        .padStart(
          2,
          "0"
        )}`;
    };

  // ======================================================
  // FILE SIZE
  // ======================================================

  const formatFileSize =
    (
      bytes
    ) => {
      if (!bytes) {
        return "";
      }

      if (
        bytes <
        1024
      ) {
        return `${bytes} B`;
      }

      if (
        bytes <
        1024 *
          1024
      ) {
        return `${(
          bytes / 1024
        ).toFixed(1)} KB`;
      }

      return `${(
        bytes /
        (1024 *
          1024)
      ).toFixed(1)} MB`;
    };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <PageLoader />
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">

        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">

          <button
            onClick={() =>
              navigate(-1)
            }
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft
              size={20}
            />
          </button>

          <button
            onClick={() =>
              navigate(
                `/profile/${otherUser?._id}`
              )
            }
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
          >

            <div className="relative">

              <img
                src={
                  otherUser?.profileImage ||
                  studySpher
                }
                alt={
                  otherUser?.full_name ||
                  "Student"
                }
                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
              />

              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}

            </div>

            <div className="min-w-0">

              <p className="font-semibold text-gray-900 truncate">
                {otherUser?.full_name ||
                  "Student"}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {otherUser?.department ||
                  "Student Connect"}
              </p>

              <p className="text-xs">

                {isTyping ? (
                  <span className="text-indigo-500 font-medium">
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-green-500">
                    Active now
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Offline
                  </span>
                )}

              </p>

            </div>

          </button>

          {/* CALL BUTTON */}

          <button
            type="button"
            onClick={
              startCall
            }
            disabled={
              callStatus !==
              "idle"
            }
            className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 disabled:opacity-50"
          >
            <Phone
              size={19}
            />
          </button>

        </div>

        {orderId && (
          <div className="max-w-2xl mx-auto px-4 pb-2">

            <p className="text-[11px] text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl inline-block">
              Chat linked to market order
            </p>

          </div>
        )}

      </header>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <div className="flex-1 overflow-y-auto">

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">
                No messages yet. Say hello 👋
              </p>
            </div>
          )}

          {messages.map(
            (
              msg
            ) => {

              const isMine =
                msg.sender?._id?.toString() ===
                  me?._id?.toString() ||
                msg.sender?.toString() ===
                  me?._id?.toString();

              const isAudio =
                msg.type ===
                  "audio" ||
                msg.audioUrl;

              const isFile =
                msg.type ===
                  "file" ||
                msg.fileUrl;

              const isImage =
                isFile &&
                msg.fileType?.startsWith(
                  "image/"
                );

              return (
                <div
                  key={
                    msg._id
                  }
                  className={`flex ${
                    isMine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div className="relative group max-w-[85%] sm:max-w-[70%]">

                    {/* BUBBLE */}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
                      }`}
                    >

                      {/* AUDIO */}

                      {isAudio ? (
                        <audio
                          controls
                          src={
                            msg.audioUrl
                          }
                          className="max-w-full"
                        />
                      ) : isFile ? (

                        <div className="space-y-2">

                          {isImage ? (
                            <a
                              href={
                                msg.fileUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={
                                  msg.fileUrl
                                }
                                alt={
                                  msg.fileName ||
                                  "Image"
                                }
                                className="max-w-full max-h-72 rounded-xl object-cover"
                              />
                            </a>
                          ) : (
                            <a
                              href={
                                msg.fileUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-xl ${
                                isMine
                                  ? "bg-indigo-500"
                                  : "bg-gray-50"
                              }`}
                            >

                              <FileText
                                size={
                                  24
                                }
                              />

                              <div className="min-w-0 flex-1">

                                <p className="font-medium truncate">
                                  {msg.fileName ||
                                    "File"}
                                </p>

                                <p className={`text-xs ${
                                  isMine
                                    ? "text-indigo-100"
                                    : "text-gray-500"
                                }`}>
                                  {formatFileSize(
                                    msg.fileSize
                                  )}
                                </p>

                              </div>

                              <Download
                                size={
                                  18
                                }
                              />

                            </a>
                          )}

                        </div>

                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 mt-1">

                        {msg.edited && (
                          <span
                            className={`text-[9px] ${
                              isMine
                                ? "text-indigo-200"
                                : "text-gray-400"
                            }`}
                          >
                            edited
                          </span>
                        )}

                        <p
                          className={`text-[10px] ${
                            isMine
                              ? "text-indigo-200"
                              : "text-gray-400"
                          }`}
                        >
                          {formatTime(
                            msg.createdAt
                          )}
                        </p>

                      </div>

                    </div>

                    {/* MENU BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu ===
                            msg._id
                            ? null
                            : msg._id
                        )
                      }
                      className={`absolute top-1/2 -translate-y-1/2 ${
                        isMine
                          ? "-left-10"
                          : "-right-10"
                      } w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500`}
                    >
                      <MoreVertical
                        size={
                          16
                        }
                      />
                    </button>

                    {/* MENU */}

                    {openMenu ===
                      msg._id && (
                      <div
                        className={`absolute z-30 top-10 ${
                          isMine
                            ? "right-0"
                            : "left-0"
                        } w-40 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden`}
                      >

                        {/* COPY */}

                        {!isAudio &&
                          !isFile && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  msg
                                )
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Copy
                                size={
                                  16
                                }
                              />
                              Copy
                            </button>
                          )}

                        {/* EDIT */}

                        {isMine &&
                          !isAudio &&
                          !isFile && (
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  msg
                                )
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit3
                                size={
                                  16
                                }
                              />
                              Edit
                            </button>
                          )}

                        {/* DELETE */}

                        {isMine && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                msg._id
                              )
                            }
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2
                              size={
                                16
                              }
                            />
                            Delete
                          </button>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              );
            }
          )}

          {/* TYPING */}

          {isTyping && (
            <div className="flex justify-start">

              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">

                <div className="flex items-center gap-1">

                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />

                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{
                      animationDelay:
                        "0.15s",
                    }}
                  />

                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{
                      animationDelay:
                        "0.3s",
                    }}
                  />

                </div>

              </div>

            </div>
          )}

          <div
            ref={
              bottomRef
            }
          />

        </div>

      </div>

      {/* =================================================
          INCOMING CALL
      ================================================= */}

      {callStatus ===
        "incoming" && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">

          <div className="bg-white rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl">

            <img
              src={
                otherUser?.profileImage ||
                studySpher
              }
              alt="Caller"
              className="w-24 h-24 mx-auto rounded-full object-cover"
            />

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              {otherUser?.full_name ||
                "Student"}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Incoming voice call
            </p>

            <div className="flex justify-center gap-5 mt-7">

              <button
                type="button"
                onClick={
                  rejectCall
                }
                className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center"
              >
                <PhoneOff
                  size={
                    22
                  }
                />
              </button>

              <button
                type="button"
                onClick={
                  acceptCall
                }
                className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center"
              >
                <Phone
                  size={
                    22
                  }
                />
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          CALLING / CONNECTED
      ================================================= */}

      {(
        callStatus ===
          "calling" ||
        callStatus ===
          "connected"
      ) && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">

          <div className="bg-white rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl">

            <img
              src={
                otherUser?.profileImage ||
                studySpher
              }
              alt="Student"
              className="w-24 h-24 mx-auto rounded-full object-cover"
            />

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              {otherUser?.full_name ||
                "Student"}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {callStatus ===
              "calling"
                ? "Calling..."
                : "Connected"}
            </p>

            <div className="flex justify-center gap-4 mt-8">

              {callStatus ===
                "connected" && (
                <button
                  type="button"
                  onClick={
                    toggleMute
                  }
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isMuted
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isMuted ? (
                    <MicOff
                      size={
                        21
                      }
                    />
                  ) : (
                    <Mic
                      size={
                        21
                      }
                    />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={
                  endCall
                }
                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <PhoneOff
                  size={
                    21
                  }
                />
              </button>

            </div>

          </div>

        </div>
      )}

      {/* REMOTE AUDIO */}

      <audio
        ref={
          remoteAudioRef
        }
        autoPlay
        playsInline
        className="hidden"
      />

      {/* =================================================
          AUDIO PREVIEW
      ================================================= */}

      {audioUrl && (
        <div className="bg-indigo-50 border-t border-indigo-100">

          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">

            <button
              type="button"
              onClick={
                cancelAudio
              }
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm"
            >
              <X
                size={
                  18
                }
              />
            </button>

            <audio
              controls
              src={
                audioUrl
              }
              className="flex-1 h-10"
            />

            <button
              type="button"
              onClick={
                sendAudio
              }
              disabled={
                isSendingAudio
              }
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50"
            >
              {isSendingAudio ? (
                <Loader2
                  size={
                    18
                  }
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={
                    18
                  }
                />
              )}
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          INPUT
      ================================================= */}

      <div className="sticky bottom-0 bg-white border-t border-gray-100">

        <form
          onSubmit={
            handleSend
          }
          className="max-w-2xl mx-auto px-4 py-3"
        >

          {/* EDIT BAR */}

          {editingMessage && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 bg-indigo-50 rounded-xl">

              <div className="flex items-center gap-2">

                <Edit3
                  size={
                    15
                  }
                  className="text-indigo-600"
                />

                <span className="text-xs text-indigo-700">
                  Editing message
                </span>

              </div>

              <button
                type="button"
                onClick={
                  cancelEdit
                }
                className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-600"
              >
                <X
                  size={
                    16
                  }
                />
              </button>

            </div>
          )}

          {/* RECORDING */}

          {isRecording ? (
            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={
                  stopRecording
                }
                className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center"
              >
                <Square
                  size={
                    18
                  }
                  fill="currentColor"
                />
              </button>

              <div className="flex-1 bg-red-50 rounded-2xl px-4 py-3">

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />

                  <span className="text-sm font-medium text-red-600">
                    Recording
                  </span>

                  <span className="text-sm text-red-500 ml-auto">
                    {formatRecordingTime(
                      recordingTime
                    )}
                  </span>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  stopRecording();

                  setTimeout(
                    cancelAudio,
                    100
                  );
                }}
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center"
              >
                <X
                  size={
                    18
                  }
                />
              </button>

            </div>
          ) : (

            <div className="flex items-center gap-2">

              {/* PLUS */}

              {!editingMessage && (
                <>
                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    hidden
                    onChange={
                      handleFileSelect
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isSendingFile
                    }
                    className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 shrink-0"
                  >
                    {isSendingFile ? (
                      <Loader2
                        size={
                          19
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Plus
                        size={
                          21
                        }
                      />
                    )}
                  </button>
                </>
              )}

              {/* TEXT */}

              <input
                type="text"
                value={
                  text
                }
                onChange={
                  handleTyping
                }
                placeholder={
                  editingMessage
                    ? "Edit message..."
                    : "Type a message..."
                }
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />

              {/* MICROPHONE */}

              {!text.trim() &&
                !editingMessage && (
                  <button
                    type="button"
                    onClick={
                      startRecording
                    }
                    className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 shrink-0"
                  >
                    <Mic
                      size={
                        20
                      }
                    />
                  </button>
                )}

              {/* SEND */}

              {(text.trim() ||
                editingMessage) && (
                <button
                  type="submit"
                  disabled={
                    sending ||
                    !text.trim()
                  }
                  className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                >
                  {sending ? (
                    <Loader2
                      size={
                        18
                      }
                      className="animate-spin"
                    />
                  ) : editingMessage ? (
                    <Check
                      size={
                        18
                      }
                    />
                  ) : (
                    <Send
                      size={
                        18
                      }
                    />
                  )}
                </button>
              )}

            </div>
          )}

        </form>

      </div>

    </div>
  );
}