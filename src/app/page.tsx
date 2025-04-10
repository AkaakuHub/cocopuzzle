"use client";
import { Modal } from "@/components/Modal";
import { PuzzleGrid } from "@/components/PuzzleGrid";
import { Toast } from "@/components/Toast";
import { useBasePath } from "@/hooks/useBasePath";
import type { ToastType } from "@/types";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// react-confetti を動的にインポート（サーバーサイドレンダリング対策）
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export default function Game() {
	const basePath = useBasePath();
	// 盤面サイズ選択
	const [boardDimension, setBoardDimension] = useState(3);
	const totalCells = boardDimension * boardDimension;

	// 自動解決中かどうかのフラグ
	const [isSolving, setIsSolving] = useState(false);
	const [isManualMode, setIsManualMode] = useState(true);

	// トースト通知の状態
	const [toast, setToast] = useState({
		message: "",
		isVisible: false,
		type: "success" as ToastType,
	});

	// 紙吹雪の状態
	const [showConfetti, setShowConfetti] = useState(false);

	// トースト表示関数
	const showToast = (
		message: string,
		type: ToastType = "success",
		duration = 3000,
	) => {
		setToast({ message, isVisible: true, type });
		setTimeout(() => {
			setToast((prev) => ({ ...prev, isVisible: false }));
		}, duration);
	};

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
				// タイマーを停止し、クリアタイムを記録
				setIsTimerRunning(false);
				setClearTime(time);

				// 完成時の処理：トースト表示と紙吹雪
				showToast("完成！おめでとうございます！", "success");
				setShowConfetti(true);
				setTimeout(() => {
					setShowConfetti(false);
				}, 5000);
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
		// タイマーリセットと開始
		setTime(0);
		setIsTimerRunning(true);
		setClearTime(null);

		// まずは解いた状態（正解）から始める
		let state = getSolvedState();
		// 移動履歴をリセット
		const history: number[] = [];

		// ランダムな回数の移動を適用
		// この際、マスの数によって移動回数を調整
		const movesCount = Math.floor(Math.random() * 30) + 20 * boardDimension;
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
		setIsManualMode(false);
		setTime(0);
		// 自動解答時はタイマーを停止
		setIsTimerRunning(false);

		try {
			// シャッフル時の移動履歴を逆順に適用
			const solutionMoves = [...moveHistory].reverse();

			if (solutionMoves.length === 0) {
				showToast(
					"解答する手順がありません。再度シャッフルしてください。",
					"error",
				);
				setIsSolving(false);
				return;
			}

			// まずシャッフル直後の状態に戻す
			setTilePositions(shuffledState);
			showToast("シャッフル状態から解答を開始します...", "info");
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
								setClearTime(time);
								showToast("完成！", "success");
								setShowConfetti(true);
								setTimeout(() => {
									setShowConfetti(false);
								}, 5000);
							}
							setIsSolving(false);
						}, 300);
					}

					// 次の移動まで待機
					// 待機時間は、移動の全体がある程度一定になるように調整
					// ただし最小時間と最大時間を設定
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}
		} catch (e) {
			console.error("Auto solve error:", e);
			showToast("解答中にエラーが発生しました", "error");
			setIsSolving(false);
		}
	};

	// --- 盤面サイズ選択処理 ---
	const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		// サイズ変更時にタイマーをリセット
		setTime(0);
		setIsTimerRunning(false);
		setClearTime(null);

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
			setGameStarted(true);
		}
	};

	// --- 画像アップロード処理 ---
	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (file?.type.match("image.*")) {
			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const imageUrl = e.target?.result as string;
					// 画像を正方形に切り抜く
					const croppedImageUrl = await cropImageToSquare(imageUrl);

					setUploadedImage(croppedImageUrl);
					if (!gameStarted) {
						shuffleBoard();
						setGameStarted(true);
						showToast(
							"画像をアップロードしました！パズルを解いてみましょう",
							"info",
						);
					}
				} catch (error) {
					console.error("Error processing image:", error);
					showToast("画像の処理中にエラーが発生しました", "error");
				}
			};
			reader.readAsDataURL(file);
		}
	};

	// 画像を正方形に切り抜く関数
	const cropImageToSquare = (imageUrl: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous"; // CORSエラー対策

			img.onload = () => {
				// 元画像のサイズを取得
				const { width, height } = img;

				// 正方形のサイズを決定（短い方の辺に合わせる）
				const size = Math.min(width, height);

				// 中央から切り抜くための開始位置を計算
				const startX = Math.floor((width - size) / 2);
				const startY = Math.floor((height - size) / 2);

				// Canvas要素を作成して正方形に切り抜く
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					reject(new Error("Canvas context could not be created"));
					return;
				}

				// 画像を中央から切り抜いて描画
				ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

				// データURLとして出力
				try {
					const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // JPEG形式で出力、品質0.9
					resolve(dataUrl);
				} catch (e) {
					reject(e);
				}
			};

			img.onerror = (e) => {
				reject(new Error("Failed to load image"));
				console.error("Image load error:", e);
			};

			img.src = imageUrl;
		});
	};

	// タイマー機能の追加
	const [time, setTime] = useState(0);
	const [isTimerRunning, setIsTimerRunning] = useState(false);
	const [clearTime, setClearTime] = useState<number | null>(null);

	// タイマー制御
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		if (isTimerRunning) {
			intervalId = setInterval(() => {
				setTime((prevTime) => prevTime + 1);
			}, 1000);
		}

		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	}, [isTimerRunning]);

	// 時間のフォーマット (mm:ss)
	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
			.toString()
			.padStart(2, "0")}`;
	};

	// モーダル表示制御
	const [showCompleteImage, setShowCompleteImage] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center h-[90vh] p-4">
			{showConfetti && (
				<Confetti
					width={window.innerWidth}
					height={window.innerHeight}
					recycle={false}
					numberOfPieces={500}
				/>
			)}

			<Toast
				message={toast.message}
				isVisible={toast.isVisible}
				type={toast.type}
			/>

			<Modal
				isOpen={showCompleteImage}
				onClose={() => setShowCompleteImage(false)}
				image={uploadedImage}
			/>

			<div>
				<div className="text-center mb-6 flex flex-row items-center justify-center gap-4">
					<img
						src={`${basePath}/images/icon.webp`}
						alt="ココパズル"
						className="w-24 h-24 mb-4"
					/>
					<div>
						<span className="text-2xl font-bold text-slate-800">
							ココパズル
						</span>
						<span className="text-sm text-slate-600 font-semibold block mt-1 mb-4">
							ここだけの自分のパズルを作ろう
						</span>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-4 md:p-6 w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto">
					<div className="flex flex-col gap-3 mb-4">
						<div className="grid grid-cols-3 items-center">
							<div className="flex items-center">
								<label className="text-sm font-medium text-gray-700">
									マスの数
									<select
										value={boardDimension}
										onChange={handleDimensionChange}
										className="ml-2 p-1 border rounded disabled:bg-gray-400"
										disabled={isSolving}
									>
										<option value="2">2x2</option>
										<option value="3">3x3</option>
										<option value="4">4x4</option>
										<option value="5">5x5</option>
										<option value="6">6x6</option>
									</select>
								</label>
							</div>

							<div
								className={clsx(
									"text-lg font-mono font-semibold text-center",
									clearTime &&
										isManualMode &&
										"text-white bg-green-500 border-2 border-green-700 rounded-full",
								)}
							>
								{formatTime(time)}
							</div>

							<div className="flex justify-end">
								{gameStarted && (
									<button
										type="button"
										className="p-2 text-slate-800 hover:bg-gray-100 rounded-full"
										onClick={() => setShowCompleteImage(true)}
										title="完成イメージを表示"
									>
										{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="icon icon-tabler icons-tabler-outline icon-tabler-eye"
										>
											<path stroke="none" d="M0 0h24v24H0z" fill="none" />
											<path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
											<path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" />
										</svg>
									</button>
								)}
							</div>
						</div>

						<div className="flex flex-wrap gap-2 justify-center">
							{gameStarted && (
								<button
									type="button"
									className="px-4 py-2 bg-red-700 text-white rounded-md hover:brightness-75 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:brightness-50"
									onClick={() => {
										shuffleBoard();
										setIsManualMode(true);
										showToast("パズルをシャッフルしました！", "info");
									}}
									disabled={!uploadedImage || isSolving}
								>
									シャッフル
								</button>
							)}
							<button
								type="button"
								className="px-4 py-2 bg-blue-700 text-white rounded-md hover:brightness-75 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:brightness-50"
								onClick={() => fileInputRef.current?.click()}
								disabled={isSolving}
							>
								画像を選択
							</button>
							{uploadedImage && (
								<button
									type="button"
									className="px-4 py-2 bg-green-700 text-white rounded-md hover:brightness-75 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:brightness-50"
									onClick={autoSolve}
									disabled={isSolving}
								>
									自動回答
								</button>
							)}
						</div>
					</div>

					{!uploadedImage ? (
						<p className="text-center text-gray-500 my-10">
							画像を選択して開始！
						</p>
					) : (
						<PuzzleGrid
							tilePositions={tilePositions}
							uploadedImage={uploadedImage}
							boardDimension={boardDimension}
							onClick={handleMove}
							isSolving={isSolving}
							checkIsSolved={isSolved}
						/>
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
		</div>
	);
}
