export type NexusRole = "user" | "ai";

export type Participant = {
  id: string;
  name: string;
  initials: string;
  isSelf?: boolean;
  micOn: boolean;
  camOn: boolean;
  joinedAt: number;
};

export type ChatMessage = {
  id: string;
  role: NexusRole;
  text: string;
  author?: string;
  createdAt: number;
};

export type Decision = {
  id: string;
  text: string;
  createdAt: number;
};

export type ActionItem = {
  id: string;
  text: string;
  owner?: string;
  createdAt: number;
};

export type RoomFiles = Record<string, string>;

export type MeetingSummary = {
  overview: string;
  decisions: string[];
  actionItems: string[];
  codeChanges: string[];
  openQuestions: string[];
  nextSteps: string[];
};

export type NexusRoom = {
  id: string;
  name: string;
  hostName: string;
  summaryEmail: string | null;
  createdAt: number;
  endedAt: number | null;
  participants: Participant[];
  messages: ChatMessage[];
  files: RoomFiles;
  decisions: Decision[];
  actionItems: ActionItem[];
  summary: MeetingSummary | null;
};

export type AiPatch = {
  file: string;
  summary: string;
  newContent: string;
};
