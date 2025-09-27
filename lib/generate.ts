import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from "@google/genai";
import wav from 'wav';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCzgKY-cu4VRmh19GPMmC-smAvHnrgKaVo';

export const generate = async (prompt: string) => {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('Error generating response with Gemini:', error);
        throw error;
    }
}

export const generateWithImage = async (prompt: string, image?: File) => {
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const imagePart = image
      ? {
          inlineData: {
            mimeType: image.type,
            data: Buffer.from(await image.arrayBuffer()).toString("base64"),
          },
        }
      : null;

    const contents = [imagePart, { text: prompt }].filter(Boolean) as any[];

    const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
    });
    if (result.text) {
        return result.text;
    }
    console.error(result);
    console.error("No text in the response");
    throw new Error("No text in the response");
}

export const generateImage = async (prompt: string): Promise<Blob> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const contents = prompt;

  // Set responseModalities to include "Image" so the model can generate an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    // Based on the part type, either show the text or return the image as blob
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data || '';
      const buffer = Buffer.from(imageData, "base64");
      return new Blob([buffer], { type: 'image/png' });
    }
  }
  
  throw new Error("No image generated in the response");
}

async function saveWaveFile(
   filename: string,
   pcmData: Buffer,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}

export async function generateAudio(prompt: string, characters: { name: string, voice: string }[]): Promise<string> {
   const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
   const speakerVoiceConfigs = characters.map((character) => ({
      speaker: character.name,
      voiceConfig: {
         prebuiltVoiceConfig: { voiceName: character.voice }
      }
   }));


   const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      // @ts-ignore
      contents: [{ parts: [{ text: prompt }] }],
      config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
               multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: speakerVoiceConfigs,
               }
            }
      }
   });

   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   const audioBuffer = Buffer.from(data || '', 'base64');

   const id = crypto.randomUUID();

   const tempDir = path.join(process.cwd(), "public", "audio");
   // ensure temp dir exists
    try {
        await fs.promises.mkdir(tempDir, { recursive: true });
    } catch (e) {
        // ignore
    }
   const fileName = `${id}.wav`;
   await saveWaveFile(path.join(tempDir, fileName), audioBuffer);
   
   return id;
}

const prompt=`Raj (North Kolkata guy, bong accent):
"Arrey shona, tum log South Delhi waale sab din raat gym gym karte ho, protein shake pite ho, lekin phir bhi pet mein gas hi hota hai. Hum toh phuchka khate hain roadside pe, aur phir bhi tummy bilkul flat. Scientific, na?"

Mehak (South Delhi girl, Delhi accent):
"Excuse meee Raj ji, at least hum log ke paas proper cafes aur breweries hain, not these shady chai-er dokan jaha tum log cigarette maar ke bolte ho ‘adda chollo’. Matlab lifestyle dekho yaar, kitna middle-class vibe hai tumhara."

Raj:
"Arrey baba, hamara middle-class vibe hi toh asli hai! Tum log ka life toh bas Insta story aur daddy ke credit card. Ek din power cut ho jaye na, tum log Dilli waale mar jaoge bina AC ke. Hum toh load shedding mein batti bujha ke chaa-er sathe prem korchi years se."

Mehak:
"Shut up oye! At least humare roads pe gaddhe nahi hote har 2 meter pe. Tumhara Kolkata toh pura swimming pool ban jaata hai baarish mein. Tum log kachcha machhli lekar boat chalate ho ki kya?"

Raj:
"Hyan, toh ki holo? Pani toh free boating ka mazaa deta hai. Tumhare Delhi mein toh October se hi hawa itni ghatiya ho jaati hai ki oxygen cylinder lagana padta hai. Matlab ekdum potty smell wala smog. Humara toh fresh air, only thoda kaan kaan horn."

Mehak:
"Fresh air? Dude, tum log ke tram aur taxi dekh ke hi asthama ho jaata hai. And that Howrah bridge, sab log wahaan photo kheench ke apne ko Satyajit Ray ka hero samajhte hain. Hadh hai."

Raj:
"O Ma, tum log ke Qutub Minar mein kya rakha hai? Sirf lamba lamba deewar aur uske neeche chhote chhote couple kissing. Arrey, Victoria Memorial ke garden mein bhi log karte hain, but at least building dekhne laayak hai, not just ek boro lathi standing tall."

Mehak:
"Hahaha oye besharam! Tere accent mein ‘boro lathi’ sun ke main mar gayi. Chal, ek baat bolun, tum log ka rasgulla aur mishti doi I love, but apna butter chicken aur momos ka level bhi tum log kabhi beat nahi kar paoge."

Raj:
"Ekdum thik bolecho, tumhara butter chicken sahi hai. Lekin mishti doi kha ke jo ‘oof shonaaa’ feeling aata hai, uska replacement tumhare paas kabhi nehi hobe. Aur ekta advice: protein shake chod do, doi-bhaat start karo, toilet bhi smooth hobe."

Mehak:
"Tu na ekdam pagal hai Raj. Par sach bolu toh, teri gaali wali baat bhi badi pyaari lagti hai. Thoda vulgar, thoda cute… ekdum Kolkata special combo."

Raj:
"Aww shona, tum Delhi waali bhi mast ho, sab attitude ke peeche actually ek bhalo meye ache. Chal, ekdin South Delhi ka overpriced latte aur North Kolkata ka 10 taka cha compare karenge. Dekhte hain kon jite."

Mehak:
"Deal! Bas tu bill bharna, kyunki main South Delhi ki ladki hoon… main toh sirf daddy ke card swipe karti hoon."

Raj:
"Ae chele, ekta jhalmuri aur tum ekdam free, thik ache!"`

const characters = [
   { name: "Raj", voice: "Puck" },
   { name: "Mehak", voice: "Kore" }
];

// generateAudio(prompt, characters).then((id) => console.log("Audio file ID:", id));