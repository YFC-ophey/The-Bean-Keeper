interface OperationalAlertPayload {
  event: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

const alertWebhookUrl = process.env.SYNC_ALERT_WEBHOOK_URL;

export async function sendOperationalAlert(payload: OperationalAlertPayload): Promise<void> {
  if (!alertWebhookUrl) {
    return;
  }

  try {
    await fetch(alertWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to send operational alert:', error);
  }
}
