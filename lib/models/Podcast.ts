import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacter extends Document {
  name: string;
  personality: string;
  voice: string;
  gender: string;
}

export interface IPodcast extends Document {
  title: string;
  description: string;
  concept: string;
  tone: string;
  frequency: string;
  length: string;
  characters: ICharacter[];
  topics: string[];
  episodes: mongoose.Schema.Types.ObjectId[];
  owner: string; // wallet address
}

const CharacterSchema: Schema = new Schema({
  name: { type: String, required: true },
  personality: { type: String, required: true },
  voice: { type: String, required: true },
  gender: { type: String, required: true },
});

const PodcastSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  concept: { type: String, required: true },
  tone: { type: String, required: true },
  frequency: { type: String, required: true },
  length: { type: String, required: true },
  characters: [CharacterSchema],
  topics: [{ type: String }],
  episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
  owner: { type: String, required: true }, // wallet address
}, { timestamps: true });

export const Podcast = mongoose.models.Podcast || mongoose.model<IPodcast>('Podcast', PodcastSchema);
