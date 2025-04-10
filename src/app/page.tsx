"use client";
import React from "react";

// タイルコンポーネント
const Tile = ({ position, num, onClick, image, tileSize }) => {
	if (num === 0) return null;
	const backgroundStyle = image
		? {
				backgroundImage: `url(${image})`,
				backgroundSize: `${tileSize * Math.sqrt(window.totalCells)}px ${tileSize * Math.sqrt(window.totalCells)}px`,
				backgroundPosition: `-${((num - 1) % Math.sqrt(window.totalCells)) * tileSize}px -${Math.floor((num - 1) / Math.sqrt(window.totalCells)) * tileSize}px`,
			}
		: {};
	return (
		<div
			className="select-none border border-solid p-0 absolute text-center transition-[top,left] duration-300 ease-[cubic-bezier(.1,-0.35,.21,1.62)] cursor-pointer rounded-sm shadow-sm bg-white"
			style={{
				top: Math.floor(position / window.boardDimension) * tileSize,
				left: (position % window.boardDimension) * tileSize,
				width: `${tileSize}px`,
				height: `${tileSize}px`,
				lineHeight: `${tileSize}px`,
				...backgroundStyle,
			}}
			onClick={() => onClick(position)}
		>
			{!image && num}
		</div>
	);
};


function isSolved(newState: any[]) {
  // The solved state is when each tile is at its correct position
  // For a solved state, tile 1 should be at position 0, tile 2 at position 1, etc.
  // And the blank tile (0) should be at the last position (totalCells - 1)
  
  if (newState[0] !== window.totalCells - 1) return false;
  
  for (let i = 1; i < window.totalCells; i++) {
    if (newState[i] !== i - 1) return false;
  }
  
  return true;
}


export default function Game() {
	// 盤面サイズ（2～6）の選択状態。初期は 4×4 をデフォルトにする。
	const [boardDimension, setBoardDimension] = React.useState(4);
	const totalCells = boardDimension * boardDimension;
	// window に一時的に保存（Tile コンポーネントで利用）
	window.boardDimension = boardDimension;
	window.totalCells = totalCells;

	// solved state の定義：タイル番号 0（空白）は solvedState[0] に、その他は 1～totalCells-1 が順に
	const getSolvedState = () => {
		let state = new Array(totalCells);
		state[0] = totalCells - 1;
		for (let i = 1; i < totalCells; i++) {
			state[i] = i - 1;
		}
		return state;
	};

	// パズル状態：配列の index がタイル番号、値がそのタイルのセル位置
	const [tilePositions, setTilePositions] = React.useState(getSolvedState());
	// 画像のアップロード状態
	const [uploadedImage, setUploadedImage] = React.useState(null);
	// ゲーム開始フラグ（画像アップロードと盤面サイズ選択済みならtrue）
	const [gameStarted, setGameStarted] = React.useState(false);
	const fileInputRef = React.useRef(null);

	// 表示するパズルのサイズ（全体の横幅などを固定、タイルサイズを動的に決定）
	const boardDisplaySize = 240; // px
	const tileSize = boardDisplaySize / boardDimension;

	// --- タイル移動ロジック ---
	// tile（1～totalCells-1）の移動処理（空白タイルが state[0] に格納されている）
	const moveTile = (state, tile) => {
		const blankPos = state[0];
		const tilePos = state[tile];
		const rowBlank = Math.floor(blankPos / boardDimension);
		const rowTile = Math.floor(tilePos / boardDimension);
		const colBlank = blankPos % boardDimension;
		const colTile = tilePos % boardDimension;
		let newState = [...state];
		// 横方向の移動
		if (rowBlank === rowTile) {
			if (colTile < colBlank) {
				for (let pos = colTile; pos < colBlank; pos++) {
					const cell = rowBlank * boardDimension + pos;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell + 1;
				}
				newState[0] = tilePos;
				return newState;
			} else if (colTile > colBlank) {
				for (let pos = colBlank + 1; pos <= colTile; pos++) {
					const cell = rowBlank * boardDimension + pos;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell - 1;
				}
				newState[0] = tilePos;
				return newState;
			}
		}
		// 縦方向の移動
		if (colBlank === colTile) {
			if (rowTile < rowBlank) {
				for (let row = rowTile; row < rowBlank; row++) {
					const cell = row * boardDimension + colBlank;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell + boardDimension;
				}
				newState[0] = tilePos;
				return newState;
			} else if (rowTile > rowBlank) {
				for (let row = rowBlank + 1; row <= rowTile; row++) {
					const cell = row * boardDimension + colBlank;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell - boardDimension;
				}
				newState[0] = tilePos;
				return newState;
			}
		}
		return null;
	};

	// 手動クリックによる移動
	const handleMove = (clickedPosition) => {
		const tile = tilePositions.findIndex((pos) => pos === clickedPosition);
		if (tile === -1 || tile === 0) return;
		const newState = moveTile(tilePositions, tile);
		if (newState) {
			setTilePositions(newState);
			// 移動後にパズルが完成したかチェック
			if (isSolved(newState)) {
				alert("完成！");
			}
		}
	};

	// --- 解けるパズルの生成：合法な手順をランダムに movesCount 回適用 ---
	const shuffleBoard = (movesCount = totalCells * totalCells * 3) => {
		let state = getSolvedState();
		for (let i = 0; i < movesCount; i++) {
			const neighbors = getNeighbors(state);
			if (neighbors.length > 0) {
				const randomNeighbor =
					neighbors[Math.floor(Math.random() * neighbors.length)];
				state = randomNeighbor.state;
			}
		}
		setTilePositions(state);
	};

	// 隣接状態の取得
	const getNeighbors = (state) => {
		const neighbors = [];
		for (let tile = 1; tile < totalCells; tile++) {
			const nextState = moveTile(state, tile);
			if (nextState) {
				neighbors.push({ move: tile, state: nextState });
			}
		}
		return neighbors;
	};

	// --- 画像アップロード処理 ---
	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file && file.type.match("image.*")) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setUploadedImage(e.target.result);
				// 画像アップロード後、もしゲームが未開始であれば盤面をシャッフルして開始
				if (!gameStarted) {
					shuffleBoard();
					setGameStarted(true);
				}
			};
			reader.readAsDataURL(file);
		}
	};

	// --- 盤面サイズ選択処理 ---
	const handleDimensionChange = (e) => {
		const dim = parseInt(e.target.value);
		setBoardDimension(dim);
		// 盤面サイズが変更されたら新しい solved state でリセット
		setTilePositions(() => {
			return (() => {
				const newTotal = dim * dim;
				window.boardDimension = dim;
				window.totalCells = newTotal;
				return [newTotal - 1, ...[...Array(newTotal - 1)].map((_, i) => i)];
			})();
		});
		// ゲーム開始前なら、画像がアップロード済みなら自動的にシャッフル
		if (uploadedImage && !gameStarted) {
			shuffleBoard();
			setGameStarted(true);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
			<div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
				<h1 className="text-2xl font-extrabold text-center mb-4">
					Slide Puzzle
				</h1>
				<div className="flex flex-col gap-4 mb-4">
					{/* 盤面サイズ選択：ゲーム開始前に選択 */}
					<label className="text-sm font-medium text-gray-700">
						Board Size
						<select
							value={boardDimension}
							onChange={handleDimensionChange}
							className="ml-2 p-1 border rounded"
						>
							<option value="2">2x2</option>
							<option value="3">3x3</option>
							<option value="4">4x4</option>
							<option value="5">5x5</option>
							<option value="6">6x6</option>
						</select>
					</label>
					<div className="flex flex-wrap gap-2 justify-center">
						<button
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
							onClick={() => shuffleBoard()}
							disabled={!uploadedImage}
						>
							Shuffle
						</button>
						<button
							className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
							onClick={() => fileInputRef.current.click()}
						>
							Upload Image
						</button>
					</div>
				</div>
				{/* 画像がアップロードされていなければメッセージを表示 */}
				{!uploadedImage ? (
					<p className="text-center text-gray-500">
						Please upload an image to start.
					</p>
				) : (
					<div
						className="relative mx-auto"
						style={{ width: boardDisplaySize, height: boardDisplaySize }}
					>
						{tilePositions.map((p, n) => (
							<Tile
								key={n}
								num={n}
								position={p}
								tileSize={tileSize}
								onClick={(p) => handleMove(p)}
								image={uploadedImage}
							/>
						))}
					</div>
				)}
			</div>
			<input
				type="file"
				accept="image/*"
				className="hidden"
				ref={fileInputRef}
				onChange={handleImageUpload}
			/>
		</div>
	);
}
