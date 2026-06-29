export type Color = number;
export type Container = Color[]; // bottom to top
export interface SortState {
  containers: Container[];
  capacity: number;
  colors: number;
}
export interface Move {
  from: number;
  to: number;
  count: number;
}
