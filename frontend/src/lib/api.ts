const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  color?: string;
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
  city: City | null;
  category: Category | null;
  address?: string;
  lat?: number;
  lng?: number;
  currency?: string;
  status: string;
  featured: boolean;
  capacity?: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string } | null;
}

export interface PlanItem {
  id: string;
  planId: string;
  eventId: string;
  startTime?: string;
  endTime?: string;
  sortOrder: number;
  notes?: string;
  isPaid: boolean;
  cost: number;
  travelMode?: string;
  travelDuration?: number;
  travelDistance?: number;
  createdAt: string;
  event: Partial<Event> | null;
}

export interface Plan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  planDate?: string;
  status: string;
  shareCode: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
}

export interface PlanInvitation {
  id: string;
  planId: string;
  inviterId: string;
  inviteeEmail: string;
  inviteeId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  respondedAt?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  planItemId?: string;
  qrCode: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  scannedAt?: string;
  createdAt: string;
  event: Partial<Event> | null;
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
  dateFrom?: string;
  dateTo?: string;
  rating?: number;
  sortBy?: string;
  lat?: number;
  lng?: number;
  radius?: number;
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
  return fetchApi<Event[]>('/events/admin');
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

export async function googleAuth(credential: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
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

// ── Reviews ────────────────────────────────────────────────────────────────

export async function getReviews(
  eventId: string
): Promise<{ data: Review[] }> {
  return fetchApi<{ data: Review[] }>(`/reviews?eventId=${eventId}`);
}

export async function createReview(
  eventId: string,
  rating: number,
  comment: string
): Promise<Review> {
  return fetchApi<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ eventId, rating, comment }),
  });
}

// ── Plans ──────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<{ data: Plan[] }> {
  return fetchApi<{ data: Plan[] }>('/plans');
}

export async function createPlan(data: {
  title: string;
  description?: string;
  planDate?: string;
}): Promise<Plan> {
  return fetchApi<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPlan(id: string): Promise<Plan> {
  return fetchApi<Plan>(`/plans/${id}`);
}

export async function updatePlan(
  id: string,
  data: Partial<{ title: string; description: string; planDate: string; status: string }>
): Promise<Plan> {
  return fetchApi<Plan>(`/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePlan(id: string): Promise<void> {
  return fetchApi<void>(`/plans/${id}`, { method: 'DELETE' });
}

// ── Plan Items ─────────────────────────────────────────────────────────────

export async function getPlanItems(
  planId: string
): Promise<{ data: PlanItem[] }> {
  return fetchApi<{ data: PlanItem[] }>(`/plans/${planId}/items`);
}

export async function addPlanItem(
  planId: string,
  data: { eventId: string; startTime?: string; endTime?: string; notes?: string }
): Promise<PlanItem> {
  return fetchApi<PlanItem>(`/plans/${planId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePlanItem(
  planId: string,
  itemId: string,
  data: Partial<{
    sortOrder: number;
    startTime: string;
    endTime: string;
    notes: string;
    travelMode: string;
    travelDuration: number;
    travelDistance: number;
  }>
): Promise<PlanItem> {
  return fetchApi<PlanItem>(`/plans/${planId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function removePlanItem(
  planId: string,
  itemId: string
): Promise<void> {
  return fetchApi<void>(`/plans/${planId}/items/${itemId}`, {
    method: 'DELETE',
  });
}

// ── Plan Invitations ───────────────────────────────────────────────────────

export async function inviteToPlan(
  planId: string,
  email: string
): Promise<PlanInvitation> {
  return fetchApi<PlanInvitation>(`/plans/${planId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getPlanInvitations(
  planId: string
): Promise<{ data: PlanInvitation[] }> {
  return fetchApi<{ data: PlanInvitation[] }>(`/plans/${planId}/invite`);
}

export async function respondToInvitation(
  inviteId: string,
  status: 'ACCEPTED' | 'DECLINED'
): Promise<PlanInvitation> {
  return fetchApi<PlanInvitation>(`/plans/invite/${inviteId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ── Shared Plans ───────────────────────────────────────────────────────────

export async function getSharedPlan(shareCode: string): Promise<Plan> {
  return fetchApi<Plan>(`/plans/shared/${shareCode}`);
}

// ── Tickets ────────────────────────────────────────────────────────────────

export async function getTickets(): Promise<{ data: Ticket[] }> {
  return fetchApi<{ data: Ticket[] }>('/tickets');
}

export async function createTicket(
  eventId: string,
  planItemId?: string
): Promise<Ticket> {
  return fetchApi<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ eventId, planItemId }),
  });
}

export async function getTicket(id: string): Promise<Ticket> {
  return fetchApi<Ticket>(`/tickets/${id}`);
}

export async function scanTicket(id: string): Promise<Ticket> {
  return fetchApi<Ticket>(`/tickets/${id}`, {
    method: 'PUT',
  });
}

// ── Stripe ────────────────────────────────────────────────────────────────

export async function createCheckoutSession(data: {
  eventId: string;
  planItemId?: string;
  planId?: string;
}): Promise<{ url: string; sessionId: string }> {
  return fetchApi<{ url: string; sessionId: string }>('/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
