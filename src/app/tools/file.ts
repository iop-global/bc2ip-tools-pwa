import { Directory, Filesystem } from '@capacitor/filesystem';

export const downloadFile = async (blob: Blob, fileName: string): Promise<void> => {
  return new Promise((res, rej) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        await Filesystem.writeFile({
          path: fileName,
          data: base64data!,
          directory: Directory.Documents,
        });
        res();
      };
    } catch (e) {
      rej(e);
    }
  });
};
