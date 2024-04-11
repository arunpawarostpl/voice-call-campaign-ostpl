import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import wav  from 'node-wav';
import fs from 'fs';
import { PassThrough } from 'stream';
import ffprobeStatic from 'ffprobe-static';

import wavInfo from "wav-file-info"



ffmpeg.setFfmpegPath(ffmpegPath);






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

      // .toFormat('wav')
      // .audioCodec('pcm_s16le') // 8-bit audio codec
      // .audioChannels(1) // Mono channel
      // .audioFrequency(8000) // Sample rate
      // // .audioBitrate('16k') // Target bitrate
      // .output(outputFilePath);



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





// Function to get audio duration
async function getDuration(outputFilePath, decimalPlaces = 0) {
  return new Promise((resolve, reject) => {
    wavInfo.infoByFilename(outputFilePath, (err, info) => {
      if (err) {
        reject(`Error getting duration: ${err.message}`);
      } else {
        const roundedDuration = parseFloat(info.duration).toFixed(decimalPlaces);
        resolve(roundedDuration);
      }
    });
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




async function checkAudioDuration(audioBuffer, outputFilePath) {
  console.log("enter in audioi checker");
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

command.on('end', () => {

  // console.log('Conversion successful! WAV file generated:', outputFilePath);
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

async function getDurartion(outputFilePath){
  return new Promise((resolve, reject) => {
    wavInfo.infoByFilename(outputFilePath, (err, info) => {
      if (err) {
        reject(err);
      } else {
        console.log('Metadata:', info);
        resolve(info);
      }
    });
  });

}
  

export { getAudioInfo ,processAudioFile,convertAudioToWAV,checkAudioDuration,getDuration};
