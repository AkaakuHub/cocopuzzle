"use client";
import React from "react";

// タイルコンポーネント
const Tile = ({
	position,
	num,
	onClick,
	image,
	tileSize,
	boardDisplaySize,
	boardDimension,
}: {
	position: number;

	num: number;
	onClick: (position: number) => void;
	image: string | null;
	tileSize: number;
	boardDisplaySize: number;
	boardDimension: number;
}) => {
	if (num === 0) return null;

	// アップロード画像を使う場合、背景画像全体を盤面表示サイズに合わせる
	const backgroundStyle = image
		? {
				backgroundImage: `url(${image})`,
				backgroundSize: `${boardDisplaySize}px ${boardDisplaySize}px`,
				backgroundPosition: `-${((num - 1) % boardDimension) * tileSize}px -${Math.floor((num - 1) / boardDimension) * tileSize}px`,
			}
		: {};
	return (
		<button
			type="button"
			className="select-none border border-solid p-0 absolute text-center transition-[top,left] duration-300 ease-[cubic-bezier(.1,-0.35,.21,1.62)] cursor-pointer rounded-sm shadow-sm bg-white"
			style={{
				top: Math.floor(position / boardDimension) * tileSize,
				left: (position % boardDimension) * tileSize,
				width: `${tileSize}px`,
				height: `${tileSize}px`,
				lineHeight: `${tileSize}px`,
				...backgroundStyle,
			}}
			onClick={() => onClick(position)}
		>
			{!image && num}
		</button>
	);
};

export default function Game() {
	// 盤面サイズ選択：初期は 4×4 をデフォルト
	const [boardDimension, setBoardDimension] = React.useState(4);
	const totalCells = boardDimension * boardDimension;
	// 表示上の盤面サイズ(px)（背景画像のサイズとして固定）
	const boardDisplaySize = 240;
	// タイル1個あたりのサイズ
	const tileSize = boardDisplaySize / boardDimension;

	// solved state の定義：配列の index がタイル番号、値がそのタイルのセル位置
	// 空白（タイル番号0）は右下（セル番号: totalCells - 1）に配置
	const getSolvedState = () => {
		const state = new Array(totalCells);
		state[0] = totalCells - 1;
		for (let i = 1; i < totalCells; i++) {
			state[i] = i - 1;
		}
		return state;
	};

	const [tilePositions, setTilePositions] = React.useState(getSolvedState());
	// 画像アップロード状態
	const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
	// ゲーム開始フラグ：画像アップロード後にシャッフルして開始する
	const [gameStarted, setGameStarted] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// --- タイル移動ロジック ---
	// タイル (1～totalCells-1) の移動処理
	const moveTile = (state: number[], tile: number) => {
		const blankPos = state[0];
		const tilePos = state[tile];
		const rowBlank = Math.floor(blankPos / boardDimension);
		const rowTile = Math.floor(tilePos / boardDimension);
		const colBlank = blankPos % boardDimension;
		const colTile = tilePos % boardDimension;
		const newState = [...state];

		// 横方向移動
		if (rowBlank === rowTile) {
			if (colTile < colBlank) {
				for (let pos = colTile; pos < colBlank; pos++) {
					const cell = rowBlank * boardDimension + pos;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell + 1;
				}
				newState[0] = tilePos;
				return newState;
			}
			if (colTile > colBlank) {
				for (let pos = colBlank + 1; pos <= colTile; pos++) {
					const cell = rowBlank * boardDimension + pos;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell - 1;
				}
				newState[0] = tilePos;
				return newState;
			}
		}
		// 縦方向移動
		if (colBlank === colTile) {
			if (rowTile < rowBlank) {
				for (let row = rowTile; row < rowBlank; row++) {
					const cell = row * boardDimension + colBlank;
					const movingTile = state.findIndex((v) => v === cell);
					newState[movingTile] = cell + boardDimension;
				}
				newState[0] = tilePos;
				return newState;
			}
			if (rowTile > rowBlank) {
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

	// ユーザーがタイルをクリックしたときの移動処理
	const handleMove = (clickedPosition: number) => {
		const tile = tilePositions.findIndex((pos) => pos === clickedPosition);
		if (tile === -1 || tile === 0) return;
		const newState = moveTile(tilePositions, tile);
		if (newState) {
			setTilePositions(newState);
			if (isSolved(newState)) {
				setTimeout(() => {
					window.alert("完成！");
				}, 300); // アニメーションが終わるまで少し待つ
			}
		}
	};

	// ゲームクリア判定（solved state と比較）
	const isSolved = (state: number[]) => {
		const solved = getSolvedState();
		return solved.every((val, index) => val === state[index]);
	};

	// --- 解ける盤面の生成（合法な手順をランダムに適用するシャッフル） ---
	const getNeighbors = (state: number[]) => {
		const neighbors = [];
		for (let tile = 1; tile < totalCells; tile++) {
			const nextState = moveTile(state, tile);
			if (nextState) {
				neighbors.push({ move: tile, state: nextState });
			}
		}
		return neighbors;
	};

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

	// --- 画像アップロード処理 ---
	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file?.type.match("image.*")) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setUploadedImage(e.target?.result as string);
				// 画像アップロード後、もしまだゲームが始まっていなければ盤面をシャッフルして開始
				if (!gameStarted) {
					shuffleBoard();
					setGameStarted(true);
				}
			};
			reader.readAsDataURL(file);
		}
	};

	// --- 盤面サイズ選択処理 ---
	const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const dim = Number.parseInt(e.target.value);
		setBoardDimension(dim);
		const newTotal = dim * dim;
		// solved state に合わせて初期状態をリセット
		setTilePositions(() => {
			return [newTotal - 1, ...[...Array(newTotal - 1)].map((_, i) => i)];
		});
		// ゲーム開始前なら、画像がアップロード済みであれば自動シャッフルして開始
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
					{/* 盤面サイズ選択（ゲーム開始前） */}
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
							type="button"
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
							onClick={() => shuffleBoard()}
							disabled={!uploadedImage}
						>
							Shuffle
						</button>
						<button
							type="button"
							className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
							onClick={() => fileInputRef.current?.click()}
						>
							Upload Image
						</button>
					</div>
				</div>
				{/* 画像未アップロードならメッセージ表示 */}
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
								key={p}
								num={n}
								position={p}
								tileSize={tileSize}
								boardDisplaySize={boardDisplaySize}
								boardDimension={boardDimension}
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
