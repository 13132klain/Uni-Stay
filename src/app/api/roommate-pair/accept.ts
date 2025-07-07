import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const recipientId = decodedToken.uid;

    const { senderId } = await req.json();
    if (!senderId || senderId === recipientId) {
      return NextResponse.json({ error: 'Invalid sender' }, { status: 400 });
    }

    // Fetch both profiles
    const recipientRef = db.collection('roommateProfiles').doc(recipientId);
    const senderRef = db.collection('roommateProfiles').doc(senderId);
    const [recipientSnap, senderSnap] = await Promise.all([
      recipientRef.get(),
      senderRef.get(),
    ]);
    if (!recipientSnap.exists || !senderSnap.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const recipient = recipientSnap.data();
    const sender = senderSnap.data();
    if (!recipient || !sender) {
      return NextResponse.json({ error: 'Profile data missing' }, { status: 404 });
    }
    if (recipient.matched || sender.matched) {
      return NextResponse.json({ error: 'One or both users are already paired' }, { status: 400 });
    }
    if (!Array.isArray(recipient.pairRequests) || !recipient.pairRequests.includes(senderId)) {
      return NextResponse.json({ error: 'No pending request from this user' }, { status: 400 });
    }
    // Update both profiles atomically
    await Promise.all([
      recipientRef.update({
        matched: true,
        matchedWith: senderId,
        pairRequests: FieldValue.arrayRemove(senderId),
      }),
      senderRef.update({
        matched: true,
        matchedWith: recipientId,
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Accept pair request error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 