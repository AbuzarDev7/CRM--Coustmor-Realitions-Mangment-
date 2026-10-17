import { io } from "../../frontend/node_modules/socket.io-client/build/esm/index.js";

async function testChat() {
  console.log("1. Testing REST /api/chat/init...");
  try {
    const res = await fetch("http://localhost:3000/api/chat/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: "Test Customer",
        customerEmail: "test.customer@example.com"
      })
    });
    console.log("REST init status:", res.status);
    const data = await res.json();
    console.log("REST init response:", JSON.stringify(data, null, 2));

    const convId = data.conversation?._id;
    if (!convId) {
      console.error("No conversation returned!");
      return;
    }

    console.log("\n2. Testing Socket.io connection to http://localhost:3000 ...");
    const customerSocket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: false
    });

    const agentSocket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: false
    });

    await new Promise((resolve, reject) => {
      let custConnected = false;
      let agentConnected = false;

      customerSocket.on("connect", () => {
        console.log("✅ Customer socket connected:", customerSocket.id);
        custConnected = true;
        customerSocket.emit("identify", { userEmail: "test.customer@example.com", role: "customer" });
        customerSocket.emit("join_conversation", { conversationId: convId, role: "customer" });
        if (custConnected && agentConnected) resolve();
      });

      customerSocket.on("connect_error", (err) => {
        console.error("❌ Customer socket connect_error:", err.message);
        reject(err);
      });

      agentSocket.on("connect", () => {
        console.log("✅ Agent socket connected:", agentSocket.id);
        agentConnected = true;
        agentSocket.emit("join_agents_room", { userEmail: "agent@crm.com" });
        agentSocket.emit("identify", { userEmail: "agent@crm.com", role: "agent" });
        agentSocket.emit("join_conversation", { conversationId: convId, role: "agent" });
        if (custConnected && agentConnected) resolve();
      });

      agentSocket.on("connect_error", (err) => {
        console.error("❌ Agent socket connect_error:", err.message);
        reject(err);
      });

      setTimeout(() => reject(new Error("Socket connect timeout after 5s")), 5000);
    });

    console.log("\n3. Testing sending message from Customer to Agent...");
    agentSocket.on("new_msg", (msgData) => {
      console.log("🎉 Agent received new_msg:", JSON.stringify(msgData, null, 2));
    });

    customerSocket.emit("send_msg", {
      conversationId: convId,
      senderRole: "customer",
      senderName: "Test Customer",
      senderEmail: "test.customer@example.com",
      text: "Hello, this is a real-time test message!"
    }, (ack) => {
      console.log("Customer send_msg ack callback:", ack);
    });

    await new Promise((r) => setTimeout(r, 2000));

    console.log("\n4. Testing sending message from Agent to Customer...");
    customerSocket.on("new_msg", (msgData) => {
      console.log("🎉 Customer received new_msg from Agent:", JSON.stringify(msgData, null, 2));
    });

    agentSocket.emit("send_msg", {
      conversationId: convId,
      senderRole: "agent",
      senderName: "Sales Agent",
      senderEmail: "agent@crm.com",
      text: "Hello Customer, I received your message loud and clear!"
    }, (ack) => {
      console.log("Agent send_msg ack callback:", ack);
    });

    await new Promise((r) => setTimeout(r, 2000));

    customerSocket.disconnect();
    agentSocket.disconnect();
    console.log("\nTest completed successfully!");
    process.exit(0);

  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

testChat();
