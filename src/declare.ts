import React from 'react';

type selectionChageType = 'create' | 'update' | 'add' | 'delete' | 'move-start' | 'move-ing' |
  'move-end' | 'resize-start' | 'resize-ing' | 'resize-end';
export type contentType = {
  x: number;
  y: number;
  width: number;
  height: number;
  node?: any;
  lastX?: number;
  lastY?: number;
};
export type selectionsType = { [id: string]: contentType };

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

export interface TransformXandYType {
  direction: 'right-bottom' | 'right-top' | 'left-top' | 'left-bottom';
  width: number;
  height: number;
  startX: number;
  startY: number;
}

export interface ComputedPositionType {
  position: { x: number; y: number; width: number; height: number };
  offsetX: number;
  offsetY: number;
  container: { width: number; height: number };
}

export type directionType = 'left-top' | 'top' | 'right-top' | 'right' | 'left-bottom' |
  'bottom' | 'right-bottom' | 'left';
export interface ComputedSizeType {
  direction: directionType;
  offset: number;
  position: number;
  containerSize?: number;
  sectionSize?: number;
}
