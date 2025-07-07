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
    const userId = decodedToken.uid;

    const { senderId } = await req.json();
    if (!senderId || senderId === userId) {
      return NextResponse.json({ error: 'Invalid sender' }, { status: 400 });
    }

    // Remove senderId from user's pairRequests
    const userRef = db.collection('roommateProfiles').doc(userId);
    await userRef.update({
      pairRequests: FieldValue.arrayRemove(senderId),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Decline pair request error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 