const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, "league_logo" + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.post("/uploadLogo", upload.single("logo"), (req, res) => {
  match.leagueLogo = "/uploads/" + req.file.filename;
  io.emit("update", match);
  res.sendStatus(200);
});

app.get("/controller", (req, res) => {
  res.sendFile(__dirname + "/public/controller.html");
});

app.get("/penalty", (req, res) => {
  res.sendFile(__dirname + "/public/penalty.html");
});

let timer = null;

let match = {
  team1Name: "TEAM A",
  team2Name: "TEAM B",
  team1Short: "TMA",
  team2Short: "TMB",
  team1Score: 0,
  team2Score: 0,
  team1Color: "#1e88e5",
  team1Color2: "#1565c0",
  team1UseColor2: false,
  team1TextColor: "#ffffff",
  team1UseStroke: false,
  team1StrokeColor: "#000000",
  team1StrokeWidth: 1,
  team2Color: "#fdd835",
  team2Color2: "#f9a825",
  team2UseColor2: false,
  team2TextColor: "#000000",
  team2UseStroke: false,
  team2StrokeColor: "#000000",
  team2StrokeWidth: 1,
  seconds: 0,
  extra: 0,
  leagueLogo: ""
};

io.on("connection", (socket) => {

  socket.emit("update", match);

  socket.on("updateMatch", (data) => {
    match = { ...match, ...data };
    io.emit("update", match);
  });

  socket.on("start", () => {
    if (!timer) {
      timer = setInterval(() => {
        match.seconds++;
        io.emit("update", match);
      }, 1000);
    }
  });

  socket.on("stop", () => {
    clearInterval(timer);
    timer = null;
  });

  socket.on("resetTime", () => {
    match.seconds = 0;
    io.emit("update", match);
  });

  socket.on("resetAll", () => {
    match.team1Score = 0;
    match.team2Score = 0;
    match.seconds = 0;
    match.extra = 0;
    io.emit("update", match);
  });

  socket.on("card", (data) => {
    io.emit("card", data);
  });

  socket.on("sub", (data) => {
    io.emit("sub", data);
  });

  // Penalty shootout state relay
  socket.on("penaltyState", (data) => {
    io.emit("penaltyState", data);
  });

});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
