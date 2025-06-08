declare namespace Gemini {
    interface Request {
      prompt: string;
      context?: string;
    }
  
    interface Response {
      tips?: string[];
      response?: string;
      error?: string;
    }
  }