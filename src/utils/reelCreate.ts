import fs from "fs";
import path from "path";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";
import { ElevenLabsClient } from "elevenlabs";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { uploadToS3 } from "../middleware/upload";
import { emitProgress } from "../services/socketManager";
import { fieldList } from "aws-sdk/clients/datapipeline";


// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// CONFIG
const imageURL =
    "https://fastly.picsum.photos/id/3/5000/3333.jpg?hmac=GDjZ2uNWE3V59PkdDaOzTOuV3tPWWxJSf4fNcxu4S2g";
const elevenLabsApiKey = "sk_de348af669d3776fd591e0d3ff6fce6a5e696cb4036ffa25"; // Replace for security
const textToConvert = "This is the text you want to convert to speech.";
const transcribeEndpoint =
    "http://54.208.222.44:9000/transcribe?subtitle_format=ass";

const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsApiKey });

// Types
type FilePath = string;

// AUDIO GENERATION
async function getAudioFromText(text: string, audioPath: FilePath): Promise<FilePath> {
    const audio = await elevenlabs.generate({
        voice: "Rachel",
        text,
    });

    await fs.promises.writeFile(audioPath, audio);
    return audioPath;
}

// TRANSCRIPTION
async function transcribe(audioPath: FilePath, captionsPath: FilePath): Promise<FilePath> {
    const form = new FormData();
    form.append("file", fs.createReadStream(audioPath));

    try {
        const response = await axios.post(transcribeEndpoint, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
        });

        fs.writeFileSync(captionsPath, response.data, "utf-8");
        console.log("✅ Captions saved:", captionsPath);
        return captionsPath;
    } catch (error: any) {
        console.error("❌ Transcription failed:", error.response?.data || error.message);
        throw error;
    }
}

// DOWNLOAD IMAGE
async function downloadImage(imageURL: string, imagePath: FilePath): Promise<FilePath> {
    const response = await axios.get(imageURL, { responseType: "stream" });
    const writer = fs.createWriteStream(imagePath);

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(imagePath));
        writer.on("error", reject);
    });
}

// RENDER VIDEO
async function renderVideo(
    imagePath: FilePath,
    audioPath: FilePath,
    captionsPath: FilePath,
    videoPath: FilePath
): Promise<void> {
    let count = 0;
    const sanitizedCaptionsPath = captionsPath.replace(/\\/g, "/").replace(/:/g, "\\:");

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .inputOptions(["-loop 1"])
            .input(audioPath)
            .videoFilters([
                "scale=w=1920:h=1080:force_original_aspect_ratio=decrease",
                "pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
                `subtitles='${sanitizedCaptionsPath}':force_style='Alignment=2'`,
            ])
            .outputOptions([
                "-c:v libx264",
                "-tune stillimage",
                "-c:a aac",
                "-b:a 192k",
                "-pix_fmt yuv420p",
                "-shortest",
            ])
            .save(videoPath)
            .on("start", (cmd) => console.log("🎬 FFmpeg command:", cmd))
            .on("progress", (p) => {
                count++;
                console.log(`📹 Progress ${count}: ${Math.round(p.percent || 0)}%`);
            })
            .on("end", () => {
                console.log("✅ Video created: output_video.mp4");
                resolve();
            })
            .on("error", (err) => {
                console.error("❌ FFmpeg error:", err.message);
                reject(err);
            });
    });
}
async function concatenateVideos(videoPaths: any[], finalVideoPath: FilePath, concatListPath: any) {
    console.log("🎥 Concatenating videos...");
    const concatContent = videoPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    fs.writeFileSync(concatListPath, concatContent, "utf-8");

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(concatListPath)
            .inputOptions(["-f concat", "-safe 0"])
            .outputOptions([
                "-c:v libx264",
                "-c:a aac",
                "-pix_fmt yuv420p",
                // "-vf fade=t=in:st=0:d=0.5,fade=t=out:st=1:d=0.5",
            ])
            .save(finalVideoPath)
            .on("start", (cmd) => console.log("🎬 Concatenation command:", cmd))
            .on("end", () => {
                console.log(`✅ Final video created: ${finalVideoPath}`);
                resolve(finalVideoPath);
            })
            .on("error", (err) => {
                console.error("❌ Concatenation error:", err.message);
                reject(err);
            });
    });
}


// MAIN
export async function createReel(
    chapters: any[],
): Promise<any> {
    try {
        console.log("🎬 Creating reel...",chapters);
        const notify = (data: any) => emitProgress(chapters[0].user.toString(), data);
        const summaryVideoPath = path.join(__dirname, `../../uploads/video${chapters[0].timeline}.mp4`);
        const concatTxtPath = path.join(__dirname, `../../uploads/concat_list${chapters[0]._id}.txt`);
        const chapterVideos: string[] = [];
        for (let index = 0; index < chapters.length; index++) {
            notify({ "status": "Downloading image...", step: index + 1 });
            const chapter = chapters[index];
            const imagePath = path.join(__dirname, `../../uploads/image${chapter._id}.jpg`);
            const captionsPath = path.join(__dirname, `../../uploads/captions${chapter._id}.ass`);
            const audioPath = path.join(__dirname, `../../uploads/output.mp3`);
            // const audioPath = path.join(__dirname, `../../uploads/audio${chapters._id}.mp3`);
            const videoPath = path.join(__dirname, `../../uploads/video${chapter._id}.mp4`);

            console.log("⬇️ Downloading image...");
            await downloadImage(chapter?.image, imagePath);

            console.log("🎤 Generating audio...");
            // await getAudioFromText(chapter.chapterDescription, audioPath);
            console.log("📝 Transcribing audio...");
            await transcribe(audioPath, captionsPath);
            console.log("🎞️ Rendering video...");
            await renderVideo(imagePath, audioPath, captionsPath, videoPath);
            //upload in s3 bucket
            const [chaptersImage, audioLink, videoLink] = await Promise.all([
                uploadToS3(imagePath, `uploads/image/image${chapter._id}.jpg`, "image/jpg"),
                uploadToS3(audioPath, `uploads/audio/audio${chapter._id}.mp3`, "audio/mp3"),
                uploadToS3(videoPath, `uploads/video/video${chapter._id}.mp4`)
            ]);

            console.log("✅ Upload complete:", { videoLink, audioLink });
            //unlink the file
            fs.unlinkSync(imagePath);
            // fs.unlinkSync(audioPath);
            fs.unlinkSync(captionsPath);
            chapter.videoLink = videoLink;
            chapter.audioLink = audioLink;
            chapter.image = chaptersImage;
            await chapter.save();
            chapterVideos.push(videoPath);
        }
        notify({ status: "Concatenating videos...", step: chapters.length + 1 });
        await concatenateVideos(chapterVideos, summaryVideoPath, concatTxtPath);

        // Upload final video
        notify({ status: "Uploading final video to S3...", step: chapters.length + 2 });
        const finalVideoLink = await uploadToS3(summaryVideoPath, `uploads/video/cinematic_summary_${chapters[0]._timeline}.mp4`);
        console.log("✅ Final video uploaded:", finalVideoLink);
        notify({ status: "Final video uploaded", step: chapters.length + 3 });
        //unlink the file videos 
        chapterVideos.forEach((videoPath) => fs.unlinkSync(videoPath));
        fs.unlinkSync(concatTxtPath);
        fs.unlinkSync(summaryVideoPath);
        return { finalVideoLink };



    } catch (err: any) {
        console.error("🚨 Process failed:", err.message);
        throw err;
    }
}


