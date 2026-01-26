import { RunAnywhere } from '@runanywhere/core';
import runtimeManager from './runtime';

class AppModelManager {
  constructor() {
    this.modelsReady = false;
    this.initializing = false;
  }

  async initializeModels(onProgress) {
    await runtimeManager.initialize();

    if (this.modelsReady) return;

    if (this.initializing) {
      while (!this.modelsReady) {
        await new Promise(r => setTimeout(r, 50));
      }
      return;
    }

    this.initializing = true;
    try {
      console.log('Downloading AI models...');

      const models = [
        { name: 'whisper-tiny-en', size: '~75MB' },
        { name: 'smollm-135m-instruct', size: '~135MB' },
        { name: 'en-US-neural-tts', size: '~50MB' },
      ];

      for (let i = 0; i < models.length; i++) {
        const model = models[i];

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: models.length,
            modelName: model.name,
            size: model.size,
          });
        }

        await RunAnywhere.downloadModel(model.name);
        console.log(`Downloaded: ${model.name}`);
      }

      this.modelsReady = true;
      console.log('All models ready!');
    } catch (error) {
      console.error('Failed to download models:', error);
      this.initializing = false;
      throw error;
    }
  }

  async checkModelsStatus() {
    await runtimeManager.initialize();

    try {
      const cached = await RunAnywhere.listCachedModels();
      return {
        whisper: cached.includes('whisper-tiny-en'),
        llm: cached.includes('smollm-135m-instruct'),
        tts: cached.includes('en-US-neural-tts'),
      };
    } catch (error) {
      console.error('Failed to check model status:', error);
      return {
        whisper: false,
        llm: false,
        tts: false,
      };
    }
  }

  async clearCache() {
    await runtimeManager.initialize();

    try {
      await RunAnywhere.clearModelCache();
      this.modelsReady = false;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }
}

export default new AppModelManager();
