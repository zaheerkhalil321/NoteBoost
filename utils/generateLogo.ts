import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';

export async function generateAppLogo(): Promise<string> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Create a professional mobile app logo icon in a modern, sleek style. The design should feature: a minimalist brain or lightbulb symbol representing learning and knowledge, set within a rounded square app icon shape. Use a sophisticated glassmorphic aesthetic with frosted glass effects and subtle transparency. The color scheme should include light blue (#0ea5e9) and golden yellow (#fbbf24) gradient accents against a soft gradient background (light blue to purple tones). The icon should have depth with subtle shadows and highlights, rounded corners (iOS app icon style), and a clean, professional look suitable for an educational/note-taking app. Style: modern, minimalist, premium quality, 3D-rendered appearance with soft lighting and depth.'
            }]
          }],
          generationConfig: {
            responseModalities: ["Image"],
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "2K"
            }
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${JSON.stringify(data)}`);
    }

    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart) {
      throw new Error('No image generated');
    }

    const base64Image = imagePart.inlineData.data;
    const fileUri = FileSystem.documentDirectory + 'app-logo.png';

    await FileSystem.writeAsStringAsync(fileUri, base64Image, {
      encoding: EncodingType.Base64
    });

    console.log('✅ Logo generated successfully:', fileUri);
    return fileUri;
  } catch (error) {
    console.error('❌ Error generating logo:', error);
    throw error;
  }
}
