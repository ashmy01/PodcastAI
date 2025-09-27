import { generateAudio, generate } from "./generate";
import { Episode } from './models/Episode';
import { IPodcast } from "./models/Podcast";
import path from 'path';
import { parseUntilJson } from "./parseUntilJson";

function parseGeneratedScript(script: string): { summary: string, script: string, characters: any[] } {
    try {
        const parsed = parseUntilJson(script);
        return {
            summary: parsed.summary || '',
            script: parsed.script || '',
            characters: parsed.characters || [],
        };
    } catch (error) {
        console.error("Failed to parse generated script:", error);
        // Fallback for non-JSON script
        return {
            summary: "A new episode.",
            script: script,
            characters: [],
        };
    }
}

export async function runPipeline(podcast: IPodcast) {
    console.log(`Generating episode for: ${podcast.title}`);

    const previousEpisodes = await Episode.find({ podcast: podcast._id }).sort({ createdAt: -1 }).limit(5);

    const history = previousEpisodes.map(ep => ({
        title: ep.title,
        summary: ep.summary,
    }));

    const prompt = `
        You are an AI podcast script generator.
        Podcast Title: ${podcast.title}
        Podcast Concept: ${podcast.concept}
        Tone: ${podcast.tone}
        Topics: ${podcast.topics.join(', ')}

        Characters:
        ${podcast.characters.map(c => `- ${c.name}: ${c.personality} (Voice: ${c.voice})`).join('\n')}

        Previous Episodes (for context, avoid repetition):
        ${history.length > 0 ? history.map(h => `- ${h.title}: ${h.summary}`).join('\n') : 'None'}

        Please generate a new podcast script of approximately ${podcast.length} length.
        The script should be funny, engaging, and maintain consistent, quirky, human-like vocal characteristics for each character.
        
        Output the result as a single JSON object with the following fields:
        - "summary": A brief, one-sentence summary of the episode.
        - "title": A catchy title for this episode.
        - "script": The full script in the format:
            <CHARACTER_NAME>: <DIALOGUE>
            <CHARACTER_NAME>: <DIALOGUE>
        - "characters": An array of objects with "name" and "voice" for each character in the script.

        Example script format:
        CHARACTER 1: Hello world!
        CHARACTER 2: Oh, not this again.
    `;

    const generatedJson = await generate(prompt);
    const { summary, script, title } = parseGeneratedScript(generatedJson);
    
    const audioId = await generateAudio(script, podcast.characters.map(c => ({ name: c.name, voice: c.voice })));
    const audioUrl = `/audio/${audioId}.wav`;

    const newEpisode = new Episode({
        podcast: podcast._id,
        title: title || "Untitled Episode",
        summary,
        script,
        audioUrl,
        owner: podcast.owner, // Use the podcast owner's wallet address
    });

    await newEpisode.save();

    podcast.episodes.push(newEpisode._id);
    await podcast.save();

    console.log(`New episode "${newEpisode.title}" generated and saved.`);
    return newEpisode;
}
