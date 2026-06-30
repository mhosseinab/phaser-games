import { BlockTheme } from '@blublux/engine-block/src/view/BlockScene';

export const beaverTheme: BlockTheme = {
  cellSize: 76,
  boardX: 56,
  boardY: 300,
  trayY: 1000,
  colors: {
    boardBg: 0x5c4033,
  },
  atlasKeys: { game: 'game' },
  frames: { block: 'wood_block', empty: 'wood_empty' },
  sfx: {
    place: 'place',
    clear: 'clear',
    gameover: 'gameover',
    invalid: 'invalid',
    select: 'select'
  }
};
