import api from './api';
import type {
  UserCard,
  SquadMember,
  FeedPostData,
  Comment,
  CreatePostRequest,
  Page,
} from '../types';

export const avatarFallback = (id: string, url?: string | null): string =>
  url ?? `https://i.pravatar.cc/150?u=${id}`;

export const searchUsers = async (q: string): Promise<UserCard[]> => {
  const res = await api.get<UserCard[]>('/social/users/search', { params: { q } });
  return res.data;
};

export const sendConnection = async (addresseeId: string): Promise<void> => {
  await api.post('/social/connections', { addresseeId });
};

export const acceptConnection = async (connectionId: string): Promise<void> => {
  await api.post(`/social/connections/${connectionId}/accept`);
};

export const removeConnection = async (connectionId: string): Promise<void> => {
  await api.delete(`/social/connections/${connectionId}`);
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
