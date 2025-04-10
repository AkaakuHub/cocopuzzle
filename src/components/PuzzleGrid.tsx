import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

// スライドパズルのコンテナコンポーネント
export const PuzzleGrid = ({
	tilePositions,
	uploadedImage,
	boardDimension,
	onClick,
	isSolving,
	checkIsSolved,
}: {
	tilePositions: number[];
	uploadedImage: string | null;
	boardDimension: number;
	onClick: (position: number) => void;
	isSolving: boolean;
	checkIsSolved: (state: number[]) => boolean;
}) => {
	// tile要素への参照を保持
	const tileRefs = useRef<Record<number, HTMLButtonElement | null>>({});
	const [showSolved, setShowSolved] = useState(false);

	// 前回の位置を保持するためのref
	const prevPositionsRef = useRef<Record<number, number>>({});

	// 位置が変わったときにアニメーションを適用
	useEffect(() => {
		// 各タイルの現在位置を計算
		tilePositions.forEach((num, position) => {
			if (num === 0) return; // 空白タイルはスキップ

			const tileEl = tileRefs.current[num];
			if (!tileEl) return;

			const prevPosition = prevPositionsRef.current[num];

			// 位置が変わったタイルのみアニメーション
			if (prevPosition !== undefined && prevPosition !== position) {
				const fromRow = Math.floor(prevPosition / boardDimension);
				const fromCol = prevPosition % boardDimension;
				const toRow = Math.floor(position / boardDimension);
				const toCol = position % boardDimension;

				// 前の位置から新しい位置へのアニメーション
				tileEl.animate(
					[
						{ transform: `translate(${fromCol * 100}%, ${fromRow * 100}%)` },
						{ transform: `translate(${toCol * 100}%, ${toRow * 100}%)` },
					],
					{
						duration: 300,
						easing: "cubic-bezier(.1,-0.35,.21,.98)",
						fill: "forwards",
					},
				);
			}

			// 現在の位置を記録
			prevPositionsRef.current[num] = position;
		});
	}, [tilePositions, boardDimension]);

	useEffect(() => {
		const isSolved = checkIsSolved(tilePositions);
		// 即座に状態を更新せず、短いタイムアウトを設ける
		const timer = setTimeout(() => {
			setShowSolved(isSolved);
		}, 50);

		return () => clearTimeout(timer);
	}, [tilePositions, checkIsSolved]);

	return (
		<div className="relative mx-auto mt-4 w-full aspect-square max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] border border-gray-300">
			{tilePositions.map((num, position) =>
				num !== 0 ? (
					<button
						type="button"
						key={num}
						ref={(el) => {
							tileRefs.current[num] = el;
						}}
						className="select-none flex justify-center items-center border border-solid absolute text-center cursor-pointer rounded-sm shadow-md bg-white border-amber-100 hover:bg-amber-50 font-bold"
						style={{
							width: `${100 / boardDimension}%`,
							height: `${100 / boardDimension}%`,
							transform: `translate(${(position % boardDimension) * 100}%, ${
								Math.floor(position / boardDimension) * 100
							}%)`,
							fontSize: `${Math.max(16, 120 / boardDimension)}px`,
							backgroundImage: uploadedImage ? `url(${uploadedImage})` : "none",
							backgroundSize: `${boardDimension * 100}%`,
							backgroundPosition: `-${((num - 1) % boardDimension) * 100}% -${
								Math.floor((num - 1) / boardDimension) * 100
							}%`,
							zIndex: 5,
						}}
						onClick={() => !isSolving && onClick(position)}
					>
						{!uploadedImage && num}
					</button>
				) : (
					// 空白タイルの位置を示すためのダミー要素
					<div
						key={num}
						className={clsx(
							"select-none flex justify-center items-center border border-solid absolute text-center rounded-sm shadow-md bg-white border-amber-100 hover:bg-amber-50 font-bold transition-opacity duration-1000",
							showSolved ? "opacity-100 cursor-pointer" : "opacity-0",
						)}
						style={{
							width: `${100 / boardDimension}%`,
							height: `${100 / boardDimension}%`,
							transform: `translate(${(position % boardDimension) * 100}%, ${
								Math.floor(position / boardDimension) * 100
							}%)`,
							fontSize: `${Math.max(16, 120 / boardDimension)}px`,
							backgroundImage: uploadedImage ? `url(${uploadedImage})` : "none",
							backgroundSize: `${boardDimension * 100}%`,
							backgroundPosition: `-${
								((tilePositions.length - 1) % boardDimension) * 100
							}% -${
								Math.floor((tilePositions.length - 1) / boardDimension) * 100
							}%`,
							zIndex: 5,
						}}
					>
						{!uploadedImage && num}
					</div>
				),
			)}
		</div>
	);
};
