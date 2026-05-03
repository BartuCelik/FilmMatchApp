import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Host tarafında her iki partner de kürasyon cevaplarını gönderdikten sonra çağrılır.
 * Sonraki adımda LLM / öneri pipeline'ı buraya bağlanacak.
 */
export async function prepareCurationAiTrigger(sessionId) {
  await updateDoc(doc(db, 'sessions', sessionId), {
    aiCurationPipelineQueuedAt: serverTimestamp(),
  });
}
