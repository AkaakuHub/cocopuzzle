export const useBasePath = () => {
	// 開発環境では空のパス、本番環境では設定したbasePathを返す
	// const isDevelopment = process.env.NODE_ENV === "development";
	// return isDevelopment ? "" : "/cocopuzzle";
	return "";
};