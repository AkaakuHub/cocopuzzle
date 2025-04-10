// モーダルコンポーネント
export const Modal = ({
	isOpen,
	onClose,
	image,
}: {
	isOpen: boolean;
	onClose: () => void;
	image: string | null;
}) => {
	if (!isOpen) return null;

	return (
		<button
			type="button"
			className="fixed inset-0 bg-slate-700/50 bg-opacity-50 z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div className="bg-white rounded-lg shadow-lg mt-34 p-4 md:p-6 w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-bold">完成図</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-800 font-bold"
					>
						✕
					</button>
				</div>
				<div className="relative mx-auto mt-18 w-full aspect-square max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px]">
					{image ? (
						<div
							className="w-full h-full bg-no-repeat bg-cover rounded"
							style={{
								backgroundImage: `url(${image})`,
								backgroundPosition: "center",
								backgroundSize: "contain",
							}}
						/>
					) : (
						<p className="text-center text-gray-500">画像がありません</p>
					)}
				</div>
			</div>
		</button>
	);
};
