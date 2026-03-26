const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  date: string;
  endDate?: string;
  time?: string;
  duration?: string;
  city: City;
  category: Category;
  address?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  city?: string;
  category?: string;
  featured?: boolean;
  status?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Fetch Wrapper ──────────────────────────────────────────────────────────

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Events ─────────────────────────────────────────────────────────────────

export async function getEvents(
  filters: EventFilters = {}
): Promise<PaginatedResponse<Event>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return fetchApi<PaginatedResponse<Event>>(
    `/events${query ? `?${query}` : ''}`
  );
}

export async function getEventBySlug(slug: string): Promise<Event> {
  return fetchApi<Event>(`/events/${slug}`);
}

export async function createEvent(data: FormData | Record<string, unknown>): Promise<Event> {
  const isForm = data instanceof FormData;
  return fetchApi<Event>('/events', {
    method: 'POST',
    body: isForm ? data : JSON.stringify(data),
  });
}

export async function updateEvent(
  id: string,
  data: FormData | Record<string, unknown>
): Promise<Event> {
  const isForm = data instanceof FormData;
  return fetchApi<Event>(`/events/${id}`, {
    method: 'PUT',
    body: isForm ? data : JSON.stringify(data),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return fetchApi<void>(`/events/${id}`, { method: 'DELETE' });
}

export async function getAdminEvents(): Promise<Event[]> {
  return fetchApi<Event[]>('/events/admin/all');
}

// ── Cities ─────────────────────────────────────────────────────────────────

export async function getCities(): Promise<City[]> {
  return fetchApi<City[]>('/cities');
}

export async function getCityBySlug(slug: string): Promise<City> {
  return fetchApi<City>(`/cities/${slug}`);
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/categories');
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  return fetchApi<Category>(`/categories/${slug}`);
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getMe(): Promise<User> {
  return fetchApi<User>('/auth/me');
}

// ── Favorites ──────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<Event[]> {
  return fetchApi<Event[]>('/favorites');
}

export async function addFavorite(eventId: string): Promise<void> {
  return fetchApi<void>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}

export async function removeFavorite(eventId: string): Promise<void> {
  return fetchApi<void>(`/favorites/${eventId}`, { method: 'DELETE' });
}
