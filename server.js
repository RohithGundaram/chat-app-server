const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const http = require('http').createServer(app);
// const io = require('socket.io')(http);
const bodyParser = require('body-parser');
// Get the current date and time
const currentDateTime = new Date();

// Get the current date in ISO string format (e.g., "2023-10-31T15:25:30.000Z")
const currentDate = currentDateTime.toISOString();

// Get the current date in a specific format (e.g., "2023-10-31")
const formattedDate = currentDateTime.toISOString().split('T')[0];

// Get the current time in a specific format (e.g., "15:25:30")
const formattedTime = currentDateTime.toTimeString().split(' ')[0];

// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { collection,addDoc } from "firebase/firestore";

const {initializeApp}=require("firebase/app")
const {getFirestore, setDoc, orderBy}=require("firebase/firestore")
const { collection,addDoc ,query, where, getDocs,doc,getDoc}= require("firebase/firestore");
const { send } = require('process');
const firebaseConfig = {
  apiKey: "AIzaSyCozgbauL8fMNnPn-H0Q2giQENB4j07pcQ",
  authDomain: "chat-app-ef493.firebaseapp.com",
  databaseURL: "https://chat-app-ef493-default-rtdb.firebaseio.com",
  projectId: "chat-app-ef493",
  storageBucket: "chat-app-ef493.appspot.com",
  messagingSenderId: "529414464816",
  appId: "1:529414464816:web:b9a54108566782d74c14f5"
};


// Initialize Firebase
const app1 = initializeApp(firebaseConfig);
const db = getFirestore(app1);

app.use(bodyParser.json());

const users = [];
const messages = {};

// io.on('connection', (socket) => {
//   console.log(`User connected: ${socket.id}`);

//   // Send the list of users to the newly connected user.
//   socket.emit('users-changed', users);

//   // Receive new chat messages.
//   socket.on('new-chat-message', (message) => {
//     const { senderId, recipientId, text } = message;
//     if (!messages[recipientId]) {
//       messages[recipientId] = [];
//     }
//     messages[recipientId].push({ senderId, text });

//     // Send the new message to the recipient if they are online.
//     const recipientSocket = io.sockets.sockets.get(recipientId);
//     if (recipientSocket) {
//       recipientSocket.emit('new-chat-message', { senderId, text });
//     }
//   });

//   // Handle user disconnection.
//   socket.on('disconnect', () => {
//     const disconnectedUser = users.find(user => user.id === socket.id);
//     if (disconnectedUser) {
//       console.log(`User disconnected: ${socket.id}`);
//       users.splice(users.indexOf(disconnectedUser), 1);

//       // Notify other users about the disconnection.
//       socket.broadcast.emit('users-changed', users);
//     }
//   });
// });

// Create a new user and return the user's ID.
app.post('/user', async(req, res) => {
    
  const {email,name}=req.body
  const docRef = doc(db, "users", email);
  const citiesRef = collection(db, "users");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return res.json("user already exists")
  } else {
    // docSnap.data() will be undefined in this case
    
    await setDoc(doc(citiesRef,email), {
      email,
      name
    });
    res.json("user created");
  }


});

// Get a list of users.
app.get('/users',async (req, res) => {
    const querySnapshot = await getDocs(collection(db, "users"));
    ans=[]
    querySnapshot.forEach((doc) => {
  // doc.data() is never undefined for query doc snapshots
  ans.push(doc.data())
});
    res.json(ans)
});

// // Get chat messages for a specific user.
// app.get('/messages/:userId', (req, res) => {
//   const userId = req.params.userId;
//   const userMessages = messages[userId] || [];
//   res.json(userMessages);
// });

app.get('/messages/:userId', async (req, res) => {
    const userId = req.params.userId;
    const userMessages = messages[userId] || "error";
    const q = query(collection(db, "chat"), where("receiver", "==", userId));
    const querySnapshot = await getDocs(q);
    ans=[]
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        ans.push(doc.data())
      });
   
    res.json(ans);
  });


app.post('/getmessages', async(req,res)=>{
  const {senderId, receiverId} = req.body;
  const q = query(collection(db, "chat"), where("sender", "==", senderId), where("receiver", "==", receiverId));
  const q2 = query(collection(db, "chat"), where("sender", "==", receiverId), where("receiver", "==", senderId));

  const querySnapshot = await getDocs(q);
  const querySnapshot2 = await getDocs(q2);
  ans = []
  querySnapshot.forEach((doc)=>{
    ans.push(doc.data())
  });
  querySnapshot2.forEach((doc)=>{
    ans.push(doc.data())
  });
  ans.sort((a,b) => a.timestamp - b.timestamp);
  res.json(ans);
})


// Add a new chat message
app.post('/message',async (req, res) => {
  const { senderId, recipientId, text } = req.body;
  if (!messages[recipientId]) {
    messages[recipientId] = [];
  }
  messages[recipientId].push({ senderId, text });
  
  // Send the new message to the recipient if they are online.
  // const recipientSocket = io.sockets.sockets.get(recipientId);
  // if (recipientSocket) {
  //   recipientSocket.emit('new-chat-message', { senderId, text });
  // }
  await addDoc(collection(db, "chat"), {
    sender:senderId,
    receiver:recipientId,
    message:text,
    date: formattedDate,
    timestamp: currentDateTime,
    time: formattedTime
  });
  res.status(201).json({ message: 'Message sent successfully' });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function generateUserId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
