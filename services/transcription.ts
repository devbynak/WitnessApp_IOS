import { OPENAI_API_KEY } from '../constants/apiConfig';

/**
 * Transcribes an audio or video file using OpenAI Whisper.
 * Whisper accepts: mp4, m4a, mov, mp3, wav, webm, etc.
 * Returns the transcript as a plain string, or '' on failure.
 */
export async function transcribeAudio(fileUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('Transcription: no OpenAI API key configured');
    return '';
  }

  try {
    const formData = new FormData();

    // React Native FormData accepts { uri, type, name } objects
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const mimeType = fileExtension === 'mp4' || fileExtension === 'mov'
      ? 'video/mp4'
      : 'audio/m4a';

    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: `audio.${fileExtension}`,
    } as unknown as Blob);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        // Do NOT set Content-Type — let fetch set it with the boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      return '';
    }

    const transcript = await response.text();
    return transcript.trim();
  } catch (error) {
    console.error('Transcription failed:', error);
    return '';
  }
}
