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

	// 自動解答の際の動作間隔 (ミリ秒)
	const [moveDelay, setMoveDelay] = React.useState(500);
	// 自動解決中かどうかのフラグ
	const [isSolving, setIsSolving] = React.useState(false);

	const boardDisplaySize = 240;
	const tileSize = boardDisplaySize / boardDimension;

	// --- state の表現変更 ---
	// state はセルインデックス順にタイル番号が格納される配列、0は空白
	const getSolvedState = () => {
		const state = new Array(totalCells);
		for (let i = 0; i < totalCells - 1; i++) {
			state[i] = i + 1;
		}
		state[totalCells - 1] = 0;
		return state;
	};

	// 初期状態は解の盤面の状態にする
	const [tilePositions, setTilePositions] = React.useState(getSolvedState());
	const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
	const [gameStarted, setGameStarted] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// --- タイル移動ロジック ---
	// 新しい moveTile：指定されたタイルが空白と隣接していれば、両者を入れ替える
	const moveTile = (state: number[], tile: number) => {
		const blankIndex = state.indexOf(0);
		const tileIndex = state.indexOf(tile);
		if (tileIndex === -1) return null;
		const rowBlank = Math.floor(blankIndex / boardDimension);
		const colBlank = blankIndex % boardDimension;
		const rowTile = Math.floor(tileIndex / boardDimension);
		const colTile = tileIndex % boardDimension;
		// 隣接チェック
		if (
			(rowBlank === rowTile && Math.abs(colBlank - colTile) === 1) ||
			(colBlank === colTile && Math.abs(rowBlank - rowTile) === 1)
		) {
			const newState = [...state];
			newState[blankIndex] = tile;
			newState[tileIndex] = 0;
			return newState;
		}
		return null;
	};

	const handleMove = (clickedPosition: number) => {
		const tile = tilePositions[clickedPosition]; // セルclickedPositionにあるタイル
		if (tile === 0) return; // クリックが空白なら何もしない
		const newState = moveTile(tilePositions, tile);
		if (newState) {
			setTilePositions(newState);
			if (isSolved(newState)) {
				setTimeout(() => {
					window.alert("完成！");
				}, 300);
			}
		}
	};

	// ゲームクリア判定
	const isSolved = (state: number[]) => {
		const solved = getSolvedState();
		return solved.every((val, index) => val === state[index]);
	};

	// --- 解ける盤面の生成（合法な手順をランダムに適用するシャッフル） ---
	// 盤面 state の各要素は、セルの内容（タイル番号）が入る
	const getNeighbors = (state: number[]) => {
		const neighbors = [];
		// 盤面上の各セル（空白でないタイル）について、移動可能か試す
		for (const stateItem of state) {
			if (stateItem === 0) continue; // 空白は除く
			const nextState = moveTile(state, stateItem);
			if (nextState) {
				neighbors.push({ move: stateItem, state: nextState });
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
		setTilePositions(() => {
			// 新しい盤面の solved state を返す
			const state = new Array(newTotal);
			for (let i = 0; i < newTotal - 1; i++) {
				state[i] = i + 1;
			}
			state[newTotal - 1] = 0;
			return state;
		});
		if (uploadedImage && !gameStarted) {
			shuffleBoard();
			setGameStarted(true);
		}
	};

	// ----- A* 探索の実装 -----
	// 入力 state から解（タイル番号で表す手順の配列）を求める
	const aStarSolve = (initialState: number[]) => {
		const goalState = getSolvedState();

		// ヒューリスティック関数：現在の状態から目標状態までの推定コスト
		const heuristic = (state: number[]) => {
			let h = 0;
			// 各タイル（空白を除く）について計算
			for (let i = 0; i < state.length; i++) {
				const tile = state[i];
				if (tile === 0) continue; // 空白はスキップ

				// 現在位置の座標
				const currentRow = Math.floor(i / boardDimension);
				const currentCol = i % boardDimension;

				// タイルが本来あるべき位置（タイル番号1は位置0、タイル番号2は位置1...）
				const goalIndex = tile - 1;
				const goalRow = Math.floor(goalIndex / boardDimension);
				const goalCol = goalIndex % boardDimension;

				// マンハッタン距離を加算
				h += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
			}
			return h;
		};

		// 優先度付きキューは配列＋ソートで簡易実装
		const openList: {
			state: number[];
			moves: number[];
			g: number;
			f: number;
		}[] = [];
		const closedSet = new Set<string>();
		const nodeToString = (state: number[]) => state.join(",");

		const startNode = {
			state: initialState.slice(),
			moves: [] as number[],
			g: 0,
			f: heuristic(initialState),
		};
		openList.push(startNode);
		closedSet.add(nodeToString(initialState));

		// 最大探索ノード数の制限（パフォーマンス対策）
		const maxNodes = 10000;
		let nodesExplored = 0;

		while (openList.length > 0 && nodesExplored < maxNodes) {
			nodesExplored++;

			// f値が最小のノードを取得
			openList.sort((a, b) => a.f - b.f);
			const current = openList.shift();
			if (!current) continue;

			// ゴール状態に到達したかチェック
			if (nodeToString(current.state) === nodeToString(goalState)) {
				return current.moves;
			}

			// 隣接状態を取得
			const blankIndex = current.state.indexOf(0);
			const possibleMoves = [];

			// 空白の上下左右のタイルを移動させることができる
			// 上
			if (blankIndex >= boardDimension) {
				possibleMoves.push(current.state[blankIndex - boardDimension]);
			}
			// 下
			if (blankIndex < totalCells - boardDimension) {
				possibleMoves.push(current.state[blankIndex + boardDimension]);
			}
			// 左
			if (blankIndex % boardDimension !== 0) {
				possibleMoves.push(current.state[blankIndex - 1]);
			}
			// 右
			if (blankIndex % boardDimension !== boardDimension - 1) {
				possibleMoves.push(current.state[blankIndex + 1]);
			}

			// 各可能な移動について探索
			for (const move of possibleMoves) {
				const newState = moveTile(current.state, move);
				if (!newState) continue;

				const stateStr = nodeToString(newState);
				if (closedSet.has(stateStr)) continue;

				const newMoves = [...current.moves, move];
				const g = current.g + 1;
				const f = g + heuristic(newState);

				closedSet.add(stateStr);
				openList.push({ state: newState, moves: newMoves, g, f });
			}
		}

		// 解が見つからなかった場合
		console.warn("A* search failed or reached node limit:", nodesExplored);
		return null;
	};

	// Auto Solve ボタンが押されたときの処理
	const autoSolve = async () => {
		if (isSolving) return;
		setIsSolving(true);

		try {
			const solutionMoves = aStarSolve(tilePositions);
			if (!solutionMoves || solutionMoves.length === 0) {
				window.alert("解答が見つかりませんでした。");
				setIsSolving(false);
				return;
			}

			let currentState = [...tilePositions];
			for (let i = 0; i < solutionMoves.length; i++) {
				const move = solutionMoves[i];
				const newState = moveTile(currentState, move);

				if (newState) {
					currentState = newState;
					setTilePositions(newState);

					// 最後の移動でゴール状態に到達したか確認
					if (i === solutionMoves.length - 1) {
						setTimeout(() => {
							if (isSolved(newState)) {
								window.alert("完成！");
							}
							setIsSolving(false);
						}, 300);
					}

					// 次の移動まで待機
					await new Promise((resolve) => setTimeout(resolve, moveDelay));
				}
			}
		} catch (e) {
			console.error("Auto solve error:", e);
			setIsSolving(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
			<div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
				<h1 className="text-2xl font-extrabold text-center mb-4">
					Slide Puzzle
				</h1>
				<div className="flex flex-col gap-4 mb-4">
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
						{gameStarted && (
							<button
								type="button"
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
								onClick={() => shuffleBoard()}
								disabled={!uploadedImage || isSolving}
							>
								Shuffle
							</button>
						)}
						<button
							type="button"
							className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
							onClick={() => fileInputRef.current?.click()}
							disabled={isSolving}
						>
							Upload Image
						</button>
						{uploadedImage && (
							<button
								type="button"
								className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
								onClick={autoSolve}
								disabled={isSolving}
							>
								Auto Solve
							</button>
						)}
					</div>
					{uploadedImage && (
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-700" htmlFor="moveDelay">
								Delay (ms):
							</label>
							<input
								type="range"
								min="100"
								max="2000"
								step="100"
								value={moveDelay}
								onChange={(e) => setMoveDelay(Number.parseInt(e.target.value))}
								disabled={isSolving}
							/>
							<span className="text-sm text-gray-700">{moveDelay}</span>
						</div>
					)}
				</div>
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
								num={tilePositions[n]}
								position={n}
								tileSize={tileSize}
								boardDisplaySize={boardDisplaySize}
								boardDimension={boardDimension}
								onClick={(pos) => !isSolving && handleMove(pos)}
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
