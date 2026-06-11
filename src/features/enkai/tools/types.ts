export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  description: string;
  required: boolean;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  actionRequired?: boolean;
}

export interface ToolRegistry {
  tools: Map<string, ToolDefinition>;
  register: (tool: ToolDefinition) => void;
  execute: (name: string, params: Record<string, unknown>) => Promise<ToolResult>;
  getTool: (name: string) => ToolDefinition | undefined;
  listTools: () => ToolDefinition[];
}
