export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo",
  GPT4 = "gpt-4"
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = "ai" | "human";
