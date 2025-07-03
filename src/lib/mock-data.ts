
export type House = {
  id: string;
  name: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  description: string;
  amenities: string[];
  agent: {
    name: string;
    phone: string;
  };
  imageAiHint?: string;
  createdAt?: any; // For Firestore serverTimestamp
};

// mockHouses can still exist for initial data or other purposes,
// but new listings will go to Firestore and pages will fetch from there.
export const mockHouses: House[] = [
  {
    id: '1',
    name: 'Modern Studio Apartment',
    address: '123 University Rd, Near Main Gate',
    price: 10000,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'modern studio',
    description: 'A bright and modern studio apartment perfect for a single student. Recently renovated with new appliances and furniture. Located just a 5-minute walk from the main campus gate.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Kitchenette', 'Furnished', 'Secure Parking', '24/7 Security', 'Security'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Spacious 2-Bedroom Flat',
    address: '456 Scholars Ave, Off-Campus',
    price: 18000,
    bedrooms: 2,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'spacious flat',
    description: 'Comfortable 2-bedroom flat suitable for sharing. Features a large living area, a fully equipped kitchen, and ample storage space. Located in a quiet residential area with easy access to public transport.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Full Kitchen', 'Balcony', 'Laundry Facilities', 'Gated Community'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Cozy Single Room with Shared Facilities',
    address: '789 Hostel Lane, Student Village',
    price: 7500,
    bedrooms: 1,
    bathrooms: 0, // Shared
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'hostel room',
    description: 'An affordable and cozy single room within a well-maintained student hostel. Access to shared modern bathrooms and a communal kitchen. Great for students looking for a budget-friendly option.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Shared Kitchen', 'Shared Bathroom', 'Common Room', 'Cleaning Services'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Luxury 1-Bedroom Annex',
    address: '101 Riverview Close, Serene Environment',
    price: 15000,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'luxury annex',
    description: 'A premium 1-bedroom annex with high-end finishes and a private entrance. Offers a peaceful and secure environment, ideal for focused study. Includes a small garden space.',
    amenities: ['Water', 'Electricity', 'High-speed WiFi', 'Security', 'Modern Kitchen', 'Private Garden', 'Furnished', 'Backup Generator', 'WiFi'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
   {
    id: '5',
    name: 'Budget Twin-Sharing Room',
    address: '222 Comrades St, Near Shopping Center',
    price: 6000, // Per person
    bedrooms: 1, // Room is shared
    bathrooms: 1, // Shared with roommate
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'twin room',
    description: 'Economical twin-sharing room, perfect for students looking to save on rent. Comes with two beds, study desks, and wardrobes. Close to local amenities and transport links.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Study Desks', 'Wardrobes', 'Shared Bathroom', 'Near Shops'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '6',
    name: 'Quiet 3-Bedroom Townhouse',
    address: '333 Green Valley, Short Drive to Campus',
    price: 25000,
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'townhouse exterior',
    description: 'A spacious 3-bedroom townhouse in a quiet, family-friendly neighborhood. Ideal for a group of students. Features a large living room, dining area, and a private backyard.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Full Kitchen', 'Dining Area', 'Backyard', 'Parking for 2 Cars', 'Pet-friendly (small pets)'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '7',
    name: 'Affordable Bedsitter in Kianjai',
    address: 'Kianjai Centre, Kianjai Road',
    price: 5500,
    bedrooms: 0, 
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'compact bedsitter',
    description: 'A compact and affordable bedsitter in Kianjai, suitable for a single student. Basic amenities provided, close to local shops and Kianjai market.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Kitchenette'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '8',
    name: 'Kirindine 1-Bedroom Apartment',
    address: 'Kirindine Heights, Off Meru-Nanyuki Highway',
    price: 9000,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'kirindine flat',
    description: 'Well-maintained 1-bedroom apartment in Kirindine. Offers a good balance of space and affordability. Secure compound with ample parking.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Furnished', 'Parking', 'Balcony'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '9',
    name: 'Kunene Shared Student House (4-Bed)',
    address: 'Kunene Juction, Near MUST Annex',
    price: 22000, 
    bedrooms: 4,
    bathrooms: 2,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'student house',
    description: 'Large 4-bedroom house in Kunene, perfect for a group of students. Shared living room and kitchen. Walking distance to one of the university annexes.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Full Kitchen', 'Common Room', 'Laundry Area'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '10',
    name: 'California Estate Bedsitter',
    address: 'California Estate, Phase 2',
    price: 6500,
    bedrooms: 0,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'estate studio',
    description: 'Neat bedsitter in the popular California estate area. Secure environment and close proximity to the university via public transport.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Gated Community', 'Near Public Transport'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '11',
    name: 'Mascan 2-Bedroom Furnished Unit',
    address: 'Mascan Area, Along Meru-Maua Road',
    price: 16000,
    bedrooms: 2,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'furnished unit',
    description: 'A fully furnished 2-bedroom apartment in Mascan. Ideal for students looking for a ready-to-move-in option. Includes essential furniture and kitchen appliances.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Full Kitchen', 'Furnished', 'TV Included'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '12',
    name: 'Kaidhe Single Room with Ensuite',
    address: 'Kaidhe, Off University Way',
    price: 8000,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'ensuite room',
    description: 'Private single room with its own bathroom in Kaidhe. Offers more privacy than shared facilities. Quiet area suitable for study.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Ensuite Bathroom', 'Study Area'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '13',
    name: 'Nchiru Gate B Studio',
    address: 'Nchiru, Near Gate B Entrance',
    price: 9500,
    bedrooms: 0, 
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'gateb studio',
    description: 'Convenient studio located very close to Meru University Gate B. Perfect for students who want quick access to campus. Modern finishes.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Kitchenette', 'Modern Finishes'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '14',
    name: 'Gatimbi 3-Bedroom Bungalow',
    address: 'Gatimbi Residential Area',
    price: 28000,
    bedrooms: 3,
    bathrooms: 2,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'gatimbi bungalow',
    description: 'Spacious 3-bedroom bungalow in Gatimbi. Features a private compound and garden. Suitable for a group or students seeking more space.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Full Kitchen', 'Private Compound', 'Garden'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '15',
    name: 'Kianjai Secure Bedsitter',
    address: 'Kianjai Stage, Near Main Road',
    price: 6000,
    bedrooms: 0,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'kianjai bedsitter',
    description: 'A well-secured bedsitter in Kianjai, offering peace of mind. Compact and functional, ideal for a single student prioritizing safety and affordability.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', '24/7 Security', 'Kitchenette'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '16',
    name: 'University View Single Room',
    address: 'Panorama Heights, Overlooking Campus',
    price: 8500,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'campus view',
    description: 'Single room with a balcony offering a view towards the university. Modern and well-maintained building with good amenities.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Balcony', 'Furnished'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '17',
    name: 'Kunene One-Bedroom Cottage',
    address: 'Kunene Green Estate, Off Main Road',
    price: 11000,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'kunene cottage',
    description: 'Charming one-bedroom cottage in a quiet estate in Kunene. Offers more space than a typical apartment, with a small private yard.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Kitchenette', 'Private Yard', 'Gated Community'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '18',
    name: 'California Budget Bedsitter',
    address: 'California Annex, Walkable to Shops',
    price: 5000,
    bedrooms: 0,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'budget studio',
    description: 'Very affordable bedsitter in California, perfect for students on a tight budget. Basic but clean and secure.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Near Shops'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '19',
    name: 'Mascan Modern Single Room',
    address: 'Mascan Towers, Close to Amenities',
    price: 7000,
    bedrooms: 1,
    bathrooms: 0, // Shared bathroom
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'mascan room',
    description: 'Single room in a modern apartment block in Mascan. Shared bathroom and kitchen facilities, kept clean and tidy. Good security.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Shared Kitchen', 'Shared Bathroom', 'Cleaning Services'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '20',
    name: 'Kaidhe Deluxe One-Bedroom',
    address: 'Kaidhe Prestige Apartments, University Proximity',
    price: 12500,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'kaidhe apartment',
    description: 'Spacious one-bedroom apartment in Kaidhe, with premium finishes and fittings. Located conveniently close to the university.',
    amenities: ['Water', 'Electricity', 'High-speed WiFi', 'Security', 'Modern Kitchen', 'Furnished', 'Parking', 'WiFi'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '21',
    name: 'Campus Gate Bedsitter Special',
    address: 'Next to Main Campus Gate, Nchiru',
    price: 6800,
    bedrooms: 0,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'nchiru bedsitter',
    description: 'Extremely convenient bedsitter located right next to the main campus gate. Ideal for students who value proximity above all.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Kitchenette'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '22',
    name: 'Nchiru Highway Single Room',
    address: 'Nchiru, Along Meru-Nanyuki Highway',
    price: 7200,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'highway room',
    description: 'Well-located single room with private bathroom along the main highway in Nchiru. Easy access to transport and campus.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Ensuite Bathroom'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '23',
    name: 'Kianjai Market View Bedsitter',
    address: 'Kianjai Town, Overlooking Market',
    price: 5800,
    bedrooms: 0,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'market view',
    description: 'Bedsitter with a view of Kianjai market, offering a vibrant atmosphere. Compact and affordable for single students.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Kitchenette'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '24',
    name: 'One Bedroom near Gate A',
    address: 'Scholars Plaza, Near Gate A',
    price: 11500,
    bedrooms: 1,
    bathrooms: 1,
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'gatea apartment',
    description: 'Modern one-bedroom apartment very close to University Gate A. Secure complex with modern amenities for comfortable student living.',
    amenities: ['Water', 'Electricity', 'High-speed WiFi', 'Security', 'Modern Kitchen', 'Furnished', 'Parking', 'Gated Community', 'WiFi'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  },
  {
    id: '25',
    name: 'Student Pod - Nchiru Central',
    address: 'Nchiru Central, Off Stadium Road',
    price: 6500,
    bedrooms: 1, 
    bathrooms: 0, 
    imageUrl: 'https://placehold.co/600x400.png',
    imageAiHint: 'student pod',
    description: 'Compact and efficient student pod room in Nchiru. Designed for single occupancy with shared modern kitchen and bathroom facilities. Very secure.',
    amenities: ['Water', 'Electricity', 'WiFi', 'Security', 'Shared Kitchen', 'Shared Bathroom', '24/7 Security', 'Study Area'],
    agent: { name: 'Kevin Klein Omondi', phone: '0799751598' },
    createdAt: new Date(),
  }
];


// Function to get house by ID - will be replaced by Firestore fetch on detail page
export const getHouseById = (id: string): House | undefined => {
  // This function will primarily serve other parts of the app if they still use mock data.
  // Listing detail page will fetch directly from Firestore.
  return mockHouses.find(house => house.id === id);
};

// addMockHouse is no longer the primary way to add listings if using Firestore.
// Kept for potential other uses or testing, but /portal/manage-listings/add now writes to Firestore.
export const addMockHouse = (newHouse: House): void => {
  mockHouses.push(newHouse);
  console.log("Mock house added (session only):", newHouse);
  console.log("Total mock houses:", mockHouses.length);
};


export type RoommateProfile = {
  id: string;
  fullName: string; 
  avatarUrl: string;
  course: string;
  yearOfStudy: number | string; 
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bio: string;
  interests: string[];
  lookingFor?: string; 
  contact?: string; 
  userId?: string; 
};

export const mockRoommateProfiles: RoommateProfile[] = [
  {
    id: 'rm1',
    userId: 'user1',
    fullName: 'Alex Mwangi',
    avatarUrl: 'https://placehold.co/100x100.png',
    course: 'BSc. Computer Science',
    yearOfStudy: 2,
    gender: 'male',
    bio: 'Chill and studious. Love coding, gaming, and occasionally hiking. Looking for someone respectful and reasonably clean.',
    interests: ['Coding', 'Gaming', 'Sci-Fi Movies', 'Hiking'],
    lookingFor: 'A roommate for a 2-bedroom apartment near campus. Preferably someone who also values quiet study time.',
  },
  {
    id: 'rm2',
    userId: 'user2',
    fullName: 'Brenda Chepkoech',
    avatarUrl: 'https://placehold.co/100x100.png',
    course: 'B.A. Communication',
    yearOfStudy: 3,
    gender: 'female',
    bio: 'Outgoing and friendly! I enjoy social events, reading, and trying new cafes. I keep my space tidy and appreciate good communication.',
    interests: ['Photography', 'Reading', 'Socializing', 'Music Festivals'],
    lookingFor: 'A female roommate who is friendly, clean, and enjoys a mix of social and quiet time. Open to sharing a 2 or 3 bedroom place.',
  },
  {
    id: 'rm3',
    userId: 'user3',
    fullName: 'Samira Ali',
    avatarUrl: 'https://placehold.co/100x100.png',
    course: 'BSc. Nursing',
    yearOfStudy: 1,
    gender: 'female',
    bio: 'Focused on my studies but also enjoy cooking and watching series. Early bird. Looking for a calm and clean living environment.',
    interests: ['Cooking', 'Medical Dramas', 'Yoga', 'Volunteering'],
    lookingFor: 'A female roommate for a quiet and clean shared apartment. Preferably another student in health sciences.',
  },
  {
    id: 'rm4',
    userId: 'user4',
    fullName: 'David Kimani',
    avatarUrl: 'https://placehold.co/100x100.png',
    course: 'B. Engineering (Mechanical)',
    yearOfStudy: 4,
    gender: 'male',
    bio: 'Into sports, especially football and basketball. I am easygoing and respectful of others\' space. Not a party animal, but enjoy hanging out.',
    interests: ['Football', 'Basketball', 'DIY Projects', 'Rock Music'],
    lookingFor: 'One or two male roommates to share a flat. Must be okay with occasional game nights.',
  },
  {
    id: 'rm5',
    userId: 'user5',
    fullName: 'Chris Otieno',
    avatarUrl: 'https://placehold.co/100x100.png',
    course: 'MSc. Data Science',
    yearOfStudy: 'Postgraduate',
    gender: 'male',
    bio: 'Mature student, quite focused on research. I appreciate a quiet and organized living space. Interests include chess and classical music.',
    interests: ['Data Analysis', 'Chess', 'Classical Music', 'Reading Journals'],
    lookingFor: 'A quiet and mature roommate, preferably postgraduate or final year, for a 2-bedroom apartment.',
  },
];

    