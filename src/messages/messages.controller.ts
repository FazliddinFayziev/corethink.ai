import { Response } from 'express';
import { Controller, Post, Body, Res } from '@nestjs/common';
import { RequestHandlerService } from './services/request-handler.service';
import { TogetherChatSteamControllerDto } from './dto/messages.dto';
import { MessagesService } from './services/messages.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly requestHandler: RequestHandlerService
  ) { }

  @Post('api/chat')
  async together(@Body() body: TogetherChatSteamControllerDto, @Res() res: Response): Promise<void | Response> {
    const { messages, model, stream = true, options } = body;
    if (stream) { return this.requestHandler.handleStreamingRequest(messages, model, options, res) }
    else { return this.requestHandler.handleNonStreamingRequest(messages, model, options, res) }
  }

  // @Post('togetherChatWithTools')
  // async togetherChatWithTools(
  //   @Body('messages') messages: ChatMessage[],
  //   @Body('tools') tools?: any[],
  //   @Body('model') model?: string
  // ): Promise<ChatResponse> {
  //   try {
  //     const data = await this.messagesService.togetherChatWithTools(messages, tools, model);
  //     return {
  //       success: true,
  //       data,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message || 'Together AI tools service error',
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }

  // @Post('chat')
  // async chat(@Body('messages') messages: ChatMessage[]): Promise<ChatResponse> {
  //   try {
  //     const data = await this.messagesService.chat(messages);
  //     return {
  //       success: true,
  //       data,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message || 'Chat service error',
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }

  // @Post('sql')
  // async textToSql(@Body('question') question: string): Promise<ChatResponse> {
  //   try {
  //     const data = await this.messagesService.textToSql(question);
  //     return {
  //       success: true,
  //       data,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message || 'Text-to-SQL service error',
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }

//   @Post('process-code')
//   async processCode(
//     @Body() body: {
//       messageId: string;
//       files: Array<{
//         id: string;
//         filename: string;
//         language: string;
//         code: string;
//       }>;
//       context: string;
//       requestType: 'initial' | 'partial' | 'fix';
//       missingFiles?: string[];
//     },
//     @Res() res: Response
//   ) {
//     try {
//       // Step 1: Generate strict AI prompt
//       const { systemPrompt, userPrompt } = this.generatePrompts(body);

//       // Step 2: Get AI response with strict parameters
//       const aiResponse = await this.getAIResponse(systemPrompt, userPrompt);

//       // Step 3: Extract and validate pure JSON
//       const parsedResponse = this.extractPureJson(aiResponse);

//       // Step 4: Build complete sandpack structure
//       const sandpackStructure = this.buildSandpackStructure(
//         parsedResponse,
//         body.files
//       );

//       res.json({
//         success: true,
//         data: sandpackStructure,
//         timestamp: new Date().toISOString()
//       });

//     } catch (error) {
//       console.error('PROCESSING ERROR:', error);
//       res.status(500).json({
//         success: false,
//         error: error.message,
//         fallback: this.generateFallbackStructure(body.files),
//         timestamp: new Date().toISOString()
//       });
//     }
//   }

//   // ===== PROMPT GENERATION ===== //
//   private generatePrompts(body: any) {
//     const systemPrompt = `You are a Senior React Developer creating Sandpack environments.
    
// STRICT REQUIREMENTS:
// 1. Respond ONLY with valid JSON in this exact format:
// {
//   "files": [
//     {"filename": "path/to/file.ext", "code": "complete valid code"},
//     ...
//   ],
//   "metadata": {
//     "template": "react",
//     "dependencies": {"package": "version"},
//     "devDependencies": {"package": "version"}
//   }
// }

// 2. MUST include:
// - src/index.js (React 18 syntax)
// - src/App.jsx (or main component)
// - package.json
// - Any CSS files

// 3. ABSOLUTELY NO:
// - Markdown
// - Code blocks
// - Explanations
// - Text outside JSON

// FAILURE TO COMPLY WILL BREAK PRODUCTION!`;

//     const userPrompt = `Create a Sandpack environment for:
// Context: ${body.context}
// Files: ${JSON.stringify(body.files.map(f => ({
//       filename: f.filename,
//       language: f.language,
//       lines: f.code.split('\n').length
//     })))}
// ${body.missingFiles?.length ? `Missing files: ${body.missingFiles.join(', ')}` : ''}`;

//     return { systemPrompt, userPrompt };
//   }

//   // ===== AI COMMUNICATION ===== //
//   private async getAIResponse(systemPrompt: string, userPrompt: string) {
//     const response = await this.messagesService.togetherChat(
//       [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt }
//       ],
//       'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
//       {
//         maxTokens: 4096,
//         temperature: 0.1,
//         stop: ['```', '---'] // Prevent markdown
//       }
//     );
//     return response.content;
//   }

//   // ===== RESPONSE PROCESSING ===== //
//   private extractPureJson(content: string): any {
//     // First try to parse directly
//     try {
//       return JSON.parse(content.trim());
//     } catch (e) {
//       // If fails, try extracting JSON from potential wrapper
//       const jsonMatch = content.match(/\{[\s\S]*\}/);
//       if (!jsonMatch) {
//         throw new Error('No valid JSON found in AI response');
//       }

//       try {
//         return JSON.parse(jsonMatch[0]);
//       } catch (e) {
//         console.error('RAW INVALID CONTENT:', content);
//         throw new Error('Invalid JSON format from AI');
//       }
//     }
//   }

//   // ===== STRUCTURE BUILDING ===== //
//   private buildSandpackStructure(parsedResponse: any, originalFiles: any[]) {
//     // Validate basic structure
//     if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
//       throw new Error('Invalid files array in response');
//     }

//     if (!parsedResponse.metadata || !parsedResponse.metadata.template) {
//       throw new Error('Missing metadata in response');
//     }

//     // Process all files with strict validation
//     const processedFiles = parsedResponse.files.map(file => {
//       if (!file.filename || !file.code) {
//         throw new Error('File missing filename or code');
//       }

//       return {
//         filename: file.filename,
//         code: this.validateAndFixCode(file.code, file.filename),
//         active: true
//       };
//     });

//     // Add any original files not in response
//     originalFiles.forEach(original => {
//       if (!processedFiles.some(f => f.filename === original.filename)) {
//         processedFiles.push({
//           filename: original.filename,
//           code: this.validateAndFixCode(original.code, original.filename),
//           active: true
//         });
//       }
//     });

//     // Ensure required files exist
//     this.ensureRequiredFiles(processedFiles, parsedResponse.metadata.template);

//     return {
//       files: processedFiles,
//       metadata: this.enforceMetadataStandards(parsedResponse.metadata)
//     };
//   }

//   private validateAndFixCode(code: string, filename: string): string {
//     // Basic validation
//     if (typeof code !== 'string') {
//       throw new Error(`Invalid code in ${filename}`);
//     }

//     // Fix common issues
//     let fixedCode = code
//       .replace(/\\'/g, "'") // Fix escaped quotes
//       .replace(/\\"/g, '"') // Fix escaped double quotes
//       .replace(/\r?\n/g, '\n'); // Standardize line endings

//     // React-specific fixes
//     if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) {
//       if (!fixedCode.includes('import React')) {
//         fixedCode = `import React from 'react';\n${fixedCode}`;
//       }
//     }

//     // Ensure proper exports
//     if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.tsx')) {
//       if (!fixedCode.includes('export default') && !fixedCode.includes('module.exports')) {
//         if (filename.includes('App.')) {
//           fixedCode = fixedCode.replace(/(function App\(.*\)|const App =.*)/, '$1\nexport default App;');
//         }
//       }
//     }

//     return fixedCode;
//   }

//   private ensureRequiredFiles(files: any[], template: string) {
//     const filenames = files.map(f => f.filename);

//     // React requirements
//     if (template.includes('react')) {
//       if (!filenames.some(f => f.endsWith('index.js') || f.endsWith('index.tsx'))) {
//         files.push(this.createReactIndexFile(template));
//       }
//       if (!filenames.some(f => f.includes('App.'))) {
//         files.push(this.createReactAppFile(template));
//       }
//     }

//     // Always need package.json
//     if (!filenames.includes('package.json')) {
//       files.push(this.createPackageJson(template));
//     }
//   }

//   private createReactIndexFile(template: string) {
//     const isTS = template.includes('ts');
//     return {
//       filename: `src/index.${isTS ? 'tsx' : 'js'}`,
//       code: `import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);`,
//       active: true
//     };
//   }

//   private createReactAppFile(template: string) {
//     const isTS = template.includes('ts');
//     return {
//       filename: `src/App.${isTS ? 'tsx' : 'jsx'}`,
//       code: `import React from 'react';

// export default function App() {
//   return (
//     <div>
//       <h1>Hello World</h1>
//     </div>
//   );
// }`,
//       active: true
//     };
//   }

//   private createPackageJson(template: string) {
//     const base = {
//       name: "sandpack-app",
//       version: "1.0.0",
//       private: true,
//       main: "src/index.js",
//       dependencies: {
//         react: "^18.2.0",
//         "react-dom": "^18.2.0"
//       },
//       scripts: {
//         start: "react-scripts start",
//         build: "react-scripts build"
//       }
//     };

//     if (template.includes('ts')) {
//       base.dependencies['typescript'] = "^5.0.0";
//       base.dependencies['@types/react'] = "^18.0.0";
//       base.dependencies['@types/react-dom'] = "^18.0.0";
//     }

//     return {
//       filename: "package.json",
//       code: JSON.stringify(base, null, 2),
//       active: true
//     };
//   }

//   // ===== ERROR HANDLING ===== //
//   private generateFallbackStructure(originalFiles: any[]) {
//     return {
//       files: [
//         {
//           filename: 'src/index.js',
//           code: `import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);`,
//           active: true
//         },
//         {
//           filename: 'src/App.jsx',
//           code: `import React from 'react';

// export default function App() {
//   return (
//     <div>
//       <h1>Fallback Application</h1>
//     </div>
//   );
// }`,
//           active: true
//         },
//         {
//           filename: 'package.json',
//           code: JSON.stringify({
//             name: "fallback-app",
//             version: "1.0.0",
//             private: true,
//             dependencies: {
//               react: "^18.2.0",
//               "react-dom": "^18.2.0"
//             },
//             scripts: {
//               start: "react-scripts start"
//             }
//           }, null, 2),
//           active: true
//         },
//         ...originalFiles.filter(f =>
//           f.filename.endsWith('.css') ||
//           f.filename.endsWith('.html')
//         ).map(f => ({
//           ...f,
//           active: true
//         }))
//       ],
//       metadata: {
//         template: 'react',
//         dependencies: {
//           react: "^18.2.0",
//           "react-dom": "^18.2.0"
//         },
//         devDependencies: {}
//       }
//     };
//   }

//   private enforceMetadataStandards(metadata: any) {
//     return {
//       template: metadata.template || 'react',
//       title: metadata.title || 'React App',
//       description: metadata.description || 'Generated application',
//       dependencies: {
//         react: "^18.2.0",
//         "react-dom": "^18.2.0",
//         ...(metadata.dependencies || {})
//       },
//       devDependencies: metadata.devDependencies || {}
//     };
//   }


  // @Get('health')
  // async health(): Promise<ChatResponse> {
  //   try {
  //     const data = await this.messagesService.health();
  //     return {
  //       success: true,
  //       data,
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message || 'Health check failed',
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }
}