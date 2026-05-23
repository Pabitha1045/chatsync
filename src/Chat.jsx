import { useEffect, useRef, useState } from "react";

import io from "socket.io-client";

import axios from "axios";

const socket = io("http://localhost:5000");

function Chat() {

    const [username, setUsername] = useState("");

    const [joined, setJoined] = useState(false);

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([]);

    const [typingUser, setTypingUser] = useState("");

    const [onlineUsers, setOnlineUsers] = useState([]);

    const messagesEndRef = useRef(null);

    const room = "general";

    const getReadReceipt = (msg) => {

        if (msg.seen) {

            return {
                ticks: "✓✓",
                label: "Read",
                color: "#38bdf8",
            };
        }

        if (msg.delivered) {

            return {
                ticks: "✓✓",
                label: "Delivered",
                color: "#cbd5e1",
            };
        }

        return {
            ticks: "✓",
            label: "Sent",
            color: "#cbd5e1",
        };
    };

    // Auto Scroll
    const scrollToBottom = () => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    };

    useEffect(() => {

        scrollToBottom();

    }, [messages]);

    // Join Chat
    const joinChat = async () => {

        if (!username) return;

        socket.emit("join_room", {
            room,
            username,
        });

        // Load old messages
        const res = await axios.get(
            `http://localhost:5000/api/messages/${room}`
        );

        setMessages(res.data);

        setJoined(true);
    };

    // Socket Events
    useEffect(() => {

        // Receive Messages
        socket.on("receive_message", (data) => {

            setMessages((prev) => [...prev, data]);

            // Mark as delivered/read
            if (data.sender !== username) {

                socket.emit(
                    "message_delivered",
                    data._id
                );

                if (!document.hidden && document.hasFocus()) {

                    socket.emit(
                        "message_seen",
                        data._id
                    );
                }
            }
        });

        // Typing Indicator
        socket.on("show_typing", (data) => {

            if (data.sender !== username) {

                setTypingUser(data.sender);

                setTimeout(() => {

                    setTypingUser("");

                }, 3000);
            }
        });

        // Online Users
        socket.on("online_users", (users) => {

            setOnlineUsers(users);
        });

        // Delivered Updates
        socket.on(
            "message_delivered_update",
            (updatedMsg) => {

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === updatedMsg._id
                            ? updatedMsg
                            : msg
                    )
                );
            }
        );

        // Seen Updates
        socket.on(
            "message_seen_update",
            (updatedMsg) => {

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === updatedMsg._id
                            ? updatedMsg
                            : msg
                    )
                );
            }
        );

        // Reaction Updates
        socket.on(
            "reaction_updated",
            (updatedMsg) => {

                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === updatedMsg._id
                            ? updatedMsg
                            : msg
                    )
                );
            }
        );

        return () => {

            socket.off("receive_message");

            socket.off("show_typing");

            socket.off("online_users");

            socket.off("message_delivered_update");

            socket.off("message_seen_update");

            socket.off("reaction_updated");
        };

    }, [username]);

    // Send Message
    const sendMessage = () => {

        if (message.trim() === "") return;

        const messageData = {
            room,
            sender: username,
            message,
        };

        // Send to backend
        socket.emit("send_message", messageData);

        setMessage("");
    };

    // JOIN SCREEN
    if (!joined) {

        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#0f172a",
                    color: "white",
                }}
            >
                <div
                    style={{
                        background: "#1e293b",
                        padding: "30px",
                        borderRadius: "10px",
                        textAlign: "center",
                    }}
                >
                    <h1>ChatSync</h1>

                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        style={{
                            padding: "10px",
                            width: "250px",
                            marginTop: "10px",
                        }}
                    />

                    <br />

                    <button
                        onClick={joinChat}
                        style={{
                            marginTop: "15px",
                            padding: "10px 20px",
                            cursor: "pointer",
                        }}
                    >
                        Join Chat
                    </button>
                </div>
            </div>
        );
    }

    // CHAT SCREEN
    return (
        <div
            style={{
                background: "#0f172a",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                color: "white",
            }}
        >

            {/* HEADER */}
            <div
                style={{
                    padding: "15px",
                    background: "#1e293b",
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                }}
            >
                ChatSync
            </div>

            {/* ONLINE USERS */}
            <div
                style={{
                    background: "#111827",
                    padding: "10px 20px",
                    borderBottom: "1px solid #1e293b",
                }}
            >
                <h3>Online Users</h3>

                {onlineUsers.map((user, index) => (

                    <div key={index}>
                        🟢 {user.username}
                    </div>
                ))}
            </div>

            {/* CHAT AREA */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px",
                }}
            >
                {messages.map((msg, index) => {

                    const isOwnMessage =
                        msg.sender === username;
                    const reactionLabel =
                        msg.reaction?.reactedBy === username
                            ? "you"
                            : msg.reaction?.reactedBy;
                    const readReceipt = getReadReceipt(msg);

                    return (
                        <div
                            key={index}
                            style={{
                                display: "flex",
                                justifyContent:
                                    isOwnMessage
                                        ? "flex-end"
                                        : "flex-start",

                                marginBottom: "15px",
                            }}
                        >
                            <div
                                style={{
                                    background:
                                        isOwnMessage
                                            ? "#2563eb"
                                            : "#334155",

                                    padding: "10px 15px",

                                    borderRadius: "10px",

                                    maxWidth: "300px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        marginBottom: "5px",
                                    }}
                                >
                                    {msg.sender}
                                </div>

                                <div>
                                    {msg.message}
                                </div>

                                {/* Reaction */}
                               {msg.reaction?.emoji && (
    <div
        style={{
            marginTop: "5px",
            fontSize: "18px",
        }}
    >
        {msg.reaction.emoji}

        <span
            style={{
                fontSize: "12px",
                marginLeft: "8px",
                opacity: 0.7,
            }}
        >
            reacted by{" "}
            {
                reactionLabel
            }
        </span>
    </div>
)}

                                {/* Read Receipt */}
                                {msg.sender === username && (
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            marginTop: "5px",
                                            opacity: 0.7,
                                        }}
                                    >
                                        <span
                                            title={
                                                readReceipt.label
                                            }
                                            style={{
                                                color:
                                                    readReceipt.color,
                                            }}
                                        >
                                            {readReceipt.ticks}
                                        </span>
                                    </div>
                                )}

                                {/* Reaction Buttons */}
                                <div
                                    style={{
                                        marginTop: "8px",
                                        display: "flex",
                                        gap: "5px",
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            socket.emit(
                                                "add_reaction",
                                                {
                                                    messageId:
                                                        msg._id,
                                                    reaction:
                                                        "👍",
                                                    reactedBy:
                                                        username,
                                                }
                                            )
                                        }
                                    >
                                        👍
                                    </button>

                                    <button
                                        onClick={() =>
                                            socket.emit(
                                                "add_reaction",
                                                {
                                                    messageId:
                                                        msg._id,
                                                    reaction:
                                                        "❤️",
                                                    reactedBy:
                                                        username,
                                                }
                                            )
                                        }
                                    >
                                        ❤️
                                    </button>

                                    <button
                                        onClick={() =>
                                            socket.emit(
                                                "add_reaction",
                                                {
                                                    messageId:
                                                        msg._id,
                                                    reaction:
                                                        "😂",
                                                    reactedBy:
                                                        username,
                                                }
                                            )
                                        }
                                    >
                                        😂
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef}></div>
            </div>

            {/* Typing Indicator */}
            {typingUser && (
                <div
                    style={{
                        paddingLeft: "20px",
                        paddingBottom: "10px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                    }}
                >
                    {typingUser} is typing...
                </div>
            )}

            {/* INPUT AREA */}
            <div
                style={{
                    display: "flex",
                    padding: "15px",
                    background: "#1e293b",
                }}
            >
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {

                        setMessage(e.target.value);

                        // Typing Event
                        socket.emit("typing", {
                            room,
                            sender: username,
                        });
                    }}
                    onKeyDown={(e) => {

                        if (e.key === "Enter") {

                            sendMessage();
                        }
                    }}
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "8px",
                        border: "none",
                        outline: "none",
                    }}
                />

                <button
                    onClick={sendMessage}
                    style={{
                        marginLeft: "10px",
                        padding: "12px 20px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chat;
