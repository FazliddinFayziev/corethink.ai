import { AIProvider } from "../helpers/model-provider-mapping";
import { ClaudeProvider, OpenAIProvider, SQLAPIProvider, TCWrapperProvider, TogetherProvider } from "./ai-provider";

export class AIProviderFactory {
  private static providers: Map<AIProvider, any> = new Map();
  private static isInitialized = false;
  private static initializationErrors: string[] = [];

  static initialize(config: {
    togetherApiKey?: string;
    openaiApiKey?: string;
    claudeApiKey?: string;
    tcApiKey?: string;
    tcBaseUrl?: string;
    sqlApiKey?: string;
    sqlBaseUrl?: string;
  }) {
    try {
      // Clear existing providers and errors
      this.providers.clear();
      this.initializationErrors = [];

      let initializedCount = 0;

      // Initialize Together AI
      if (config.togetherApiKey) {
        try {
          this.providers.set(AIProvider.TOGETHER, new TogetherProvider(config.togetherApiKey));
          console.log('✅ Together AI provider initialized');
          initializedCount++;
        } catch (error) {
          this.initializationErrors.push(`Together AI: ${error.message}`);
          console.error('❌ Failed to initialize Together AI:', error.message);
        }
      }

      // Initialize OpenAI
      if (config.openaiApiKey) {
        try {
          this.providers.set(AIProvider.OPENAI, new OpenAIProvider(config.openaiApiKey));
          console.log('✅ OpenAI provider initialized');
          initializedCount++;
        } catch (error) {
          this.initializationErrors.push(`OpenAI: ${error.message}`);
          console.error('❌ Failed to initialize OpenAI:', error.message);
        }
      }

      // Initialize Claude
      if (config.claudeApiKey) {
        try {
          this.providers.set(AIProvider.CLAUDE, new ClaudeProvider(config.claudeApiKey));
          console.log('✅ Claude provider initialized');
          initializedCount++;
        } catch (error) {
          this.initializationErrors.push(`Claude: ${error.message}`);
          console.error('❌ Failed to initialize Claude:', error.message);
        }
      }

      // Initialize TC Wrapper
      if (config.tcApiKey && config.tcBaseUrl) {
        try {
          this.providers.set(AIProvider.TC_WRAPPER, new TCWrapperProvider(config.tcApiKey, config.tcBaseUrl));
          console.log('✅ TC Wrapper provider initialized');
          initializedCount++;
        } catch (error) {
          this.initializationErrors.push(`TC Wrapper: ${error.message}`);
          console.error('❌ Failed to initialize TC Wrapper:', error.message);
        }
      }

      // Initialize SQL API
      if (config.sqlApiKey && config.sqlBaseUrl) {
        try {
          this.providers.set(AIProvider.SQL_API, new SQLAPIProvider(config.sqlApiKey, config.sqlBaseUrl));
          console.log('✅ SQL API provider initialized');
          initializedCount++;
        } catch (error) {
          this.initializationErrors.push(`SQL API: ${error.message}`);
          console.error('❌ Failed to initialize SQL API:', error.message);
        }
      }

      this.isInitialized = true;
      
      console.log(`🚀 AI Provider Factory initialized with ${initializedCount} providers`);
      
      if (this.initializationErrors.length > 0) {
        console.warn(`⚠️  ${this.initializationErrors.length} providers failed to initialize:`, this.initializationErrors);
      }

      if (initializedCount === 0) {
        throw new Error('No AI providers were successfully initialized. Please check your configuration.');
      }

    } catch (error) {
      console.error('❌ Critical failure in AI Provider Factory initialization:', error);
      this.isInitialized = false;
      throw new Error(`AI Provider Factory initialization failed: ${error.message}`);
    }
  }

  static getProvider(providerType: AIProvider) {
    if (!this.isInitialized) {
      throw new Error('AI Provider Factory not initialized. Call initialize() first.');
    }

    const provider = this.providers.get(providerType);
    if (!provider) {
      const availableProviders = Array.from(this.providers.keys());
      throw new Error(
        `Provider ${providerType} not initialized or not available. ` +
        `Available providers: ${availableProviders.length > 0 ? availableProviders.join(', ') : 'none'}`
      );
    }
    return provider;
  }

  static getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  static isProviderAvailable(providerType: AIProvider): boolean {
    return this.providers.has(providerType);
  }

  static getProviderCount(): number {
    return this.providers.size;
  }

  static getInitializationErrors(): string[] {
    return [...this.initializationErrors];
  }

  static getProviderStatus(): Record<AIProvider, boolean> {
    return {
      [AIProvider.TOGETHER]: this.isProviderAvailable(AIProvider.TOGETHER),
      [AIProvider.OPENAI]: this.isProviderAvailable(AIProvider.OPENAI),
      [AIProvider.CLAUDE]: this.isProviderAvailable(AIProvider.CLAUDE),
      [AIProvider.TC_WRAPPER]: this.isProviderAvailable(AIProvider.TC_WRAPPER),
      [AIProvider.SQL_API]: this.isProviderAvailable(AIProvider.SQL_API),
    };
  }

  static reset(): void {
    this.providers.clear();
    this.initializationErrors = [];
    this.isInitialized = false;
    console.log('🔄 AI Provider Factory reset');
  }

  static healthCheck(): {
    isHealthy: boolean;
    providerCount: number;
    availableProviders: AIProvider[];
    errors: string[];
  } {
    return {
      isHealthy: this.isInitialized && this.providers.size > 0,
      providerCount: this.providers.size,
      availableProviders: this.getAvailableProviders(),
      errors: this.getInitializationErrors(),
    };
  }
}