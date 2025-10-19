// --- Audio Decoding and Playback Utilities ---

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of channels.
 * @returns A promise that resolves to an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Plays an ArrayBuffer of audio data.
 * @param audioData The ArrayBuffer containing the raw audio data.
 */
export const playAudio = async (audioData: ArrayBuffer): Promise<void> => {
  try {
    const ctx = getAudioContext();
    const audioBuffer = await decodeAudioData(new Uint8Array(audioData), ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  } catch (error) {
    console.error("Failed to play audio:", error);
  }
};
