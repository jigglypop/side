import type { Message } from '../types/message';
import type { AIModel } from '../atoms/settingsAtoms';

interface StreamCallbacks {
  onChunk: (modelId: string, chunk: string) => void;
  onComplete: (modelId: string) => void;
  onError: (modelId: string, error: Error) => void;
}

// 멀티 모델 스트리밍
export const streamMultipleModels = async (
  messages: Message[],
  models: AIModel[],
  callbacks: StreamCallbacks
) => {
  const formattedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

  // 각 모델에 동시 요청
  const promises = models.map(async (model) => {
    try {
      const response = await fetch(model.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        body: JSON.stringify({
          model: model.model,
          messages: formattedMessages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`${model.name} API 요청 실패: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(`${model.name} 스트림을 읽을 수 없습니다.`);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              callbacks.onComplete(model.id);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                callbacks.onChunk(model.id, content);
              }
            } catch (e) {
              // 파싱 에러는 무시
            }
          }
        }
      }
      callbacks.onComplete(model.id);
    } catch (error) {
      callbacks.onError(model.id, error instanceof Error ? error : new Error('알 수 없는 오류'));
    }
  });

  await Promise.allSettled(promises);
};

// 단일 모델 스트리밍
export const streamSingleModel = async (
  messages: Message[],
  model: AIModel,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  try {
    const formattedMessages = messages.map(({ id, timestamp, ...rest }) => rest);

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.model,
        messages: formattedMessages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // 파싱 에러 무시
          }
        }
      }
    }
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('알 수 없는 오류'));
  }
};

