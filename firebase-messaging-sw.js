importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBfqqXgrLGaRzY3ECH0FkckuSWlMgRgAWQ",
  authDomain: "shanklin-5d9d8.firebaseapp.com",
  projectId: "shanklin-5d9d8",
  storageBucket: "shanklin-5d9d8.firebasestorage.app",
  messagingSenderId: "294015099276",
  appId: "1:294015099276:web:5c91556f85d46c310df6a9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || "Shank-O-Meter Update";
  const notificationOptions = {
    body: payload.notification?.body || "There was an update to the Shank-O-Meter.",
    icon: "/icon-192.png",
    badge: "/icon-192.png"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
