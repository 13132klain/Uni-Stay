import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
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
    const senderId = decodedToken.uid;

    const { recipientId } = await req.json();
    if (!recipientId || recipientId === senderId) {
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }

    // Fetch both profiles
    const senderRef = db.collection('roommateProfiles').doc(senderId);
    const recipientRef = db.collection('roommateProfiles').doc(recipientId);
    const [senderSnap, recipientSnap] = await Promise.all([
      senderRef.get(),
      recipientRef.get(),
    ]);
    if (!senderSnap.exists || !recipientSnap.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const sender = senderSnap.data();
    const recipient = recipientSnap.data();
    if (!sender || !recipient) {
      return NextResponse.json({ error: 'Profile data missing' }, { status: 404 });
    }
    if (sender.matched || recipient.matched) {
      return NextResponse.json({ error: 'One or both users are already paired' }, { status: 400 });
    }
    // Add senderId to recipient's pairRequests if not already present
    await recipientRef.update({
      pairRequests: FieldValue.arrayUnion(senderId),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Pair request error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 