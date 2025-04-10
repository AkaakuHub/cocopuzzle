"use client";
import { useRef, useState } from "react";

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
	// 盤面サイズ選択
	const [boardDimension, setBoardDimension] = useState(3);
	const totalCells = boardDimension * boardDimension;

	// 自動解決中かどうかのフラグ
	const [isSolving, setIsSolving] = useState(false);

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
	const [tilePositions, setTilePositions] = useState(getSolvedState());
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [gameStarted, setGameStarted] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// シャッフル直後の状態を保存
	const [shuffledState, setShuffledState] = useState<number[]>([]);
	// シャッフル時の移動履歴を保存する配列
	const [moveHistory, setMoveHistory] = useState<number[]>([]);

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
	// パズルをシャッフルし、その際の移動履歴を保存する
	const shuffleBoard = () => {
		// まずは解いた状態（正解）から始める
		let state = getSolvedState();
		// 移動履歴をリセット
		const history: number[] = [];

		// ランダムな回数（最小10回、最大300回）の移動を適用
		const movesCount = Math.floor(Math.random() * 291) + 10;
		console.log(`Shuffling with ${movesCount} moves`);

		for (let i = 0; i < movesCount; i++) {
			// 現在の状態において可能な移動を取得
			const blankIndex = state.indexOf(0);
			const possibleMoves: number[] = [];

			// 上下左右の隣接タイルをチェック
			// 上
			if (blankIndex >= boardDimension) {
				possibleMoves.push(state[blankIndex - boardDimension]);
			}
			// 下
			if (blankIndex < totalCells - boardDimension) {
				possibleMoves.push(state[blankIndex + boardDimension]);
			}
			// 左
			if (blankIndex % boardDimension !== 0) {
				possibleMoves.push(state[blankIndex - 1]);
			}
			// 右
			if (blankIndex % boardDimension !== boardDimension - 1) {
				possibleMoves.push(state[blankIndex + 1]);
			}

			// ランダムに移動を選択（直前の移動を元に戻す動きは避ける）
			if (possibleMoves.length > 0) {
				// 直前の移動を元に戻す動きを除外
				let filteredMoves = possibleMoves;
				if (history.length > 0) {
					filteredMoves = possibleMoves.filter(
						(move) => move !== history[history.length - 1],
					);
				}

				// 有効な移動がなければ（通常は起こらないが）、全ての可能な移動から選択
				const randomMove =
					filteredMoves.length > 0
						? filteredMoves[Math.floor(Math.random() * filteredMoves.length)]
						: possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

				// 移動を適用し、履歴に記録
				const newState = moveTile(state, randomMove);
				if (newState) {
					state = newState;
					history.push(randomMove);
				}
			}
		}

		// 最終的な状態と移動履歴を保存
		setTilePositions(state);
		setShuffledState([...state]); // シャッフル直後の状態を記録
		setMoveHistory(history);
	};

	// Auto Solve ボタンが押されたときの処理
	const autoSolve = async () => {
		if (isSolving) return;
		setIsSolving(true);

		try {
			// シャッフル時の移動履歴を逆順に適用
			const solutionMoves = [...moveHistory].reverse();

			if (solutionMoves.length === 0) {
				window.alert("解答する手順がありません。再度シャッフルしてください。");
				setIsSolving(false);
				return;
			}

			// まずシャッフル直後の状態に戻す
			setTilePositions(shuffledState);
			let currentState = [...shuffledState];

			// アニメーションのためにわずかに遅延
			await new Promise((resolve) => setTimeout(resolve, 300));

			// 記録された移動を逆順に適用
			for (let i = 0; i < solutionMoves.length; i++) {
				const move = solutionMoves[i];
				const newState = moveTile(currentState, move);

				if (newState) {
					currentState = newState;
					setTilePositions(newState);

					// 最後の移動で完成したか確認
					if (i === solutionMoves.length - 1) {
						setTimeout(() => {
							if (isSolved(newState)) {
								window.alert("完成！");
							}
							setIsSolving(false);
						}, 300);
					}

					// 次の移動まで待機
					// 待機時間は、移動の全体がある程度一定になるように調整
					const tempDelay = 10000 / solutionMoves.length;
					// ただし最小時間と最大時間を設定
          const delay = Math.max(1, Math.min(tempDelay, 500));
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		} catch (e) {
			console.error("Auto solve error:", e);
			setIsSolving(false);
		}
	};

	// --- 盤面サイズ選択処理 ---
	const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const dim = Number.parseInt(e.target.value);
		setBoardDimension(dim);
		const newTotal = dim * dim;

		// 新しい盤面の solved state を設定
		const newState = new Array(newTotal);
		for (let i = 0; i < newTotal - 1; i++) {
			newState[i] = i + 1;
		}
		newState[newTotal - 1] = 0;

		setTilePositions(newState);
		setShuffledState([]); // シャッフル状態をリセット
		setMoveHistory([]); // 移動履歴をリセット

		if (uploadedImage && !gameStarted) {
			shuffleBoard();
			setGameStarted(true);
		}
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
