import type { ToastType } from "@/types";

// トースト通知コンポーネント
export const Toast = ({
	message,
	isVisible,
	type = "success",
}: {
	message: string;
	isVisible: boolean;
	type?: ToastType;
}) => {
	if (!isVisible) return null;

	const bgColor =
		type === "success"
			? "bg-green-500"
			: type === "error"
				? "bg-red-500"
				: "bg-blue-500";

	return (
		<div
			className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
		>
			{message}
		</div>
	);
};