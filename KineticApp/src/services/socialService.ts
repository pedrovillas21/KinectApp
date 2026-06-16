import api from './api';
import type {
  UserCard,
  SquadMember,
  FeedPostData,
  Comment,
  CreatePostRequest,
  Page,
  PendingRequest,
  Story,
  StoryGroup,
  CreateStoryRequest,
} from '../types';

export const avatarFallback = (id: string, url?: string | null): string =>
  url ?? `https://i.pravatar.cc/150?u=${id}`;

// Sobe um arquivo local (file://) para o Storage via backend e devolve a URL
// pública. Sobrescreve o Content-Type para multipart por requisição: o axios
// usa application/json por padrão (api.ts), e o React Native só monta o
// boundary correto quando o header é multipart/form-data.
export const uploadMedia = async (
  uri: string,
  folder: 'posts' | 'stories' = 'posts',
): Promise<string> => {
  const name = uri.split('/').pop() ?? `${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(name);
  const ext = (match?.[1] ?? 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('file', { uri, name, type } as any);
  const res = await api.post<{ url: string }>('/social/media', form, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

export const searchUsers = async (q: string): Promise<UserCard[]> => {
  const res = await api.get<UserCard[]>('/social/users/search', { params: { q } });
  return res.data;
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const res = await api.get<PendingRequest[]>('/social/connections/pending');
  return res.data;
};

export const sendConnection = async (addresseeId: string): Promise<void> => {
  await api.post('/social/connections', { addresseeId });
};

// userId = id do outro usuário da conexão (quem enviou / quem está no card).
export const acceptConnection = async (userId: string): Promise<void> => {
  await api.post(`/social/connections/${userId}/accept`);
};

export const removeConnection = async (userId: string): Promise<void> => {
  await api.delete(`/social/connections/${userId}`);
};

export const toggleInSquad = async (userId: string): Promise<void> => {
  await api.post(`/social/squad/${userId}/toggle`);
};

export const getSquad = async (): Promise<SquadMember[]> => {
  const res = await api.get<SquadMember[]>('/social/squad');
  return res.data;
};

export const getSquadStatus = async (): Promise<SquadMember[]> => {
  const res = await api.get<SquadMember[]>('/social/squad/status');
  return res.data;
};

export const getFeed = async (page = 0, size = 10): Promise<Page<FeedPostData>> => {
  const res = await api.get<Page<FeedPostData>>('/social/feed', { params: { page, size } });
  return res.data;
};

export const createPost = async (req: CreatePostRequest): Promise<FeedPostData> => {
  const res = await api.post<FeedPostData>('/social/posts', req);
  return res.data;
};

// ── Stories (efêmeras, expiram em 24h) ──────────────────────────────────────
export const getStories = async (): Promise<StoryGroup[]> => {
  const res = await api.get<StoryGroup[]>('/social/stories');
  return res.data;
};

export const createStory = async (req: CreateStoryRequest): Promise<Story> => {
  const res = await api.post<Story>('/social/stories', req);
  return res.data;
};

export const likePost = async (postId: string): Promise<number> => {
  const res = await api.post<{ likesCount: number }>(`/social/posts/${postId}/like`);
  return res.data.likesCount;
};

export const unlikePost = async (postId: string): Promise<number> => {
  const res = await api.delete<{ likesCount: number }>(`/social/posts/${postId}/like`);
  return res.data.likesCount;
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const res = await api.get<Comment[]>(`/social/posts/${postId}/comments`);
  return res.data;
};

export const addComment = async (postId: string, body: string): Promise<Comment> => {
  const res = await api.post<Comment>(`/social/posts/${postId}/comments`, { body });
  return res.data;
};

export const startWorkoutPresence = async (): Promise<string> => {
  const res = await api.post<{ sessionId: string }>('/sessions/start');
  return res.data.sessionId;
};

export const endWorkoutPresence = async (): Promise<void> => {
  await api.delete('/sessions/active');
};
