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
  FileText,
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
import Swal from "sweetalert2";

// ======================================================
// GLOBAL CALL SYSTEM
// ======================================================
//
// IMPORTANT:
//
// ChatPage no longer contains any WebRTC code.
//
// All calling logic is handled by CallProvider:
// - WebRTC
// - microphone for calls
// - incoming calls
// - accepting calls
// - rejecting calls
// - mute
// - remote audio
// - call cleanup
//
// ChatPage only uses startCall() to start a call.
// ======================================================

import { useCall } from "../CallProvider";

export default function ChatPage() {
  const { userId } = useParams();

  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");

  const navigate = useNavigate();

  // ======================================================
  // GLOBAL CALL CONTEXT
  // ======================================================
  //
  // CallProvider is mounted globally in main.jsx.
  //
  // ChatPage does NOT create RTCPeerConnection.
  // ChatPage does NOT listen for WebRTC events.
  // ChatPage does NOT manage microphone streams.
  //
  // It only tells CallProvider:
  //
  // "Call this user."
  //
  // ======================================================

  const {
    callStatus,
    startCall,
  } = useCall();

  // ======================================================
  // STATES
  // ======================================================

  // Other student's profile information
  const [otherUser, setOtherUser] = useState(null);
  // Chat messages
  const [messages, setMessages] = useState([]);
  // Text input
  const [text, setText] = useState("");
  // Page loading state
  const [loading, setLoading] = useState(true);
  // Sending text message
  const [sending, setSending] = useState(false);
  // Current logged-in user
  const [me, setMe] = useState(null);
  // Other user online status
  const [isOnline, setIsOnline] = useState(false);
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);

  // EDITING
  const [editingMessage, setEditingMessage] =
    useState(null);
  // ======================================================
  // MESSAGE MENU
  // ======================================================
  const [openMenu, setOpenMenu] = useState(null);
  // ======================================================
  // VOICE MESSAGE RECORDING
  // ======================================================
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

  // ======================================================
  // FILE UPLOAD
  // ======================================================
  const [isSendingFile, setIsSendingFile] =
    useState(false);

  // ======================================================
  // REFS
  // ======================================================

  // Used to automatically scroll to the latest message
  const bottomRef = useRef(null);

  // Used by the typing indicator timeout
  const typingTimeoutRef = useRef(null);

  // MediaRecorder instance for voice messages
  const mediaRecorderRef = useRef(null);

  // Stores voice recording chunks
  const audioChunksRef = useRef([]);

  // Recording timer
  const recordingTimerRef = useRef(null);

  // Hidden file input
  const fileInputRef = useRef(null);

  // ======================================================
  // IMPORTANT
  // ======================================================
  // There are intentionally NO WebRTC refs here.
  //
  // Do NOT add:
  //
  // RTCPeerConnection
  // peerConnectionRef
  // localStreamRef
  // remoteAudioRef
  // pendingCandidatesRef
  //
  // Those belong inside CallProvider.6

  // ======================================================
  // LINK RENDERING
  // ======================================================
  const renderTextWithLinks = (
    messageText
  ) => {
    if (!messageText) {
      return null;
    }

    const urlRegex =
      /((https?:\/\/|www\.)[^\s<]+)/gi;

    const parts =
      messageText.split(urlRegex);

    const result = [];

    let index = 0;

    while (index < parts.length) {
      const part = parts[index];

      if (!part) {
        index++;
        continue;
      }

      const isUrl =
        /^https?:\/\//i.test(part) ||
        /^www\./i.test(part);

      if (isUrl) {
        let url = part;

        // Remove punctuation from the end
        // so punctuation does not become part
        // of the clickable URL.
        let trailing = "";

        while (
          /[.,!?;:)\]}>'"]$/.test(url)
        ) {
          trailing =
            url.slice(-1) + trailing;

          url = url.slice(0, -1);
        }

        const href =
          /^https?:\/\//i.test(url)
            ? url
            : `https://${url}`;

        result.push(
          <React.Fragment
            key={`link-${index}`}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all text-indigo-200 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {url}
            </a>

            {trailing}
          </React.Fragment>
        );
      } else {
        result.push(
          <React.Fragment
            key={`text-${index}`}
          >
            {part}
          </React.Fragment>
        );
      }

      index++;
    }

    return result;
  };

  // ======================================================
  // FETCH CHAT
  // ======================================================

  const fetchChat = async () => {
    try {
      // Fetch:
      // 1. Current conversation
      // 2. Current logged-in user
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

  // ======================================================
  // LOAD CHAT WHEN USER CHANGES
  // ======================================================

  useEffect(() => {
    if (!userId) {
      return;
    }

    setLoading(true);

    fetchChat();
  }, [userId]);

  // ======================================================
  // SCROLL TO BOTTOM
  // ======================================================

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [
    messages,
    isTyping,
  ]);

  // ======================================================
  // ADD MESSAGE WITHOUT DUPLICATE
  // ======================================================
  //
  // Socket.IO may send a message that we already
  // added immediately after the POST request.
  //
  // This prevents the same message from appearing twice.
  //
  // ======================================================

  const addMessageWithoutDuplicate = (
    newMessage
  ) => {
    if (!newMessage?._id) {
      return;
    }

    setMessages((prev) => {
      const exists = prev.some(
        (msg) =>
          msg._id === newMessage._id
      );

      if (exists) {
        return prev;
      }

      return [
        ...prev,
        newMessage,
      ];
    });
  };

  // ======================================================
  // SOCKET.IO - CHAT ONLY
  // ======================================================
  //
  // This effect handles:
  //
  // - New messages
  // - Message updates
  // - Message deletion
  // - Online status
  // - Offline status
  // - Typing
  //
  // It does NOT handle calls.
  //
  // Call Socket.IO events belong to CallProvider.
  //
  // ======================================================

  useEffect(() => {
    if (
      !userId ||
      !me?._id
    ) {
      return;
    }

    // Make sure the shared socket is connected.
    socket.connect();

    // Join the user's personal room.
    socket.emit(
      "join",
      me._id
    );

    // ====================================================
    // ONLINE USERS
    // ====================================================

    const handleOnlineUsers = (
      onlineUsers
    ) => {
      const isUserOnline =
        onlineUsers?.some(
          (id) =>
            id.toString() ===
            userId.toString()
        );

      setIsOnline(
        Boolean(isUserOnline)
      );
    };

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

      // Make sure this message belongs
      // to the currently open conversation.
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

      addMessageWithoutDuplicate(
        message
      );
    };

    // ====================================================
    // MESSAGE UPDATED
    // ====================================================

    const handleMessageUpdated =
      (message) => {
        if (!message?._id) {
          return;
        }

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
    // USER ONLINE
    // ====================================================

    const handleUserOnline =
      (onlineUserId) => {
        if (
          onlineUserId?.toString() ===
          userId.toString()
        ) {
          setIsOnline(true);
        }
      };

    // ====================================================
    // USER OFFLINE
    // ====================================================

    const handleUserOffline =
      (offlineUserId) => {
        if (
          offlineUserId?.toString() ===
          userId.toString()
        ) {
          setIsOnline(false);
        }
      };

    // ====================================================
    // USER TYPING
    // ====================================================

    const handleUserTyping =
      ({
        senderId,
      }) => {
        if (
          senderId?.toString() ===
          userId.toString()
        ) {
          setIsTyping(true);
        }
      };

    // ====================================================
    // USER STOPPED TYPING
    // ====================================================

    const handleUserStoppedTyping =
      ({
        senderId,
      }) => {
        if (
          senderId?.toString() ===
          userId.toString()
        ) {
          setIsTyping(false);
        }
      };

    // ====================================================
    // REGISTER CHAT SOCKET LISTENERS
    // ====================================================

    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

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

    // ====================================================
    // CLEANUP SOCKET LISTENERS
    // ====================================================

    return () => {
      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

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

    // Tell the other user that
    // we are currently typing.
    socket.emit(
      "typing",
      {
        senderId:
          me._id,

        receiverId:
          userId,
      }
    );

    // Reset the previous timeout.
    clearTimeout(
      typingTimeoutRef.current
    );

    // If the user stops typing for 1 second,
    // tell the other user that typing has stopped.
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
  // SEND TEXT MESSAGE
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

      // ==================================================
      // EDIT EXISTING MESSAGE
      // ==================================================

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

        const updatedMessage =
          res.data.data;

        setMessages(
          (prev) =>
            prev.map(
              (msg) =>
                msg._id ===
                editingMessage._id
                  ? updatedMessage
                  : msg
            )
        );

        setEditingMessage(
          null
        );

        setText("");

        // Tell the other user
        // typing has stopped.
        socket.emit(
          "stopTyping",
          {
            senderId:
              me._id,

            receiverId:
              userId,
          }
        );

        return;
      }

      // ==================================================
      // SEND NORMAL MESSAGE
      // ==================================================
      const res =
        await axios.post(
          `${API_URL}/api/chat/${userId}`,
          {
            text: value,

            // Include market order ID
            // when this chat came from an order.
            orderId:
              orderId ||
              undefined,
          },
          {
            withCredentials: true,
          }
        );

      // Add the message immediately.
      addMessageWithoutDuplicate(
        res.data.data
      );

      // Clear input.
      setText("");

      // Stop typing indicator.
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
        "Send message error:",
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
  // COPY MESSAGE
  // ======================================================
  const handleCopy = async (
    message
  ) => {
    try {
      await navigator.clipboard.writeText(
        message.text || ""
      );
      await Swal.fire({
        icon: "success",
        title: "Copied",
        text: "Message copied",
        timer: 1200,
        showConfirmButton: false,
      });
      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      toast.error(
        "Could not copy message"
      );
    }
  };

  // ======================================================
  // START EDITING MESSAGE
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

  // ======================================================
  // CANCEL EDIT
  // ======================================================
  const cancelEdit = () => {
    setEditingMessage(
      null
    );

    setText("");
  };

  // ======================================================
  // DELETE MESSAGE
  // ======================================================
  const handleDelete = async (
    messageId
  ) => {
    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete message?",
        text: "This message will be removed.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
      });

    if (!result.isConfirmed) {
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
      console.error(
        "Delete error:",
        error
      );

      toast.error(
        error.response?.data
          ?.message ||
          "Failed to delete message"
      );
    }
  };

  // ======================================================
  // START VOICE MESSAGE RECORDING
  // ======================================================
  // IMPORTANT:
  //
  // This is NOT WebRTC calling.
  //
  // MediaRecorder is being used only to create
  // a voice message that can be uploaded to Supabase.
  // ======================================================

  const startRecording =
    async () => {
      try {
        // Check browser microphone support.
        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          toast.error(
            "Voice recording is not supported"
          );

          return;
        }

        // Check MediaRecorder support.
        if (
          !window.MediaRecorder
        ) {
          toast.error(
            "Voice recording is not supported by this browser"
          );

          return;
        }

        // Ask for microphone access.
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        // Choose a supported audio format.
        let mimeType =
          "audio/webm";

        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {
          mimeType =
            "audio/webm;codecs=opus";
        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {
          mimeType =
            "audio/webm";
        }

        // Create MediaRecorder.
        const recorder =
          new MediaRecorder(
            stream,
            {
              mimeType,
            }
          );

        mediaRecorderRef.current =
          recorder;

        // Clear previous chunks.
        audioChunksRef.current =
          [];

        // ==================================================
        // AUDIO DATA
        // ==================================================

        recorder.ondataavailable =
          (event) => {
            if (
              event.data &&
              event.data.size > 0
            ) {
              audioChunksRef.current.push(
                event.data
              );
            }
          };

        // ==================================================
        // RECORDING STOPPED
        // ==================================================

        recorder.onstop =
          () => {
            if (
              audioChunksRef.current
                .length === 0
            ) {
              stream
                .getTracks()
                .forEach(
                  (track) =>
                    track.stop()
                );

              return;
            }

            // Combine all audio chunks into one Blob.
            const blob =
              new Blob(
                audioChunksRef.current,
                {
                  type:
                    recorder.mimeType ||
                    "audio/webm",
                }
              );

            // Create a local preview URL.
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

            // Stop microphone after recording.
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            mediaRecorderRef.current =
              null;
          };

        // ==================================================
        // RECORDING ERROR
        // ==================================================

        recorder.onerror =
          (event) => {
            console.error(
              "Recorder error:",
              event
            );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            setIsRecording(
              false
            );

            toast.error(
              "Voice recording failed"
            );
          };

        // Start recording.
        recorder.start();

        setIsRecording(
          true
        );

        setRecordingTime(
          0
        );

        // Start timer.
        recordingTimerRef.current =
          setInterval(() => {
            setRecordingTime(
              (prev) =>
                prev + 1
            );
          }, 1000);
      } catch (error) {
        console.error(
          "Recording error:",
          error
        );

        toast.error(
          "Microphone permission is required"
        );
      }
    };

  // ======================================================
  // STOP VOICE RECORDING
  // ======================================================

  const stopRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        recorder.stop();
      }

      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        null;

      setIsRecording(
        false
      );
    };

  // ======================================================
  // CANCEL RECORDING COMPLETELY
  // ======================================================

  const cancelRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        // Remove callbacks so that
        // a cancelled recording does not
        // create an audio preview.
        recorder.ondataavailable =
          null;

        recorder.onstop =
          null;

        recorder.stop();
      }

      clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        null;

      audioChunksRef.current =
        [];

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioUrl(null);

      setAudioBlob(null);

      setRecordingTime(
        0
      );

      setIsRecording(
        false
      );

      mediaRecorderRef.current =
        null;
    };

  // ======================================================
  // CANCEL AUDIO PREVIEW
  // ======================================================

  const cancelAudio =
    () => {
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioUrl(null);

      setAudioBlob(null);

      setRecordingTime(
        0
      );

      audioChunksRef.current =
        [];
    };

  // ======================================================
  // SEND VOICE MESSAGE
  // ======================================================
  //
  // This uploads the recorded audio to:
  //
  // POST /api/chat/:userId/voice
  //
  // It is separate from WebRTC calling.
  //
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

        addMessageWithoutDuplicate(
          res.data.data
        );

        // Clear audio preview after successful upload.
        cancelAudio();
      } catch (error) {
        console.error(
          "Voice send error:",
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

      // Maximum file size:
      // 50MB
      if (
        file.size >
        50 * 1024 * 1024
      ) {
        toast.error(
          "File must be smaller than 50MB"
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

        addMessageWithoutDuplicate(
          res.data.data
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

        // Reset input so the same file
        // can be selected again later.
        e.target.value =
          "";
      }
    };

  // ======================================================
  // COMPONENT CLEANUP
  // ======================================================
  //
  // Clean up:
  // - typing timer
  // - recording timer
  // - MediaRecorder
  // - audio preview URL
  //
  // Notice there is NO WebRTC cleanup here.
  //
  // CallProvider owns WebRTC cleanup.
  //
  // ======================================================

  useEffect(() => {
    return () => {
      clearTimeout(
        typingTimeoutRef.current
      );

      clearInterval(
        recordingTimerRef.current
      );

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !==
          "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, []);

  // ======================================================
  // FORMAT MESSAGE TIME
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
  // FORMAT RECORDING TIME
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
  // FORMAT FILE SIZE
  // ======================================================

  const formatFileSize =
    (
      bytes
    ) => {
      if (
        bytes === null ||
        bytes === undefined
      ) {
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

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft
              size={20}
            />
          </button>

          {/* OTHER USER */}

          <button
            type="button"
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

              {/* Online indicator */}

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

          {/* =================================================
              VOICE CALL BUTTON
          =================================================
          The actual call is handled by CallProvider.
          We only pass the ID of the person we want
          to call.
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              startCall(userId)
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

        {/* MARKET ORDER INDICATOR */}

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

          {/* EMPTY CHAT */}

          {messages.length === 0 && (
            <div className="text-center py-16">

              <p className="text-gray-500 text-sm">
                No messages yet. Say hello 👋
              </p>

            </div>
          )}

          {/* MESSAGE LIST */}

          {messages.map(
            (
              msg
            ) => {

              // Determine whether this message
              // belongs to the current user.
              const isMine =
                msg.sender?._id?.toString() ===
                  me?._id?.toString() ||
                msg.sender?.toString() ===
                  me?._id?.toString();

              // Determine message type.
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

                    {/* =================================================
                        MESSAGE BUBBLE
                    ================================================= */}

                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
                      }`}
                    >

                      {/* =================================================
                          AUDIO MESSAGE
                      ================================================= */}

                      {isAudio ? (
                        <audio
                          controls
                          src={
                            msg.audioUrl
                          }
                          className="max-w-full"
                        />
                      ) : isFile ? (

                        /* =================================================
                           FILE MESSAGE
                        ================================================= */

                        <div className="space-y-2">

                          {/* IMAGE */}

                          {isImage ? (
                            <a
                              href={
                                msg.fileUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
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

                            /* OTHER FILE */

                            <a
                              href={
                                msg.fileUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
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

                                <p
                                  className={`text-xs ${
                                    isMine
                                      ? "text-indigo-100"
                                      : "text-gray-500"
                                  }`}
                                >
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

                        /* =================================================
                           NORMAL TEXT MESSAGE
                        ================================================= */

                        <p className="whitespace-pre-wrap break-words">
                          {renderTextWithLinks(
                            msg.text
                          )}
                        </p>

                      )}

                      {/* =================================================
                          MESSAGE META
                      ================================================= */}

                      <div className="flex items-center justify-end gap-2 mt-1">

                        {/* Edited indicator */}

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

                        {/* Message time */}

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

                    {/* =================================================
                        MESSAGE MENU BUTTON
                    ================================================= */}

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

                    {/* =================================================
                        MESSAGE MENU
                    ================================================= */}

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

          {/* =================================================
              TYPING INDICATOR
          ================================================= */}

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

          {/* Scroll target */}

          <div
            ref={
              bottomRef
            }
          />

        </div>

      </div>

      {/* =================================================
          AUDIO MESSAGE PREVIEW
      ================================================= */}

      {audioUrl && (
        <div className="bg-indigo-50 border-t border-indigo-100">

          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">

            {/* Cancel preview */}

            <button
              type="button"
              onClick={
                cancelAudio
              }
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm shrink-0"
            >
              <X
                size={
                  18
                }
              />
            </button>

            {/* Preview audio */}

            <audio
              controls
              src={
                audioUrl
              }
              className="flex-1 h-10 min-w-0"
            />

            {/* Send audio */}

            <button
              type="button"
              onClick={
                sendAudio
              }
              disabled={
                isSendingAudio
              }
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 shrink-0"
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
          MESSAGE INPUT
      ================================================= */}

      <div className="sticky bottom-0 bg-white border-t border-gray-100">

        <form
          onSubmit={
            handleSend
          }
          className="max-w-2xl mx-auto px-4 py-3"
        >

          {/* =================================================
              EDIT BAR
          ================================================= */}

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

          {/* =================================================
              RECORDING MODE
          ================================================= */}

          {isRecording ? (
            <div className="flex items-center gap-3">

              {/* Stop recording */}

              <button
                type="button"
                onClick={
                  stopRecording
                }
                className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0"
              >
                <Square
                  size={
                    18
                  }
                  fill="currentColor"
                />
              </button>

              {/* Recording information */}

              <div className="flex-1 bg-red-50 rounded-2xl px-4 py-3 min-w-0">

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />

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

              {/* Cancel recording */}

              <button
                type="button"
                onClick={
                  cancelRecording
                }
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"
              >
                <X
                  size={
                    18
                  }
                />
              </button>

            </div>
          ) : (

            /* =================================================
               NORMAL INPUT MODE
            ================================================= */

            <div className="flex items-center gap-2">

              {/* =================================================
                  FILE BUTTON
              ================================================= */}

              {!editingMessage && (
                <>
                  {/* Hidden file input */}

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

                  {/* Open file picker */}

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

              {/* =================================================
                  TEXT INPUT
              ================================================= */}

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
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />

              {/* =================================================
                  VOICE MESSAGE BUTTON
              ================================================= */}

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

              {/* =================================================
                  SEND BUTTON
              ================================================= */}

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