import React from 'react';

type selectionChageType = 'create' | 'update' | 'add' | 'delete' | 'move-start' | 'move-ing' |
  'move-end' | 'resize-start' | 'resize-ing' | 'resize-end';
type contentType = { x: number; y: number; width: number; height: number; node?: any };
type selectionsType = { [id: string]: contentType };

export interface ReactSelectionDrawProps {
  className?: string;
  style?: React.CSSProperties;
  selectionChange?: (type: selectionChageType, selections: selectionsType, id: string) => void;
  selectionRender?: (id: string) => any;
  onDelete?: (id: string) => void | Promise<{}>;
  selectionOnClick?: (id: string, target) => void;
}

export interface UpdateSelection {
  type: 'add' | 'update' | 'delete';
  id?: string;
  content?: contentType;
}
