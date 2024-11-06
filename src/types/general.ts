export interface TranscriptionOptions {
  filePath: string;
  confidence: number;
  format: "json" | "text";
}

export interface DocumentData {
  content: string;
  metadata: {
    lastModified: Date;
    version: string;
    audioFile?: string;
    confidence?: boolean;
  };
}

export interface ExportOptions {
  template: string;
  format: "docx" | "pdf";
  metadata: Record<string, unknown>;
}

export interface FileDialogOptions {
  type: "audio" | "document";
  multiple?: boolean;
}

export interface ElectronBridge {
  file: {
    openDialog: (options: FileDialogOptions) => Promise<string[]>;
    getAppPath: () => Promise<string>;
    copyToInputFiles: (sourcePath: string) => Promise<string>;
  };
  document: {
    save: (data: DocumentData, path?: string) => Promise<string>;
    load: (path: string) => Promise<DocumentData>;
    export: (data: DocumentData, options: ExportOptions) => Promise<boolean>;
    watch: (
      callback: (event: "change" | "delete", path?: string) => void
    ) => () => void;
  };
  transcription: {
    start: (path: string, model: string) => Promise<void>;
    getStatus: () => Promise<"idle" | "processing" | "done">;
    cancel: () => Promise<void>;
  };
}

export interface WordMarkAttributes {
  confidence: string | null;
  offsetFrom: string | null;
  offsetTo: string | null;
  duration: string | null;
  wordIndex: string | null;
}
export interface Token {
  text: string;
  p: number;
  offsets: {
    from: number;
    to: number;
  };
  timestamps: {
    from: string;
    to: string;
  };
  t_dtw: number;
}

export interface Segment {
  text: string;
  timestamps: {
    from: string;
    to: string;
  };
  offsets: {
    from: number;
    to: number;
  };
  tokens: Token[];
}

export interface TranscriptionData {
  transcription: Segment[];
}

export interface ConsolidatedWord {
  text: string;
  confidence: number;
  offsets: {
    from: number;
    to: number;
  };
  tokens: Token[];
}
export type DocumentChangeEvent = "change" | "delete";
export type DocumentChangeCallback = (
  event: DocumentChangeEvent,
  path?: string
) => void;
export type ContentNode = {
  type: string;
  content?: ContentNode[]; 
  text?: string;
  marks?: {type:string}[];
  attrs?: {[key:string]:any};
}