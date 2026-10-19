import { IVideoProvider } from './types.js';
import { DemoVideoProvider } from './demoProvider.js';
import { GoogleVeoVideoProvider } from './veoProvider.js';
import { ReplicateVideoProvider } from './replicateProvider.js';
import { ProviderCapability } from '../../src/types/index.js';

class ProviderRegistry {
  private providers: Map<string, IVideoProvider> = new Map();
  private activeProviderId: string = 'demo-procedural';

  constructor() {
    this.register(new DemoVideoProvider());
    this.register(new GoogleVeoVideoProvider());
    this.register(new ReplicateVideoProvider());

    // Auto-select Veo if GEMINI_API_KEY is available, otherwise default to demo
    const veoCap = this.providers.get('google-veo-2')?.getCapabilities();
    if (veoCap?.isConfigured) {
      this.activeProviderId = 'google-veo-2';
    } else {
      this.activeProviderId = 'demo-procedural';
    }
  }

  register(provider: IVideoProvider) {
    this.providers.set(provider.id, provider);
  }

  get(id: string): IVideoProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): IVideoProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      return this.providers.get('demo-procedural')!;
    }
    return provider;
  }

  setActiveProvider(id: string): boolean {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      return true;
    }
    return false;
  }

  getAllCapabilities(): ProviderCapability[] {
    return Array.from(this.providers.values()).map(p => p.getCapabilities());
  }
}

export const providerRegistry = new ProviderRegistry();
