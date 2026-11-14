import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'driver' | 'passenger';
  phone?: string;
  rating: number;
  ratings_count: number;
  grade: 'Ambassador' | 'Expert' | 'Intermediate' | 'Newcomer';
  id_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

function ensureDataDir(): void {
  const dir = path.dirname(USERS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function generateUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

export function getAllUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE_PATH)) {
    const initialUsers = getSeedUsers();
    saveAllUsers(initialUsers);
    return initialUsers;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : getSeedUsers();
  } catch (err) {
    console.error('Failed to read users.json, loading seed users:', err);
    return getSeedUsers();
  }
}

export function saveAllUsers(users: UserRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export function findUserByEmail(email: string): UserRecord | null {
  const cleanEmail = email.toLowerCase().trim();
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase().trim() === cleanEmail) || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role?: 'driver' | 'passenger';
  phone?: string;
}): Promise<UserRecord> {
  const existing = findUserByEmail(params.email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(params.password);
  const userId = generateUserId(params.email);

  const newUser: UserRecord = {
    id: userId,
    name: params.name.trim(),
    email: params.email.toLowerCase().trim(),
    passwordHash,
    role: params.role || 'passenger',
    phone: params.phone || '+91 98765 43210',
    rating: 5.0,
    ratings_count: 1,
    grade: params.role === 'driver' ? 'Intermediate' : 'Newcomer',
    id_verified: true,
    phone_verified: true,
    email_verified: true,
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name)}`,
    created_at: new Date().toISOString()
  };

  const users = getAllUsers();
  users.push(newUser);
  saveAllUsers(users);

  return newUser;
}

function getSeedUsers(): UserRecord[] {
  // Pre-hashed "password123" with bcrypt (10 rounds)
  const defaultPasswordHash = '$2a$10$95b8t0K.9v5g8m1rI3t7xeqYt4eF7xT6Zg8M.P5G5k4m4p8x0t2yG';

  return [
    {
      id: 'usr_driver_abc_com',
      name: 'Anish Kumar',
      email: 'driver@abc.com',
      passwordHash: defaultPasswordHash,
      role: 'driver',
      phone: '+91 98765 01234',
      rating: 4.9,
      ratings_count: 42,
      grade: 'Ambassador',
      id_verified: true,
      phone_verified: true,
      email_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      created_at: '2024-01-15T08:00:00.000Z'
    },
    {
      id: 'usr_rider_abc_com',
      name: 'Rahul Sharma',
      email: 'rider@abc.com',
      passwordHash: defaultPasswordHash,
      role: 'passenger',
      phone: '+91 98765 56789',
      rating: 4.8,
      ratings_count: 15,
      grade: 'Expert',
      id_verified: true,
      phone_verified: true,
      email_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      created_at: '2024-02-10T10:00:00.000Z'
    }
  ];
}
