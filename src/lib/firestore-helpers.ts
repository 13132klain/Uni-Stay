import { db } from './firebase';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';

// Submit a new inquiry
type InquiryData = {
  userId: string;
  userEmail: string;
  userName: string;
  houseId: string;
  houseName: string;
  houseAddress: string;
  agentName: string;
  agentPhone: string;
  preferredMoveInDate: any;
  numberOfTenants: number;
  message: string;
  rentAmount: number;
};

export async function submitInquiry(inquiryData: InquiryData) {
  return await addDoc(collection(db, 'inquiries'), {
    ...inquiryData,
    status: 'new',
    submittedAt: serverTimestamp(),
  });
}

export async function getUserInquiries(userId: string) {
  const q = query(
    collection(db, 'inquiries'),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateInquiryStatus(inquiryId: string, newStatus: string, adminUserId: string) {
  const inquiryRef = doc(db, 'inquiries', inquiryId);
  const updateData: any = {
    status: newStatus,
    lastUpdatedBy: adminUserId,
    lastUpdatedAt: serverTimestamp(),
  };
  if (newStatus === 'contacted') updateData.contactedAt = serverTimestamp();
  if (["rejected", "closed"].includes(newStatus)) updateData.closedAt = serverTimestamp();
  if (newStatus === 'accepted') updateData.acceptedAt = serverTimestamp();
  await updateDoc(inquiryRef, updateData);
} 