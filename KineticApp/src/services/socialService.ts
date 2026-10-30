import api from './api';
import { imageFormData } from '../utils/compressImage';
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

// Sobe um arquivo local (file://) para o Storage via backend e devolve o
// identificador do arquivo — não um endereço navegável. O bucket é privado; quem
// entrega link (temporário) é o feed/stories, só para conexões aceitas.
// Sobrescreve o Content-Type para multipart por requisição: o axios usa
// application/json por padrão (api.ts), e o React Native só monta o boundary
// correto quando o header é multipart/form-data.
export const uploadMedia = async (
  originalUri: string,
  folder: 'posts' | 'stories' = 'posts',
): Promise<string> => {
  const form = await imageFormData(originalUri);
  const res = await api.post<{ url: string }>('/social/media', form, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

// Remove uma mídia já enviada ao Storage. Usado como limpeza compensatória quando
// o upload deu certo mas a criação do post/story falhou (evita mídia órfã no bucket).
export const deleteMedia = async (url: string): Promise<void> => {
  await api.delete('/social/media', { params: { url } });
};

/**
 * Sobe a foto e cria o post/story com ela. Se a criação falhar depois do upload, apaga a
 * mídia órfã (best-effort) e repassa o erro para a tela avisar.
 */
export async function uploadAndCreate<T>(
  localUri: string,
  folder: 'posts' | 'stories',
  create: (mediaUrl: string) => Promise<T>,
): Promise<T> {
  const mediaUrl = await uploadMedia(localUri, folder);
  try {
    return await create(mediaUrl);
  } catch (e) {
    deleteMedia(mediaUrl).catch(() => {});
    throw e;
  }
}

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

export const getSquad = async (): Promise<SquadMember[]> => {
  const res = await api.get<SquadMember[]>('/social/squad');
  return res.data;
};

export const getFeed = async (page = 0, size = 10): Promise<Page<FeedPostData>> => {
  const res = await api.get<Page<FeedPostData>>('/social/feed', { params: { page, size } });
  return res.data;
};

/** Posts de um usuário (o próprio ou amigo aceito; os demais recebem 403). */
export const getUserPosts = async (userId: string, page = 0, size = 12): Promise<Page<FeedPostData>> => {
  const res = await api.get<Page<FeedPostData>>(`/social/users/${userId}/posts`, { params: { page, size } });
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
