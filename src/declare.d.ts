type selectionChageType = 'create' | 'update' | 'add' | 'delete' | 'move-start' | 'move-ing' |
  'move-end' | 'resize-start' | 'resize-ing' | 'resize-end';
export type quadrangularDirectionType = 'right-bottom' | 'right-top' | 'left-bottom' | 'left-top';
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
  offset?: number;
  width?: number;
  height?: number;
  selectionChange?: (type: selectionChageType, selections: selectionsType, id: string) => void;
  selectionRender?: (id: string) => any;
  onDelete?: (id: string) => void | Promise<any>;
  selectionOnClick?: (id: string, target) => void;
  minWidth?: number;
  minHeight?: number;
  createOperator: (id) => React.ReactNode;
}

export interface UpdateSelection {
  type: 'add' | 'update' | 'delete' | 'get';
  id?: string;
  content?: contentType;
}

export interface TransformXandYType {
  direction: quadrangularDirectionType;
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

export type createSelectionPositionType = {
  x: number,
  y: number,
  width: number,
  height: number,
  startX: number,
  startY: number,
};

export type computedCreateType = {
  direction: quadrangularDirectionType
  offsetX?: number;
  offsetY?: number;
  containerSize: number;
  createPosition: createSelectionPositionType
};
