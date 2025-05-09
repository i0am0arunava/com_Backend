const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socket = require("socket.io");
const app = express()
const multer = require("multer");

const path = require("path");

app.use(cors())
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");


app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/profile", express.static(path.join(__dirname, "profile")));


const server = app.listen(5000, () =>
  console.log(`Server started on ${5000}`)
);


app.use("/api/auth", userRoutes)
app.use("/api/messages", messageRoutes);


mongoose
  .connect(process.env.MONGO_URL, {

  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });





const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

const prof = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "profile/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const profile = multer({ storage: prof });





app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully", filename: req.file.filename });
});

app.post("/prof", profile.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully", filename: req.file.filename });
});




app.post("/scanner", async (req, res) => {
  try {

    const scanDetails = req.body;
    console.log("hellow", scanDetails)

    //  const scanDetails = req.body;
    //  console.log("Received scan details:", scanDetails);

    //  // Check if eventId already exists
    //  const existingScan = await Scan.findOne({ eventId: scanDetails.eventId });

    //  if (existingScan) {
    //     // eventId already exists, do not save
    //     return res.status(200).json({ success: false, message: "eventId already exists" });
    //  }

    //  // eventId does not exist, create and save
    //  const newScan = new Scan(scanDetails);
    //  await newScan.save();

    return res.status(201).json({ success: true, message: "Scan saved successfully", data: 'hellow' });
  } catch (error) {
    console.error("Error creating scan:", error);
    return res.status(500).json({ success: false, error: "Failed to create scan" });
  }
});





















const io = socket(server, {
  cors: {
    origin: "*",          
    credentials: true,
  },
});

global.onlineUsers = new Map();
global.scanner = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  console.log("one user", socket.id)
  socket.on("add-user", (userId) => {
    console.log("one user added")
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    console.log("helott", onlineUsers)
    const sendUserSocket = onlineUsers.get(data.to);
    const LinkOfMain = data.from
    const LinkedDevice = [...onlineUsers.keys()].find(key =>
      key.startsWith('linked?') && key.split('?')[1] === data.from
    );
   //whom i am sending checking whether it has device or not 
    const Senderlinked = [...onlineUsers.keys()].find(key =>
      key.startsWith('linked?') && key.split('?')[1] === data.to
    );


    //this link1 and link2 are bith coupled device means linked device if anyone send messages other can see it
    //  const link1 =onlineUsers.get("linked?681402decb91d9ca754dbc7e")
    //  const link2 =onlineUsers.get("681402decb91d9ca754dbc7e")
    console.log("linker", data.from)
    console.log("linked", LinkedDevice)

    const link1 = onlineUsers.get(LinkedDevice)
    const link2 = onlineUsers.get(LinkOfMain)
    const link3=onlineUsers.get(Senderlinked)
    const extracted = LinkedDevice?.split("?")[1];
    if (link1) {
      console.log("execute link1", link1)

      socket.to(link1).emit("link-recieve", data.message, data.from, data.to, extracted === data.from);
    }
    if (link2 != sendUserSocket) {
      console.log("execute link2", link2)

      socket.to(link2).emit("link-recieve", data.message, data.from, data.to, extracted === data.from);
    }
   if(link3){

    socket.to(link3).emit("msg-recieve", data.message, data.from, data.to);
   }




    if (sendUserSocket) {
      console.log("execute main", sendUserSocket)
      socket.to(sendUserSocket).emit("msg-recieve", data.message, data.from, data.to);
    }
  });
  socket.on("typingModeOn", (data) => {
    console.log("dsdsaads", data.head)
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("typingrecieve", data.head, data.from, data.to);
      console.log("send")
    }
  });
  socket.on("typingModeOff", (data) => {
    console.log("dsdsaads", data.head)
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("typingrecieveoff", data.head);
      console.log("send")
    }
  });


  socket.on("user:call", ({ from, to, offer }) => {
    console.log("video1", to)
    console.log("video2", offer)
    const callto = onlineUsers.get(to);
    socket.to(callto).emit("incomming:call", { from: from, offer });
  });


  socket.on("call:accepted", ({ to, from, ans }) => {
    const answerTo = onlineUsers.get(to);
    socket.to(answerTo).emit("call:accepted", { from: from, ans });
  });
  socket.on("peer:nego:needed", ({ to, from, offer }) => {
    console.log("peer:nego:needed", offer);
    const answerTo = onlineUsers.get(to);
    socket.to(answerTo).emit("peer:nego:needed", { from: from, offer });
  });


  socket.on("peer:nego:done", ({ to, from, ans }) => {
    console.log("peer:nego:done", ans);
    const answerTo = onlineUsers.get(to);
    socket.to(answerTo).emit("peer:nego:final", { from: from, ans });
  });

  socket.on("end-call", ({ to }) => {
    const answerTo = onlineUsers.get(to);
    socket.to(answerTo).emit("call-ended");
  });



















  socket.on("add-scanner", (userId) => {
    scanner.set(userId, socket.id);
  });











  socket.on("scanning", (user) => {
    console.log("scanned", user)
    const answerTo = scanner.get("arun");
    console.log("answerto", scanner)
    socket.to(answerTo).emit("confirm", user);



  });























});

