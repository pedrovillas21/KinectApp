import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'rest';
let ready: Promise<boolean> | null = null;

// Android 13+ só mostra o pedido de permissão depois que existe um canal.
async function ensureReady(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Descanso',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Aviso local de "descanso concluído" para quando o app está em segundo plano ou com a
 * tela bloqueada. Com o app aberto o sistema não o exibe (não há setNotificationHandler):
 * aí quem avisa é a vibração e o balão do treino. Devolve o id para cancelar, ou null.
 */
export async function scheduleRestEnd(endsAt: number): Promise<string | null> {
  if (endsAt <= Date.now()) return null;
  try {
    ready ??= ensureReady();
    if (!(await ready)) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Descanso concluído', body: 'Hora da próxima série.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endsAt, channelId: CHANNEL_ID },
    });
  } catch {
    // Sem notificação o treino segue igual: é só conveniência.
    ready = null;
    return null;
  }
}

export function cancelRestEnd(id: string): void {
  Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
