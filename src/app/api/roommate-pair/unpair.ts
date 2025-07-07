import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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

    const { otherUserId } = await req.json();
    if (!otherUserId || otherUserId === userId) {
      return NextResponse.json({ error: 'Invalid other user' }, { status: 400 });
    }

    // Fetch both profiles
    const userRef = db.collection('roommateProfiles').doc(userId);
    const otherUserRef = db.collection('roommateProfiles').doc(otherUserId);
    const [userSnap, otherUserSnap] = await Promise.all([
      userRef.get(),
      otherUserRef.get(),
    ]);
    if (!userSnap.exists || !otherUserSnap.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const user = userSnap.data();
    const otherUser = otherUserSnap.data();
    if (!user || !otherUser) {
      return NextResponse.json({ error: 'Profile data missing' }, { status: 404 });
    }
    if (!user.matched || !otherUser.matched || user.matchedWith !== otherUserId || otherUser.matchedWith !== userId) {
      return NextResponse.json({ error: 'Users are not paired with each other' }, { status: 400 });
    }
    // Unpair both users
    await Promise.all([
      userRef.update({
        matched: false,
        matchedWith: null,
      }),
      otherUserRef.update({
        matched: false,
        matchedWith: null,
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unpair error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 