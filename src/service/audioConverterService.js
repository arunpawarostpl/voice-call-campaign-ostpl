import ffmpeg from 'fluent-ffmpeg';
import  setFfmpegPath  from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import wav  from 'node-wav';
import fs from "fs"
import pcmUtil  from "pcm-util"
import { Binary } from 'mongodb';
import { promisify } from "util";

ffmpeg.setFfmpegPath(ffmpegPath);

// async function convertToWav(inputPath, outputPath) {
//     return new Promise((resolve, reject) => {
//         ffmpeg(inputPath)
//             .toFormat('wav')
//             .on('end', () => {
//                 resolve(outputPath);
//             })
//             .on('error', (err) => {
//                 reject(err);
//             })
//             .save(outputPath);
//     });
// }

async function getAudioInfo(filePath) {
    const audioBuffer = fs.readFileSync(filePath);
    const wave = wav.decode(audioBuffer);
    const sampleRate = wave.sampleRate; // Sample rate of the audio
    const numChannels = wave.channelData[0].length;; // Number of channels
    const durationInSeconds = numChannels/sampleRate // Duration of the audio in seconds

    return { durationInSeconds, sampleRate, numChannels };
}


async function convertAudioToWAV(audioBuffer, outputFilePath) {
  return new Promise((resolve, reject) => {
    const tempMP3File = 'temp.mp3';
    fs.writeFileSync(tempMP3File, audioBuffer);

    const command = ffmpeg(tempMP3File)
      .toFormat('wav')
      .audioCodec('pcm_u8') // 8-bit audio codec
      .audioChannels(1) // Mono channel
      .audioFrequency(8000) // Sample rate
      .audioBitrate('64k') // Target bitrate
      .output(outputFilePath);

console.log("@@@@@@@@@@@@run the");
command.on('end', () => {
  console.log('Conversion successful! WAV file generated:', outputFilePath);
  fs.unlinkSync(tempMP3File); // Remove the temporary MP3 file
  resolve();
});

command.on('error', (err) => {
  console.error('Error during conversion:', err);
  fs.unlinkSync(tempMP3File); // Remove the temporary MP3 file in case of an error
  reject(err);
});

command.run();
     
  });
}

  


  async function processAudioFile(inputFilePath) {
    const tempMP3File = inputFilePath;
    const outputFilePath = `obdUploads/audio.wav`;
  
    try {
      await convertAudioToWAV(tempMP3File, outputFilePath);
  
      // Optionally, you can read the resulting WAV file back into a buffer
      const wavBuffer = fs.readFileSync(outputFilePath);
  
      // Clean up temporary files if needed
      fs.unlinkSync(tempMP3File);
      fs.unlinkSync(outputFilePath);
  
      return wavBuffer;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw new Error('Failed to process audio');
    }
  }

  

export { getAudioInfo ,processAudioFile,convertAudioToWAV};
