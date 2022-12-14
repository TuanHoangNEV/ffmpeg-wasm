import {useMemo, useState} from "react";
import getFilenameWithoutFileType from "../utils/getFilenameWithoutFileType";

import FFmpegService from "../services/ffmpeg";

export interface ConvertedDataType {
    blob: Blob;
    mimeType: string;
    fileName: string;
    fileType: string;
}

const useFFmpegConvert = (file: File | null) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [convertedData, setConvertedData] = useState<ConvertedDataType | null>(
        null
    );

    const isError = useMemo(() => error !== null, [error]);
    const isDone = useMemo(
        () => error === null && convertedData !== null && isLoading !== true,
        [error, convertedData, isLoading]
    );

    const convert = async () => {
        if (file === null || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const newFileType = "-test.mp4";
            const newFileMIMEType = "video/mp4";
            const newFileName = getFilenameWithoutFileType(file.name) + newFileType;

            await FFmpegService.writeFile(encodeURI(file.name), file);
            await FFmpegService.ffmpeg.run(
                "-i",
                encodeURI(file.name),
                "-filter:v", "fps=20",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-c:a", "copy",
                encodeURI(newFileName)
            );
            const data = FFmpegService.ffmpeg.FS("readFile", newFileName);
            FFmpegService.ffmpeg.FS("unlink", newFileName);

            setConvertedData({
                blob: new Blob([data.buffer], {
                    type: newFileMIMEType,
                }),
                mimeType: newFileMIMEType,
                fileName: newFileName,
                fileType: newFileType,
            });
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {isLoading, isError, isDone, convertedData, convert};
};

export default useFFmpegConvert;
