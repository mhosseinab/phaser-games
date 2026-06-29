export interface ColorTheme {
  color: number;
  symbolFrame: string;
}

export interface SortTheme {
  palette: ColorTheme[];
  atlasKeys: {
    game: string;
    background?: string;
  };
  frames: {
    container: string;
    segment: string;
    particle?: string;
  };
  sfx: {
    pour: string;
    blocked: string;
    win: string;
    select: string;
  };
  copy: {
    winMessage: string;
  };
}
