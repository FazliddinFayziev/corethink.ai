export enum AIProvider {
    TOGETHER = 'together',
    OPENAI = 'openai',
    CLAUDE = 'claude',
    TC_WRAPPER = 'tc_wrapper',
    SQL_API = 'sql_api'
}

export const MODEL_PROVIDER_MAP: Record<string, AIProvider> = {
  'claude-3-5-sonnet-20241022': AIProvider.CLAUDE,
  'claude-3-5-haiku-20241022': AIProvider.CLAUDE,
  'claude-3-opus-20240229': AIProvider.CLAUDE, // Still available but older
  
  // Together AI models
  'deepseek-ai/DeepSeek-V3': AIProvider.TOGETHER,
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': AIProvider.TOGETHER,
  
  // OpenAI models
  'gpt-4o': AIProvider.OPENAI,
  'gpt-4o-mini': AIProvider.OPENAI,
  'gpt-4-turbo': AIProvider.OPENAI,
};

export const getProviderByModel = (model: string): AIProvider => {
    const provider = MODEL_PROVIDER_MAP[model];
    if (!provider) {
        throw new Error(`Unsupported model: ${model}. Please check the model name.`);
    }
    return provider;
};