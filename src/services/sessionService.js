import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  query,
  where,
  getDocs 
} from "firebase/firestore";

// 1. Yeni bir 6 haneli oda oluştur
export const createMatchSession = async (hostId) => {
  const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  const sessionData = {
    code: sessionCode,
    hostId: hostId,
    participants: [hostId],
    status: "waiting", // waiting, active, matched
    createdAt: serverTimestamp(),
    swipes: {}, // { userId: { movieId: 'like' | 'dislike' } }
    matches: []
  };

  const docRef = await addDoc(collection(db, "sessions"), sessionData);
  return { sessionId: docRef.id, sessionCode };
};

// 2. Kodu girerek odaya katıl
export const joinMatchSession = async (userId, inputCode) => {
  const q = query(collection(db, "sessions"), where("code", "==", inputCode), where("status", "==", "waiting"));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const sessionDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, "sessions", sessionDoc.id), {
      participants: arrayUnion(userId),
      status: "active" // İkinci kişi geldiğinde süreç başlar
    });
    return sessionDoc.id;
  }
  throw new Error("Oda bulunamadı veya dolmuş.");
};

// 3. Gerçek zamanlı dinleyici (Real-time Match Tracker)
export const subscribeToSession = (sessionId, callback) => {
  return onSnapshot(doc(db, "sessions", sessionId), (docSnap) => {
    callback(docSnap.exists() ? docSnap.data() : null);
  });
};

export const setSessionSelectedMode = async (sessionId, selectedMode) => {
  await updateDoc(doc(db, "sessions", sessionId), { selectedMode });
};

/** Tek yazıda kullanıcıya özel kürasyon cevapları (wizard son adımı). */
export const updateCurationResponses = async (sessionId, userId, curationPayload) => {
  await updateDoc(doc(db, "sessions", sessionId), {
    [`curationResponses.${userId}`]: {
      ...curationPayload,
      submittedAt: serverTimestamp(),
    },
  });
};