export interface UpdateSelection {
  type: 'add' | 'update' | 'delete';
  id?: string;
  content?: { x: number; y: number; width: number; height: number; node: any };
}

