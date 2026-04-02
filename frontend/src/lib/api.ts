const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ── Types ──────────────────────────────────────────────────────────────────

export type UserType = 'USER' | 'BUSINESS' | 'SUPERADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  userType: UserType;
  avatar?: string;
  onboardingCompleted?: boolean;
  companyName?: string;
  companyDescription?: string;
  companyLogo?: string;
  companyWebsite?: string;
  phone?: string;
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
  videoUrl?: string;
  gallery?: string[];
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
  refundPolicyId?: string;
  organizerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundPolicy {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  daysBeforeEvent: number;
  refundPercentage: number;
  isDefault: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  usersByType: { type: string; count: number }[];
  eventsByStatus: { status: string; count: number }[];
  recentUsers: User[];
  recentEvents: Event[];
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
  password: string,
  userType: UserType = 'USER',
  companyName?: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, userType, companyName }),
  });
}

export async function updateProfile(data: Partial<{
  name: string;
  avatar: string;
  phone: string;
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  companyWebsite: string;
  onboardingCompleted: boolean;
}>): Promise<User> {
  return fetchApi<User>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
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

// ── Super Admin ──────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return fetchApi<AdminStats>('/admin/stats');
}

export async function getAdminUsers(params?: {
  userType?: string;
  page?: number;
  limit?: number;
  q?: string;
}): Promise<PaginatedResponse<User>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
  }
  const query = search.toString();
  return fetchApi<PaginatedResponse<User>>(`/admin/users${query ? `?${query}` : ''}`);
}

export async function updateUserRole(userId: string, data: {
  role?: string;
  userType?: UserType;
}): Promise<User> {
  return fetchApi<User>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  return fetchApi<void>(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function getAllEventsAdmin(params?: {
  status?: string;
  page?: number;
  limit?: number;
  q?: string;
}): Promise<PaginatedResponse<Event>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
  }
  const query = search.toString();
  return fetchApi<PaginatedResponse<Event>>(`/admin/events${query ? `?${query}` : ''}`);
}

// ── Business ─────────────────────────────────────────────────────────────

export async function getBusinessEvents(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Event>> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
  }
  const query = search.toString();
  return fetchApi<PaginatedResponse<Event>>(`/business/events${query ? `?${query}` : ''}`);
}

export async function getBusinessStats(): Promise<{
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  eventsByStatus: { status: string; count: number }[];
  recentTickets: Ticket[];
}> {
  return fetchApi('/business/stats');
}

export async function getRefundPolicies(): Promise<RefundPolicy[]> {
  return fetchApi<RefundPolicy[]>('/business/refund-policies');
}

export async function createRefundPolicy(data: Partial<RefundPolicy>): Promise<RefundPolicy> {
  return fetchApi<RefundPolicy>('/business/refund-policies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRefundPolicy(id: string, data: Partial<RefundPolicy>): Promise<RefundPolicy> {
  return fetchApi<RefundPolicy>(`/business/refund-policies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRefundPolicy(id: string): Promise<void> {
  return fetchApi<void>(`/business/refund-policies/${id}`, { method: 'DELETE' });
}

// ── Venues ──────────────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  slug: string;
  name: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  category?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  rating?: number;
  reviewCount?: number;
  followerCount?: number;
  verified?: boolean;
  featured?: boolean;
  city?: City | null;
  eventsCount?: number;
}

export async function getVenues(params?: { city?: string; category?: string; featured?: boolean }): Promise<Venue[]> {
  const search = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) search.set(k, String(v)); });
  return fetchApi<Venue[]>(`/venues${search.toString() ? `?${search}` : ''}`);
}

export async function getVenue(slug: string): Promise<Venue> {
  return fetchApi<Venue>(`/venues/${slug}`);
}

export async function followVenue(slug: string): Promise<{ following: boolean; followerCount: number }> {
  return fetchApi(`/venues/${slug}/follow`, { method: 'POST' });
}

export async function checkFollow(slug: string): Promise<{ following: boolean; notifications: boolean }> {
  return fetchApi(`/venues/${slug}/follow`);
}

export async function getVenueEvents(slug: string): Promise<Event[]> {
  return fetchApi<Event[]>(`/venues/${slug}/events`);
}
