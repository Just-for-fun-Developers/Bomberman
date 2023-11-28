import { between, swapValues } from '../common/utils';

// rows: number of rows
// cols: number of columns
// occupiedPer: percentage of cells occupied, should be a float between [0,1]
export function createMaze(rows: number, cols: number, occupiedPer: number) {
  const cells: number[] = [];
  const maze: number[][] = [];
  for (let cellId = 0; cellId < rows * cols; cellId++) {
    cells.push(cellId);
  }

  // Filling maze with empty cells
  for (let row = 0; row < rows; row++) {
    maze.push([]);
    for (let col = 0; col < cols; col++) {
      maze[row].push(0);
    }
  }

  const numberBlockedCells = Math.floor(rows * cols * occupiedPer);
  let currentNumberBlockedCells = 0;
  while (numberBlockedCells > currentNumberBlockedCells) {
    // TODO: think if is convenient to use a function from Phaser here
    const nextRandomCell = between(currentNumberBlockedCells, rows * cols - 1);
    swapValues(cells, nextRandomCell, currentNumberBlockedCells);

    const cellId = cells[currentNumberBlockedCells];
    const row = Math.floor(cellId / rows);
    const col = Math.floor(cellId % cols);

    // make this cellId block cell
    maze[row][col] = 1;

    // return;
    // Check if there is just 1 connected component
    const numberCC = numberConnectedComponents(rows, cols, maze);
    if (numberCC === 1) {
      currentNumberBlockedCells++;
    } else {
      // looks like this cell create 2 components
      maze[row][col] = 0;
    }
  }
  return maze;
}

function numberConnectedComponents(
  rows: number,
  cols: number,
  maze: number[][],
) {
  const visited: boolean[][] = [];

  for (let row = 0; row < rows; row++) {
    visited.push([]);
    for (let col = 0; col < cols; col++) {
      visited[row].push(false);
    }
  }

  let numberCC = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // empty cell and not visited
      if (maze[row][col] === 0 && !visited[row][col]) {
        dfs(row, col, rows, cols, maze, visited);
        numberCC++;
      }
    }
  }

  return numberCC;
}

const X = [1, 0, -1, 0];
const Y = [0, -1, 0, 1];

function dfs(
  row: number,
  col: number,
  rows: number,
  cols: number,
  maze: number[][],
  visited: boolean[][],
) {
  visited[row][col] = true;
  for (let dir = 0; dir < 4; dir++) {
    const newRow = row + X[dir];
    const newCol = col + Y[dir];
    // Check if newRow and newCol is inside the maze
    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
      // check if cell is not visited and new cell is empty
      if (!visited[newRow][newCol] && maze[newRow][newCol] === 0) {
        dfs(newRow, newCol, rows, cols, maze, visited);
      }
    }
  }
}
